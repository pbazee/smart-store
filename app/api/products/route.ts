import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { mockProducts } from "@/lib/mock-data";
import { releaseExpiredReservations } from "@/lib/order-reservations";
import { prisma } from "@/lib/prisma";
import { buildValidCatalogProductWhere } from "@/lib/product-integrity";
import { smartSearchProducts } from "@/lib/smart-search";

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  try {
    if (USE_MOCK_DATA) {
      let products = mockProducts;
      if (category) products = products.filter((product) => product.category === category);
      if (search) {
        products = smartSearchProducts(products, search).results;
      }
      return NextResponse.json({ products, total: products.length });
    }

    await releaseExpiredReservations();

    const where: Prisma.ProductWhereInput = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    let products = await prisma.product.findMany({
      where: buildValidCatalogProductWhere(where),
      include: { variants: true },
    });

    if (search) {
      products = smartSearchProducts(products, search).results;
    }

    return NextResponse.json({ products, total: products.length });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
