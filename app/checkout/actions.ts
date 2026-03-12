"use server";

import { z } from "zod";
import { validateCouponForSubtotal } from "@/lib/coupon-service";
import type { AppliedCoupon } from "@/types";

const validateCouponSchema = z.object({
  code: z.string().trim().min(1, "Enter a coupon code."),
  subtotal: z.number().int().nonnegative(),
});

export async function validateCouponAction(input: {
  code: string;
  subtotal: number;
}): Promise<AppliedCoupon> {
  const data = validateCouponSchema.parse(input);
  return validateCouponForSubtotal(data);
}
