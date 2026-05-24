import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-utils";
import { buildAdminProductCreateData } from "@/lib/admin-products";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { PRODUCTS_CACHE_TAG } from "@/lib/data-service";
import { resolveAdminProductCatalogAssignment } from "@/lib/product-integrity";
import { isHiddenDefaultVariant } from "@/lib/product-stock";
import { slugify } from "@/lib/utils";

const genderSchema = z.enum(["men", "women", "unisex", "children", "male", "female"]);

const createProductSchema = z.object({
  name: z.string().min(2, "Name required"),
  slug: z.string().min(2, "Slug required"),
  description: z.string().min(10, "Description required"),
  productType: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().min(1, "Category required"),
  subcategory: z.string().optional().nullable().default(""),
  gender: genderSchema,
  basePrice: z.number().int().positive("Price must be positive"),
  images: z.array(z.string().min(1, "Image required")).min(1, "At least one image is required"),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        color: z.string().min(1, "Color required"),
        colorHex: z.string().min(1, "Color hex required"),
        size: z.string().min(1, "Size required"),
        stock: z.number().int().nonnegative(),
        price: z.number().int().positive(),
        variantImageUrl: z.string().trim().url().nullable().optional(),
      })
    )
    .default([]),
}).strip();

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

function normalizeVariantInput(
  variants: Array<{
    id?: string;
    color: string;
    colorHex: string;
    size: string;
    stock: number;
    price: number;
    variantImageUrl?: string | null;
  }>,
  basePrice: number
) {
  return variants.map((variant) => ({
    color: variant.color,
    colorHex: variant.colorHex,
    size: variant.size,
    stock: variant.stock,
    price: isHiddenDefaultVariant(variant) ? basePrice : variant.price,
    variantImageUrl: variant.variantImageUrl ?? null,
  }));
}

function revalidateProductSurfaces(product?: { slug?: string | null }) {
  revalidateTag(PRODUCTS_CACHE_TAG);
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/wishlist");
  revalidatePath("/admin/products");

  if (product?.slug) {
    revalidatePath(`/product/${product.slug}`);
    revalidatePath(`/shop/${product.slug}`);
  }
}

function buildAdminProductSearchWhere(search?: string) {
  if (!search?.trim()) {
    return {};
  }

  return {
    OR: [
      { name: { contains: search.trim(), mode: "insensitive" as const } },
      { slug: { contains: search.trim(), mode: "insensitive" as const } },
    ],
  };
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const search = req.nextUrl.searchParams.get("search")?.trim() || "";
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
    const limit = Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 20));
    const skip = (page - 1) * limit;
    const where = buildAdminProductSearchWhere(search);
    console.log("[AdminProductsApi] Fetching products", { search, page, limit, skip, where });

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: adminProductListSelect,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: products,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          search,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('[ProductCreate] Request body:', JSON.stringify(await req.clone().json(), null, 2));
    const body = await req.json();
    const validatedData = createProductSchema.parse(body);
    const requestedSubcategory = validatedData.subcategory?.trim() ?? "";
    const catalogAssignment = await resolveAdminProductCatalogAssignment({
      categoryId: validatedData.categoryId,
      category: validatedData.category,
      subcategory: requestedSubcategory.length > 0 ? requestedSubcategory : null,
    });
    const product = await prisma.product.create({
      data: buildAdminProductCreateData({
        ...validatedData,
        variants: normalizeVariantInput(validatedData.variants, validatedData.basePrice),
        slug: slugify(validatedData.slug || validatedData.name),
        ...catalogAssignment,
      }),
      select: adminProductListSelect,
    });

    revalidateProductSurfaces(product);

    return NextResponse.json(
      { success: true, data: product, meta: { pendingRestockCount: 0 } },
      {
        status: 201,
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

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Error creating product:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof Error) {
      console.error("Error creating product:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
