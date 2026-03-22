"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { buildAdminProductCreateData } from "@/lib/admin-products";
import {
  createDemoProduct,
  deleteDemoProducts,
  getDemoProducts,
  updateDemoProduct,
} from "@/lib/demo-catalog";
import { requireAdminAuth } from "@/lib/auth-utils";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { mockProducts } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import {
  buildInvalidCatalogProductWhere,
  buildValidCatalogProductWhere,
  resolveAdminProductCatalogAssignment,
} from "@/lib/product-integrity";
import { slugify } from "@/lib/utils";
import { getHomepageSubcategoriesForCategory } from "@/lib/homepage-category-service";
import type { HomepageCategory, Product } from "@/types";

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
  variants: z.array(adminVariantSchema).min(1, "Add at least one variant"),
});

export type AdminProductInput = z.infer<typeof adminProductSchema>;
const LEGACY_SEEDED_PRODUCT_IDS = mockProducts.map((product) => product.id);

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function revalidateCatalogPaths() {
  revalidateTag(HOMEPAGE_CACHE_TAG);
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

function toDemoProduct(input: AdminProductInput, current?: Product | null): Product {
  return {
    id: current?.id ?? crypto.randomUUID(),
    name: input.name,
    slug: slugify(input.slug || input.name),
    description: input.description,
    category: input.category,
    subcategory: input.subcategory,
    categoryId: input.categoryId ?? null,
    gender: input.gender,
    tags: input.tags,
    basePrice: input.basePrice,
    images: input.images,
    rating: current?.rating ?? 0,
    reviewCount: current?.reviewCount ?? 0,
    isFeatured: input.isFeatured,
    isNew: input.isNew,
    variants: input.variants.map((variant) => ({
      id: variant.id ?? crypto.randomUUID(),
      color: variant.color,
      colorHex: variant.colorHex,
      size: variant.size,
      stock: variant.stock,
      price: variant.price,
    })),
  };
}

export async function fetchAdminProducts() {
  await ensureAdmin();

  if (shouldUseMockData()) {
    return getDemoProducts();
  }

  return (await prisma.product.findMany({
    where: buildValidCatalogProductWhere(),
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  })) as Product[];
}

export async function fetchInvalidAdminProductCount() {
  await ensureAdmin();

  if (shouldUseMockData()) {
    return 0;
  }

  return prisma.product.count({
    where: buildInvalidCatalogProductWhere(LEGACY_SEEDED_PRODUCT_IDS),
  });
}

export async function fetchHomepageSubcategoriesAction(
  parentCategoryId: string | null
): Promise<HomepageCategory[]> {
  await ensureAdmin();

  if (!parentCategoryId) {
    return [];
  }

  return getHomepageSubcategoriesForCategory(parentCategoryId);
}

export async function createAdminProductAction(input: AdminProductInput) {
  await ensureAdmin();
  const data = adminProductSchema.parse(input);
  const normalizedData = await normalizeAdminProductInput(data);

  if (shouldUseMockData()) {
    const product = createDemoProduct(toDemoProduct(normalizedData));
    revalidateCatalogPaths();
    return product;
  }

  const product = await prisma.product.create({
    data: buildAdminProductCreateData({
      ...normalizedData,
      categoryId: normalizedData.categoryId ?? null,
    }),
    include: { variants: true },
  });

  revalidateCatalogPaths();
  return product as Product;
}

export async function updateAdminProductAction(input: AdminProductInput) {
  await ensureAdmin();
  const data = adminProductSchema.extend({ id: z.string().min(1) }).parse(input);
  const normalizedData = await normalizeAdminProductUpdateInput(data);

  if (shouldUseMockData()) {
    const current = getDemoProducts().find((product) => product.id === normalizedData.id);
    if (!current) {
      throw new Error("Product not found");
    }

    const product = updateDemoProduct(normalizedData.id, toDemoProduct(normalizedData, current));
    revalidateCatalogPaths();
    return product;
  }

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
    include: { variants: true },
  });

  revalidateCatalogPaths();
  return product as Product;
}

export async function deleteInvalidAdminProductsAction() {
  await ensureAdmin();

  if (shouldUseMockData()) {
    return { deletedCount: 0 };
  }

  const result = await prisma.product.deleteMany({
    where: buildInvalidCatalogProductWhere(LEGACY_SEEDED_PRODUCT_IDS),
  });

  revalidateCatalogPaths();
  return {
    deletedCount: result.count,
  };
}

export async function deleteAdminProductsAction(productIds: string[]) {
  await ensureAdmin();
  const ids = z.array(z.string().min(1)).min(1).parse(productIds);

  if (shouldUseMockData()) {
    deleteDemoProducts(ids);
    revalidateCatalogPaths();
    return { deletedIds: ids };
  }

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
