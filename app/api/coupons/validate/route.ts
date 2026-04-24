import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCouponForSubtotal } from "@/lib/coupon-service";

const validateCouponSchema = z.object({
  code: z.string().trim().min(1, "Enter a coupon code."),
  orderTotal: z.number().nonnegative(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = validateCouponSchema.parse(body);
    const coupon = await validateCouponForSubtotal({
      code: data.code,
      subtotal: data.orderTotal,
    });

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: coupon.discountAmount,
      description: coupon.description,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, error: error.errors[0]?.message || "Invalid coupon request." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : "Coupon validation failed.",
      },
      { status: 200 }
    );
  }
}
