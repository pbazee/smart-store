import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-utils";
import { buildAdminProductDeleteOperations } from "@/lib/admin-products";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const updateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  basePrice: z.number().optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
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

    const product = await prisma.product.update({
      where: { id },
      data: validatedData,
      include: { variants: true },
    });

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/products");

    return NextResponse.json({ success: true, data: product });
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

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/products");

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
