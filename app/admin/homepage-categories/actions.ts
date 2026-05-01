"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { getActiveCategories } from "@/lib/category-service";
import { prisma } from "@/lib/prisma";
import { ensureCategoryHomepageFields } from "@/lib/runtime-schema-repair";
import { deleteHomepageCategoryImage, uploadHomepageCategoryImage } from "@/lib/supabase-storage";
import { slugify } from "@/lib/utils";
import type { Category, HomepageCategory } from "@/types";

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "Image is required")
  .refine(
    (value) => {
      if (value.startsWith("data:image/") || value.startsWith("/")) return true;
      try { new URL(value); return true; } catch { return false; }
    },
    { message: "Image must be a valid URL or uploaded image." }
  );

const adminHomepageCategorySchema = z.object({
  id: z.string().min(1),
  subtitle: z.string().trim().max(120, "Keep it under 120 characters").optional().or(z.literal("")),
  imageUrl: imageUrlSchema,
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export type AdminHomepageCategoryInput = z.infer<typeof adminHomepageCategorySchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) throw new Error("Unauthorized");
}

function normalizeHomepageCategoryInput(input: AdminHomepageCategoryInput) {
  const data = adminHomepageCategorySchema.parse(input);
  return {
    id: data.id,
    subtitle: data.subtitle?.trim() || null,
    imageUrl: data.imageUrl.trim(),
    isActive: data.isActive,
    order: data.order,
  };
}

function revalidateHomepageCategoryPaths() {
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/homepage-categories");
}

function toHomepageCategory(category: Category): HomepageCategory {
  return {
    id: category.id,
    title: category.name,
    subtitle: category.homepageSubtitle?.trim() || category.description?.trim() || null,
    imageUrl: category.homepageImageUrl || "/images/product-placeholder.png",
    link: category.parentId
      ? `/shop?category=${encodeURIComponent(category.parentId)}&subcategory=${encodeURIComponent(category.slug)}`
      : `/shop?category=${encodeURIComponent(category.slug)}`,
    parentCategoryId: category.parentId ?? null,
    order: category.homepageOrder ?? category.order ?? 0,
    isActive: category.isHomepageVisible ?? false,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export async function fetchAdminHomepageCategories() {
  await ensureAdmin();
  await ensureCategoryHomepageFields();

  try {
    const categories = await getActiveCategories();
    return categories
      .filter((category) => !category.parentId || category.parentId)
      .map(toHomepageCategory)
      .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
  } catch (error) {
    console.error("[AdminHomepageCategories] Failed to load categories:", error);
    return [];
  }
}

export async function uploadHomepageCategoryImageAction(formData: FormData) {
  await ensureAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Please choose an image to upload.");
  if (!file.type.startsWith("image/")) throw new Error("Only image uploads are supported.");
  const imageUrl = await uploadHomepageCategoryImage(file);
  return { imageUrl };
}

export async function cleanupHomepageCategoryImageAction(imageUrl: string) {
  await ensureAdmin();
  const normalizedImageUrl = z.string().trim().min(1).parse(imageUrl);
  await deleteHomepageCategoryImage(normalizedImageUrl);
  return { cleaned: true };
}

export async function createAdminHomepageCategoryAction(input: AdminHomepageCategoryInput) {
  return updateAdminHomepageCategoryAction(input);
}

export async function updateAdminHomepageCategoryAction(input: AdminHomepageCategoryInput) {
  await ensureAdmin();
  await ensureCategoryHomepageFields();
  const data = adminHomepageCategorySchema.parse(input);
  const normalized = normalizeHomepageCategoryInput(data);
  const existingCategory = await prisma.category.findUnique({ where: { id: data.id } });
  if (!existingCategory) throw new Error("Category not found.");

  const category = await prisma.category.update({
    where: { id: data.id },
    data: {
      isHomepageVisible: normalized.isActive,
      homepageSubtitle: normalized.subtitle,
      homepageImageUrl: normalized.imageUrl,
      homepageOrder: normalized.order,
    },
  });

  if (existingCategory.homepageImageUrl && existingCategory.homepageImageUrl !== normalized.imageUrl) {
    await deleteHomepageCategoryImage(existingCategory.homepageImageUrl);
  }

  revalidateHomepageCategoryPaths();
  return toHomepageCategory(category as Category);
}

export async function deleteAdminHomepageCategoryAction(categoryId: string) {
  await ensureAdmin();
  await ensureCategoryHomepageFields();
  const id = z.string().min(1).parse(categoryId);
  const existingCategory = await prisma.category.findUnique({ where: { id } });
  if (!existingCategory) {
    throw new Error("Category not found.");
  }

  await prisma.category.update({
    where: { id },
    data: {
      isHomepageVisible: false,
      homepageSubtitle: null,
      homepageImageUrl: null,
      homepageOrder: 0,
    },
  });

  if (existingCategory.homepageImageUrl) {
    await deleteHomepageCategoryImage(existingCategory.homepageImageUrl);
  }

  revalidateHomepageCategoryPaths();
  return { deletedId: id };
}
