"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-utils";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { getActiveCategories } from "@/lib/category-service";

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

export async function fetchCategoriesAction() {
  await ensureAdmin();
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { order: "asc" }, { name: "asc" }],
    });
    // If the DB has no child categories yet, fall back to the seeded defaults
    const hasChildren = categories.some((c) => c.parentId !== null);
    if (!hasChildren) {
      return getActiveCategories();
    }
    return categories;
  } catch {
    return getActiveCategories();
  }
}

export async function upsertCategoryAction(input: z.infer<typeof categorySchema>) {
  await ensureAdmin();
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
    },
    create: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId ?? null,
      order: data.order ?? 0,
      isActive: data.isActive ?? true,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
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
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/products");
}
