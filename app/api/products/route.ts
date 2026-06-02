import { NextResponse } from "next/server";
import { getProducts } from "@/lib/data-service";
import { smartSearchProducts } from "@/lib/smart-search";

const FRESH_PRODUCTS_CACHE_HEADER = "no-store, max-age=0";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  try {
    let products = await getProducts(
      {
        category: category ?? undefined,
        search: search ?? undefined,
      },
      {
        cacheKey: `api-products:${category ?? "all"}:${search ?? ""}`,
        disableCache: true,
      }
    );

    if (search) {
      products = smartSearchProducts(products, search).results;
    }

    return NextResponse.json(
      { products, total: products.length },
      {
        headers: {
          "Cache-Control": FRESH_PRODUCTS_CACHE_HEADER,
        },
      }
    );
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
