import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-error-utils";
import { buildValidCatalogProductWhere } from "@/lib/product-integrity";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findFirst({
      where: buildValidCatalogProductWhere({ slug }),
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, data: product },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return NextResponse.json({ error: "Product data temporarily unavailable" }, { status: 503 });
    }

    console.error("Error fetching product by slug:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
