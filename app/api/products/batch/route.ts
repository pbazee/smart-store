import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildValidCatalogProductWhere } from "@/lib/product-integrity";

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const products = await prisma.product.findMany({
      where: buildValidCatalogProductWhere({
        id: { in: ids },
      }),
      include: { variants: true },
    });

    // Reorder to match input IDs ordering
    const productMap = new Map(products.map((p) => [p.id, p]));
    const orderedProducts = ids.map((id) => productMap.get(id)).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: orderedProducts,
    });
  } catch (error) {
    console.error("Batch products fetch failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
