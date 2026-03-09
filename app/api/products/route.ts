import { NextResponse } from "next/server";
import { mockProducts } from "@/lib/mock-data";

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  try {
    if (USE_MOCK_DATA) {
      // Use mock data
      let products = mockProducts;
      if (category) products = products.filter((p) => p.category === category);
      if (search) {
        const q = search.toLowerCase();
        products = products.filter((p) => p.name.toLowerCase().includes(q));
      }
      return NextResponse.json({ products, total: products.length });
    } else {
      // Use real database
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      let where: any = {};
      if (category) where.category = category;
      if (search) where.name = { contains: search, mode: "insensitive" };

      const products = await prisma.product.findMany({
        where,
        include: { variants: true },
      });

      await prisma.$disconnect();
      return NextResponse.json({ products, total: products.length });
    }
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
