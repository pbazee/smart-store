import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-utils";
import { buildAdminProductCreateData } from "@/lib/admin-products";
import { releaseExpiredReservations } from "@/lib/order-reservations";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const genderSchema = z.enum(["men", "women", "unisex", "children", "male", "female"]);

const createProductSchema = z.object({
  name: z.string().min(2, "Name required"),
  slug: z.string().min(2, "Slug required"),
  description: z.string().min(1, "Description required"),
  category: z.enum(["shoes", "clothes", "accessories"]),
  subcategory: z.string().min(1, "Subcategory required"),
  gender: genderSchema,
  basePrice: z.number().int().positive("Price must be positive"),
  images: z.array(z.string().min(1, "Image required")).min(1, "At least one image is required"),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  variants: z
    .array(
      z.object({
        color: z.string().min(1, "Color required"),
        colorHex: z.string().min(1, "Color hex required"),
        size: z.string().min(1, "Size required"),
        stock: z.number().int().nonnegative(),
        price: z.number().int().positive(),
      })
    )
    .min(1, "At least one variant is required"),
});

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await releaseExpiredReservations();

    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createProductSchema.parse(body);

    const product = await prisma.product.create({
      data: buildAdminProductCreateData(validatedData),
      include: { variants: true },
    });

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/products");

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
