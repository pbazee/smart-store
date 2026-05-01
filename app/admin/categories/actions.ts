"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-utils";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { CATEGORY_CACHE_TAG, getActiveCategories, getAllCategories } from "@/lib/category-service";
import { ensureCategoryHomepageFields } from "@/lib/runtime-schema-repair";

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
  isHomepageVisible: z.boolean().optional().default(false),
  homepageSubtitle: z.string().optional().nullable(),
  homepageImageUrl: z.string().optional().nullable(),
  homepageOrder: z.number().int().optional().default(0),
});

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

const getCachedAllAdminCategories = unstable_cache(
  async () => {
    const categories = await getAllCategories();
    // If the DB has no child categories yet, fall back to the seeded defaults
    const hasChildren = categories.some((c) => c.parentId !== null);
    if (!hasChildren) {
      return getActiveCategories();
    }
    return categories;
  },
  ["admin-all-categories"],
  {
    revalidate: 60,
    tags: [CATEGORY_CACHE_TAG, HOMEPAGE_CACHE_TAG],
  }
);

export async function fetchCategoriesAction() {
  await ensureAdmin();
  try {
    return await getCachedAllAdminCategories();
  } catch {
    return getActiveCategories();
  }
}

const getCachedTopLevelCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
  ["admin-top-level-categories"],
  {
    revalidate: 60,
    tags: [CATEGORY_CACHE_TAG, HOMEPAGE_CACHE_TAG],
  }
);

export async function fetchTopLevelCategoriesAction() {
  await ensureAdmin();

  try {
    const categories = await getCachedTopLevelCategories();
    if (categories.length > 0) {
      return categories;
    }

    return (await getActiveCategories()).filter((category) => !category.parentId);
  } catch {
    return (await getActiveCategories()).filter((category) => !category.parentId);
  }
}

export async function upsertCategoryAction(input: z.infer<typeof categorySchema>) {
  await ensureAdmin();
  await ensureCategoryHomepageFields();
  const data = categorySchema.parse(input);
  const category = await prisma.category.upsert({
    where: { id: data.id ?? "" },
    update: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId ?? null,
      order: data.order ?? 0,
      isActive: data.isActive ?? true,
      isHomepageVisible: data.isHomepageVisible ?? false,
      homepageSubtitle: data.homepageSubtitle ?? null,
      homepageImageUrl: data.homepageImageUrl ?? null,
      homepageOrder: data.homepageOrder ?? 0,
    },
    create: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId ?? null,
      order: data.order ?? 0,
      isActive: data.isActive ?? true,
      isHomepageVisible: data.isHomepageVisible ?? false,
      homepageSubtitle: data.homepageSubtitle ?? null,
      homepageImageUrl: data.homepageImageUrl ?? null,
      homepageOrder: data.homepageOrder ?? 0,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidateTag(CATEGORY_CACHE_TAG);
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/products");
  return category;
}

export async function deleteCategoryAction(id: string) {
  await ensureAdmin();
  const hasProducts = await prisma.product.count({ where: { categoryId: id } });
  const hasChildren = await prisma.category.count({ where: { parentId: id } });

  if (hasProducts > 0 || hasChildren > 0) {
    throw new Error("Cannot delete: category has products or children");
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidateTag(CATEGORY_CACHE_TAG);
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/products");
}
