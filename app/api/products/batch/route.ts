import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PRODUCTS_CACHE_TAG } from "@/lib/data-service";
import { buildValidCatalogProductWhere } from "@/lib/product-integrity";

const PUBLIC_PRODUCTS_CACHE_HEADER = "public, s-maxage=300, stale-while-revalidate=600";

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const normalizedIds = ids.filter((id): id is string => typeof id === "string" && id.length > 0);
    const cacheKey = normalizedIds.slice().sort().join(",");
    const products = await unstable_cache(
      async () =>
        prisma.product.findMany({
          where: buildValidCatalogProductWhere({
            id: { in: normalizedIds },
          }),
          include: { variants: true },
        }),
      ["products-batch", cacheKey],
      {
        revalidate: 300,
        tags: [PRODUCTS_CACHE_TAG],
      }
    )();

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
          "Cache-Control": PUBLIC_PRODUCTS_CACHE_HEADER,
        },
      }
    );
  } catch (error) {
    console.error("Batch products fetch failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
