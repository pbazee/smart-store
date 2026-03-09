import { NextResponse } from "next/server";
import { mockProducts } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  let products = mockProducts;
  if (category) products = products.filter((p) => p.category === category);
  if (search) {
    const q = search.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(q));
  }

  return NextResponse.json({ products, total: products.length });
}
