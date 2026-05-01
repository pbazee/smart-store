"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { buildAdminProductCreateData } from "@/lib/admin-products";
import { requireAdminAuth } from "@/lib/auth-utils";
import { PRODUCTS_CACHE_TAG } from "@/lib/data-service";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { prisma } from "@/lib/prisma";
import {
  buildInvalidCatalogProductWhere,
  buildValidCatalogProductWhere,
  resolveAdminProductCatalogAssignment,
} from "@/lib/product-integrity";
import { slugify } from "@/lib/utils";
import { getChildCategories } from "@/lib/category-service";
import type { Category, Product } from "@/types";

const adminVariantSchema = z.object({
  id: z.string().optional(),
  color: z.string().min(1, "Color is required"),
  colorHex: z.string().min(1, "Color swatch is required"),
  size: z.string().min(1, "Size is required"),
  stock: z.number().int().nonnegative(),
  price: z.number().int().positive(),
});

const adminProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().min(10, "Description is too short"),
  category: z.string().min(2, "Category is required"),
  subcategory: z.string().min(2, "Subcategory is required"),
  categoryId: z.string().optional().nullable(),
  gender: z.enum(["men", "women", "unisex", "children"]),
  basePrice: z.number().int().positive(),
  images: z.array(z.string().min(1)).min(1, "At least one image is required"),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  variants: z.array(adminVariantSchema).min(1, "Add at least one variant"),
});

const adminProductListSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  category: true,
  subcategory: true,
  categoryId: true,
  gender: true,
  tags: true,
  basePrice: true,
  images: true,
  rating: true,
  reviewCount: true,
  isFeatured: true,
  isNew: true,
  isPopular: true,
  isTrending: true,
  isRecommended: true,
  createdAt: true,
  updatedAt: true,
  variants: {
    select: {
      id: true,
      color: true,
      colorHex: true,
      size: true,
      stock: true,
      price: true,
    },
  },
} as const;

export type AdminProductInput = z.infer<typeof adminProductSchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function revalidateCatalogPaths() {
  revalidateTag('products');
  revalidateTag('homepage-products');
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/wishlist");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
}

async function normalizeAdminProductInput(input: AdminProductInput) {
  const catalogAssignment = await resolveAdminProductCatalogAssignment({
    categoryId: input.categoryId ?? null,
    subcategory: input.subcategory,
  });

  return {
    ...input,
    slug: slugify(input.slug || input.name),
    ...catalogAssignment,
  };
}

async function normalizeAdminProductUpdateInput(
  input: AdminProductInput & { id: string }
) {
  const normalizedInput = await normalizeAdminProductInput(input);

  return {
    ...normalizedInput,
    id: input.id,
  };
}

export async function fetchAdminProducts(params?: { skip?: number; take?: number; search?: string }) {
  await ensureAdmin();
  const { skip, take, search } = params || {};

  return (await prisma.product.findMany({
    where: search 
      ? buildValidCatalogProductWhere({
          OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
          ],
        })
      : buildValidCatalogProductWhere(),
    orderBy: { createdAt: "desc" },
    skip,
    take,
    select: adminProductListSelect,
  })) as Product[];
}

export async function fetchAdminProductCount(search?: string) {
    await ensureAdmin();
    return prisma.product.count({
        where: search 
          ? buildValidCatalogProductWhere({
              OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { slug: { contains: search, mode: "insensitive" } },
              ],
            })
          : buildValidCatalogProductWhere(),
    });
}

export async function fetchInvalidAdminProductCount() {
  await ensureAdmin();

  return prisma.product.count({
    where: buildInvalidCatalogProductWhere([]),
  });
}

export async function fetchHomepageSubcategoriesAction(
  parentCategoryId: string | null
): Promise<Category[]> {
  await ensureAdmin();

  if (!parentCategoryId) {
    return [];
  }

  return getChildCategories(parentCategoryId);
}

export async function createAdminProductAction(input: AdminProductInput) {
  await ensureAdmin();
  const data = adminProductSchema.parse(input);
  const normalizedData = await normalizeAdminProductInput(data);

  const product = await prisma.product.create({
    data: buildAdminProductCreateData({
      ...normalizedData,
      categoryId: normalizedData.categoryId ?? null,
    }),
    select: adminProductListSelect,
  });

  revalidateCatalogPaths();
  return product as Product;
}

export async function updateAdminProductAction(input: AdminProductInput) {
  await ensureAdmin();
  const data = adminProductSchema.extend({ id: z.string().min(1) }).parse(input);
  const normalizedData = await normalizeAdminProductUpdateInput(data);

  const product = await prisma.product.update({
    where: { id: normalizedData.id },
    data: {
      name: normalizedData.name,
      slug: normalizedData.slug,
      description: normalizedData.description,
      category: normalizedData.category,
      subcategory: normalizedData.subcategory,
      categoryId: normalizedData.categoryId ?? null,
      gender: normalizedData.gender,
      tags: normalizedData.tags,
      basePrice: normalizedData.basePrice,
      images: normalizedData.images,
      isFeatured: normalizedData.isFeatured,
      isNew: normalizedData.isNew,
      isPopular: normalizedData.isPopular,
      isTrending: normalizedData.isTrending,
      isRecommended: normalizedData.isRecommended,
      variants: {
        deleteMany: {},
        create: normalizedData.variants.map((variant) => ({
          color: variant.color,
          colorHex: variant.colorHex,
          size: variant.size,
          stock: variant.stock,
          price: variant.price,
        })),
      },
    },
    select: adminProductListSelect,
  });

  revalidateCatalogPaths();
  return product as Product;
}

export async function deleteInvalidAdminProductsAction() {
  await ensureAdmin();

  const result = await prisma.product.deleteMany({
    where: buildInvalidCatalogProductWhere([]),
  });

  revalidateCatalogPaths();
  return {
    deletedCount: result.count,
  };
}

export async function deleteAdminProductsAction(productIds: string[]) {
  await ensureAdmin();
  const ids = z.array(z.string().min(1)).min(1).parse(productIds);

  await prisma.product.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

  revalidateCatalogPaths();
  return { deletedIds: ids };
}
