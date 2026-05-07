import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-utils";
import { buildAdminProductDeleteOperations } from "@/lib/admin-products";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { PRODUCTS_CACHE_TAG } from "@/lib/data-service";
import {
  buildValidCatalogProductWhere,
  resolveAdminProductCatalogAssignment,
} from "@/lib/product-integrity";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const updateProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  productType: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().min(1).nullable(),
  subcategory: z.string().optional().nullable().default(""),
  gender: z.enum(["men", "women", "unisex", "children", "male", "female"]),
  basePrice: z.number().int().positive(),
  baseStock: z.number().int().nonnegative().nullable().optional(),
  images: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        color: z.string().min(1),
        colorHex: z.string().min(1),
        size: z.string().min(1),
        stock: z.number().int().nonnegative(),
        price: z.number().int().positive(),
        variantImageUrl: z.string().trim().optional().nullable(),
      })
    )
    .default([]),
}).strip();

type RouteContext = {
  params: Promise<{ id: string }>;
};

function revalidateProductSurfaces(product?: { slug?: string | null }, previousSlug?: string | null) {
  revalidateTag(PRODUCTS_CACHE_TAG);
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/wishlist");
  revalidatePath("/admin/products");

  const slugs = new Set([product?.slug, previousSlug].filter(Boolean));
  slugs.forEach((slug) => {
    revalidatePath(`/product/${slug}`);
    revalidatePath(`/shop/${slug}`);
  });
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: buildValidCatalogProductWhere({ id }),
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, data: product },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateProductSchema.parse(body);
    const { id } = await params;
    const existingProduct = await prisma.product.findFirst({
      where: buildValidCatalogProductWhere({ id }),
      include: { variants: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const previousBaseStock = existingProduct.baseStock ?? null;
    const previousVariantStock = existingProduct.variants.reduce((sum, variant) => sum + variant.stock, 0);
    const requestedSubcategory = validatedData.subcategory?.trim() ?? "";
    const catalogAssignment = await resolveAdminProductCatalogAssignment({
      categoryId: validatedData.categoryId ?? existingProduct.categoryId ?? null,
      category: validatedData.category ?? existingProduct.category,
      subcategory: requestedSubcategory.length > 0 ? requestedSubcategory : null,
    });

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: validatedData.name,
        slug: slugify(validatedData.slug || validatedData.name || existingProduct.slug),
        description: validatedData.description,
        gender: validatedData.gender,
        basePrice: validatedData.basePrice,
        baseStock: validatedData.baseStock ?? null,
        images: validatedData.images,
        tags: validatedData.tags,
        isFeatured: validatedData.isFeatured ?? false,
        isNew: validatedData.isNew ?? false,
        isPopular: validatedData.isPopular ?? false,
        isTrending: validatedData.isTrending ?? false,
        isRecommended: validatedData.isRecommended ?? false,
        ...catalogAssignment,
        variants: {
          deleteMany: {},
          create: validatedData.variants.map((variant) => ({
            color: variant.color,
            colorHex: variant.colorHex,
            size: variant.size,
            stock: variant.stock,
            price: variant.price,
            variantImageUrl: variant.variantImageUrl ?? null,
          })),
        },
      },
      include: { variants: true },
    });

    const nextVariantStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
    const stockIncreased =
      (validatedData.variants.length === 0
        ? (validatedData.baseStock ?? null) !== null &&
          (validatedData.baseStock ?? 0) > (previousBaseStock ?? 0)
        : nextVariantStock > previousVariantStock);
    const pendingRestockCount = stockIncreased
      ? await prisma.restockNotification.count({
          where: {
            productId: product.id,
            notified: false,
          },
        })
      : 0;

    revalidateProductSurfaces(product, existingProduct.slug);

    return NextResponse.json(
      { success: true, data: product, meta: { pendingRestockCount } },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error("Error updating product:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const operations = buildAdminProductDeleteOperations(id);

    await prisma.variant.deleteMany({
      where: operations.variantWhere,
    });

    const product = await prisma.product.delete({
      where: operations.productWhere,
    });

    revalidateProductSurfaces(undefined, product.slug);

    return NextResponse.json(
      { success: true, data: product },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
