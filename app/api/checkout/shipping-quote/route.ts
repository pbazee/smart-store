import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getShippingQuote } from "@/lib/shipping-rules";

const quoteSchema = z.object({
  subtotal: z.number().nonnegative(),
  county: z.string().trim().min(2),
  city: z.string().trim().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = quoteSchema.parse(body);

    const quote = await getShippingQuote({
      subtotal: data.subtotal,
      county: data.county,
      city: data.city,
    });

    return NextResponse.json({
      success: true,
      data: {
        cost: quote.cost,
        ruleId: quote.ruleId,
        ruleName: quote.ruleName,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }

    console.error("Shipping quote failed:", error);
    return NextResponse.json({ error: "Failed to compute shipping" }, { status: 500 });
  }
}
