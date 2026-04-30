import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-utils";
import { CATEGORY_CACHE_TAG } from "@/lib/category-service";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { ensureCategoryHomepageFields } from "@/lib/runtime-schema-repair";

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
  isHomepageVisible: z.boolean().optional().default(false),
  homepageSubtitle: z.string().optional().nullable(),
  homepageImageUrl: z.string().optional().nullable(),
  homepageOrder: z.number().int().optional().default(0),
});

function revalidateCategorySurfaces() {
  revalidateTag(CATEGORY_CACHE_TAG);
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
}

export async function GET() {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureCategoryHomepageFields();
    const categories = await prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { order: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(
      { success: true, data: categories },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureCategoryHomepageFields();
    const payload = categorySchema.parse(await request.json());

    if (payload.parentId && payload.parentId === payload.id) {
      return NextResponse.json(
        { error: "A category cannot be its own parent." },
        { status: 400 }
      );
    }

    const category = payload.id
      ? await prisma.category.update({
          where: { id: payload.id },
          data: {
            name: payload.name,
            slug: payload.slug,
            description: payload.description,
            parentId: payload.parentId ?? null,
            order: payload.order ?? 0,
            isActive: payload.isActive ?? true,
            isHomepageVisible: payload.isHomepageVisible ?? false,
            homepageSubtitle: payload.homepageSubtitle ?? null,
            homepageImageUrl: payload.homepageImageUrl ?? null,
            homepageOrder: payload.homepageOrder ?? 0,
          },
        })
      : await prisma.category.create({
          data: {
            name: payload.name,
            slug: payload.slug,
            description: payload.description,
            parentId: payload.parentId ?? null,
            order: payload.order ?? 0,
            isActive: payload.isActive ?? true,
            isHomepageVisible: payload.isHomepageVisible ?? false,
            homepageSubtitle: payload.homepageSubtitle ?? null,
            homepageImageUrl: payload.homepageImageUrl ?? null,
            homepageOrder: payload.homepageOrder ?? 0,
          },
        });

    revalidateCategorySurfaces();

    return NextResponse.json(
      { success: true, data: category },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
    }

    console.error("Failed to save category:", error);
    return NextResponse.json({ error: "Failed to save category" }, { status: 500 });
  }
}
