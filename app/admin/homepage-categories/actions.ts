"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import {
  createDemoHomepageCategory,
  deleteDemoHomepageCategory,
  getHomepageCategories,
  updateDemoHomepageCategory,
} from "@/lib/homepage-category-service";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import {
  deleteHomepageCategoryImage,
  uploadHomepageCategoryImage,
} from "@/lib/supabase-storage";
import type { HomepageCategory } from "@/types";

const requiredLinkSchema = z
  .string()
  .trim()
  .min(1, "Link is required")
  .refine(
    (value) => {
      if (value.startsWith("/")) {
        return true;
      }

      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Link must be a valid URL or start with /" }
  );

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "Image is required")
  .refine(
    (value) => {
      if (value.startsWith("data:image/") || value.startsWith("/")) {
        return true;
      }

      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Image must be a valid URL or uploaded image." }
  );

const adminHomepageCategorySchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Title is required").max(80, "Keep it under 80 characters"),
  subtitle: z
    .string()
    .trim()
    .max(120, "Keep it under 120 characters")
    .optional()
    .or(z.literal("")),
  imageUrl: imageUrlSchema,
  link: requiredLinkSchema,
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export type AdminHomepageCategoryInput = z.infer<typeof adminHomepageCategorySchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function normalizeHomepageCategoryInput(input: AdminHomepageCategoryInput) {
  const data = adminHomepageCategorySchema.parse(input);

  return {
    id: data.id,
    title: data.title.trim(),
    subtitle: data.subtitle?.trim() || null,
    imageUrl: data.imageUrl.trim(),
    link: data.link.trim(),
    isActive: data.isActive,
    order: data.order,
  };
}

function revalidateHomepageCategoryPaths() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/homepage-categories");
}

export async function fetchAdminHomepageCategories() {
  await ensureAdmin();

  return getHomepageCategories();
}

export async function uploadHomepageCategoryImageAction(formData: FormData) {
  await ensureAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Please choose an image to upload.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported.");
  }

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
  await ensureAdmin();
  const data = normalizeHomepageCategoryInput(input);

  if (shouldUseMockData()) {
    const category = createDemoHomepageCategory({
      id: crypto.randomUUID(),
      title: data.title,
      subtitle: data.subtitle,
      imageUrl: data.imageUrl,
      link: data.link,
      isActive: data.isActive,
      order: data.order,
    });
    revalidateHomepageCategoryPaths();
    return category;
  }

  const category = await prisma.homepageCategory.create({
    data: {
      title: data.title,
      subtitle: data.subtitle,
      imageUrl: data.imageUrl,
      link: data.link,
      isActive: data.isActive,
      order: data.order,
    },
  });

  revalidateHomepageCategoryPaths();
  return category as HomepageCategory;
}

export async function updateAdminHomepageCategoryAction(input: AdminHomepageCategoryInput) {
  await ensureAdmin();
  const data = adminHomepageCategorySchema.extend({ id: z.string().min(1) }).parse(input);
  const normalized = normalizeHomepageCategoryInput(data);

  if (shouldUseMockData()) {
    const category = updateDemoHomepageCategory(data.id, {
      id: data.id,
      title: normalized.title,
      subtitle: normalized.subtitle,
      imageUrl: normalized.imageUrl,
      link: normalized.link,
      isActive: normalized.isActive,
      order: normalized.order,
    });
    revalidateHomepageCategoryPaths();
    return category;
  }

  const existingCategory = await prisma.homepageCategory.findUnique({
    where: { id: data.id },
  });
  if (!existingCategory) {
    throw new Error("Homepage category not found.");
  }

  const category = await prisma.homepageCategory.update({
    where: { id: data.id },
    data: {
      title: normalized.title,
      subtitle: normalized.subtitle,
      imageUrl: normalized.imageUrl,
      link: normalized.link,
      isActive: normalized.isActive,
      order: normalized.order,
    },
  });

  if (existingCategory.imageUrl !== normalized.imageUrl) {
    await deleteHomepageCategoryImage(existingCategory.imageUrl);
  }

  revalidateHomepageCategoryPaths();
  return category as HomepageCategory;
}

export async function deleteAdminHomepageCategoryAction(categoryId: string) {
  await ensureAdmin();
  const id = z.string().min(1).parse(categoryId);

  if (shouldUseMockData()) {
    deleteDemoHomepageCategory(id);
    revalidateHomepageCategoryPaths();
    return { deletedId: id };
  }

  const existingCategory = await prisma.homepageCategory.findUnique({
    where: { id },
  });

  await prisma.homepageCategory.delete({
    where: { id },
  });

  if (existingCategory?.imageUrl) {
    await deleteHomepageCategoryImage(existingCategory.imageUrl);
  }

  revalidateHomepageCategoryPaths();
  return { deletedId: id };
}
