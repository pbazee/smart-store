"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildAdminProductCreateData } from "@/lib/admin-products";
import {
  createDemoProduct,
  deleteDemoProducts,
  getDemoProducts,
  updateDemoProduct,
} from "@/lib/demo-catalog";
import { requireAdminAuth } from "@/lib/auth-utils";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { Product } from "@/types";

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
  category: z.enum(["shoes", "clothes", "accessories"]),
  subcategory: z.string().min(2, "Subcategory is required"),
  gender: z.enum(["men", "women", "unisex"]),
  basePrice: z.number().int().positive(),
  images: z.array(z.string().min(1)).min(1, "At least one image is required"),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(true),
  variants: z.array(adminVariantSchema).min(1, "Add at least one variant"),
});

export type AdminProductInput = z.infer<typeof adminProductSchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function revalidateCatalogPaths() {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/wishlist");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
}

function toDemoProduct(input: AdminProductInput, current?: Product | null): Product {
  return {
    id: current?.id ?? crypto.randomUUID(),
    name: input.name,
    slug: slugify(input.slug || input.name),
    description: input.description,
    category: input.category,
    subcategory: input.subcategory,
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
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  })) as Product[];
}

export async function createAdminProductAction(input: AdminProductInput) {
  await ensureAdmin();
  const data = adminProductSchema.parse(input);

  if (shouldUseMockData()) {
    const product = createDemoProduct(toDemoProduct(data));
    revalidateCatalogPaths();
    return product;
  }

  const product = await prisma.product.create({
    data: buildAdminProductCreateData({
      ...data,
      slug: slugify(data.slug || data.name),
    }),
    include: { variants: true },
  });

  revalidateCatalogPaths();
  return product as Product;
}

export async function updateAdminProductAction(input: AdminProductInput) {
  await ensureAdmin();
  const data = adminProductSchema.extend({ id: z.string().min(1) }).parse(input);

  if (shouldUseMockData()) {
    const current = getDemoProducts().find((product) => product.id === data.id);
    if (!current) {
      throw new Error("Product not found");
    }

    const product = updateDemoProduct(data.id, toDemoProduct(data, current));
    revalidateCatalogPaths();
    return product;
  }

  const product = await prisma.product.update({
    where: { id: data.id },
    data: {
      name: data.name,
      slug: slugify(data.slug || data.name),
      description: data.description,
      category: data.category,
      subcategory: data.subcategory,
      gender: data.gender,
      tags: data.tags,
      basePrice: data.basePrice,
      images: data.images,
      isFeatured: data.isFeatured,
      isNew: data.isNew,
      variants: {
        deleteMany: {},
        create: data.variants.map((variant) => ({
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
