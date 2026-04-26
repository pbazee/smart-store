import { NextRequest, NextResponse } from "next/server";
import { getShippingQuote } from "@/lib/shipping-rules";

export async function GET(request: NextRequest) {
  const county = request.nextUrl.searchParams.get("county")?.trim();
  const orderTotal = Number(request.nextUrl.searchParams.get("orderTotal") || 0);

  if (!county) {
    return NextResponse.json({ error: "County is required" }, { status: 400 });
  }

  try {
    const result = await getShippingQuote({
      county,
      subtotal: Number.isFinite(orderTotal) ? orderTotal : 0,
    });

    if (result.noMatch) {
      return NextResponse.json(
        { noMatch: true },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          county: result.county,
          fee: result.cost,
          estimatedDays: result.estimatedDays,
          freeAboveKES: result.freeAboveKES,
          ruleId: result.ruleId,
          ruleName: result.ruleName,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Shipping calculation failed:", error);
    return NextResponse.json({ error: "Failed to calculate shipping" }, { status: 500 });
  }
}
