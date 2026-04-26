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
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  category: z.string().optional(),
  categoryId: z.string().min(1).optional().nullable(),
  subcategory: z.string().min(2).optional(),
  gender: z.enum(["men", "women", "unisex", "children", "male", "female"]).optional(),
  basePrice: z.number().int().positive().optional(),
  images: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

function revalidateProductSurfaces() {
  revalidateTag(PRODUCTS_CACHE_TAG);
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/wishlist");
  revalidatePath("/admin/products");
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

    const catalogAssignment = await resolveAdminProductCatalogAssignment({
      categoryId: validatedData.categoryId ?? existingProduct.categoryId ?? null,
      subcategory: validatedData.subcategory ?? existingProduct.subcategory,
    });

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...validatedData,
        slug: slugify(validatedData.slug ?? validatedData.name ?? existingProduct.slug),
        ...catalogAssignment,
      },
      include: { variants: true },
    });

    revalidateProductSurfaces();

    return NextResponse.json(
      { success: true, data: product },
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

    revalidateProductSurfaces();

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
