import type { Coupon } from "@/types";

export type CouponSeed = Omit<Coupon, "createdAt" | "updatedAt">;

export const DEFAULT_COUPON_SEEDS: CouponSeed[] = [
  {
    id: "seed-coupon-nairobi10",
    code: "NAIROBI10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 2000,
    maxUsage: 250,
    usedCount: 0,
    expiresAt: new Date("2026-12-31T20:59:59.000Z"),
    isActive: true,
  },
  {
    id: "seed-coupon-freeswag",
    code: "STYLE500",
    discountType: "fixed",
    discountValue: 500,
    minOrderAmount: 3500,
    maxUsage: 100,
    usedCount: 0,
    expiresAt: new Date("2026-09-30T20:59:59.000Z"),
    isActive: true,
  },
];

export function createCouponSeed(
  seed: CouponSeed,
  timestamp = new Date("2026-01-01T00:00:00.000Z")
): Coupon {
  return {
    ...seed,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
