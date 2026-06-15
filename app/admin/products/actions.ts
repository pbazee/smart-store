"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { buildAdminProductCreateData } from "@/lib/admin-products";
import { requireAdminAuth } from "@/lib/auth-utils";
import { PRODUCTS_CACHE_TAG } from "@/lib/data-service";
import { HOMEPAGE_CACHE_TAG, HOMEPAGE_PRODUCTS_CACHE_TAG } from "@/lib/homepage-data";
import { prisma } from "@/lib/prisma";
import {
  buildInvalidCatalogProductWhere,
  resolveAdminProductCatalogAssignment,
} from "@/lib/product-integrity";
import {
  deleteProductVariantImage,
  deleteStoreAsset,
  uploadProductVariantImage,
  uploadStoreAsset,
} from "@/lib/supabase-storage";
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
  variantImageUrl: z.string().trim().url().nullable().optional(),
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
  variants: z.array(adminVariantSchema).default([]),
}).passthrough();

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
      variantImageUrl: true,
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
  revalidateTag(PRODUCTS_CACHE_TAG);
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidateTag(HOMEPAGE_PRODUCTS_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
}

function revalidateProductDetail(product: Pick<Product, "id" | "slug">, previousSlug?: string | null) {
  const slugs = Array.from(
    new Set([product.slug, previousSlug].filter((slug): slug is string => Boolean(slug)))
  );

  revalidateTag(`product:${product.id}`);
  for (const slug of slugs) {
    revalidateTag(`product:${slug}`);
    revalidatePath(`/product/${slug}`);
  }
}

async function normalizeAdminProductInput(input: AdminProductInput) {
  const catalogAssignment = await resolveAdminProductCatalogAssignment({
    categoryId: input.categoryId ?? null,
    category: input.category,
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
  const where: Prisma.ProductWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  console.log("[AdminProductsAction] Fetching products", { skip, take, search, where });

  return (await prisma.product.findMany({
    where,
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
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {},
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

export async function uploadProductVariantImageAction(formData: FormData) {
  await ensureAdmin();
  const file = formData.get("file");
  const productId = z.string().trim().min(1).parse(formData.get("productId"));
  const variantId = z.string().trim().min(1).parse(formData.get("variantId"));

  if (!(file instanceof File)) {
    throw new Error("Please choose an image to upload.");
  }

  if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Please use a JPG, PNG, or WebP image.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image too large — please use an image under 5MB");
  }

  const imageUrl = await uploadProductVariantImage(file, productId, variantId);
  return { imageUrl };
}

export async function uploadProductImageAction(formData: FormData) {
  await ensureAdmin();
  const file = formData.get("file");
  const productId = z.string().trim().min(1).parse(formData.get("productId"));

  if (!(file instanceof File)) {
    throw new Error("Please choose an image to upload.");
  }

  if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Please use a JPG, PNG, or WebP image.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image too large - please use an image under 5MB");
  }

  const imageUrl = await uploadStoreAsset(file, "product-image", `products/${productId}`);
  return { imageUrl };
}

export async function cleanupProductVariantImageAction(imageUrl: string) {
  await ensureAdmin();
  const normalizedImageUrl = z.string().trim().min(1).parse(imageUrl);
  await deleteProductVariantImage(normalizedImageUrl);
  return { cleaned: true };
}

export async function cleanupProductImageAction(imageUrl: string) {
  await ensureAdmin();
  const normalizedImageUrl = z.string().trim().min(1).parse(imageUrl);
  await deleteStoreAsset(normalizedImageUrl);
  return { cleaned: true };
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
  revalidateProductDetail(product);
  return product as Product;
}

export async function updateAdminProductAction(input: AdminProductInput) {
  await ensureAdmin();
  const data = adminProductSchema.extend({ id: z.string().min(1) }).parse(input);
  const normalizedData = await normalizeAdminProductUpdateInput(data);
  const existingProduct = await prisma.product.findUnique({
    where: { id: normalizedData.id },
    select: { slug: true },
  });

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
          variantImageUrl: variant.variantImageUrl ?? null,
        })),
      },
    },
    select: adminProductListSelect,
  });

  revalidateCatalogPaths();
  revalidateProductDetail(product, existingProduct?.slug);
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

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, slug: true },
  });

  await prisma.product.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

  revalidateCatalogPaths();
  products.forEach((p) => {
    revalidateProductDetail(p);
  });
  return { deletedIds: ids };
}
