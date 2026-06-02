import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildValidCatalogProductWhere } from "@/lib/product-integrity";

const FRESH_PRODUCTS_CACHE_HEADER = "no-store, max-age=0";

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const normalizedIds = ids.filter((id): id is string => typeof id === "string" && id.length > 0);
    const products = await prisma.product.findMany({
      where: buildValidCatalogProductWhere({
        id: { in: normalizedIds },
      }),
      include: { variants: true },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));
    const orderedProducts = normalizedIds
      .map((id) => productMap.get(id))
      .filter(Boolean);

    return NextResponse.json(
      {
        success: true,
        data: orderedProducts,
      },
      {
        headers: {
          "Cache-Control": FRESH_PRODUCTS_CACHE_HEADER,
        },
      }
    );
  } catch (error) {
    console.error("Batch products fetch failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
