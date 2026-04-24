import { Prisma } from "@prisma/client";
import { DEFAULT_COUPON_SEEDS, createCouponSeed } from "@/lib/default-coupons";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { AppliedCoupon, Coupon } from "@/types";

type CouponQueryOptions = {
  activeOnly?: boolean;
};

let demoCouponsState: Coupon[] = DEFAULT_COUPON_SEEDS.map((seed, index) =>
  createCouponSeed(seed, new Date(`2026-01-0${index + 1}T09:00:00.000Z`))
);

function cloneCoupon(coupon: Coupon): Coupon {
  return {
    ...coupon,
    expiresAt: coupon.expiresAt instanceof Date ? new Date(coupon.expiresAt) : coupon.expiresAt,
    createdAt: coupon.createdAt instanceof Date ? new Date(coupon.createdAt) : coupon.createdAt,
    updatedAt: coupon.updatedAt instanceof Date ? new Date(coupon.updatedAt) : coupon.updatedAt,
  };
}

function sortCoupons(coupons: Coupon[]) {
  return [...coupons].sort((left, right) => left.code.localeCompare(right.code));
}

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export function getDemoCoupons(options: CouponQueryOptions = {}) {
  const { activeOnly = false } = options;
  const coupons = activeOnly
    ? demoCouponsState.filter((coupon) => coupon.isActive)
    : demoCouponsState;

  return sortCoupons(coupons).map(cloneCoupon);
}

export function createDemoCoupon(input: Omit<Coupon, "createdAt" | "updatedAt">) {
  const now = new Date();
  const nextCoupon: Coupon = {
    ...input,
    code: normalizeCouponCode(input.code),
    createdAt: now,
    updatedAt: now,
  };

  demoCouponsState = sortCoupons([nextCoupon, ...demoCouponsState]);
  return cloneCoupon(nextCoupon);
}

export function updateDemoCoupon(couponId: string, input: Omit<Coupon, "createdAt" | "updatedAt">) {
  const currentCoupon = demoCouponsState.find((coupon) => coupon.id === couponId);
  if (!currentCoupon) {
    throw new Error("Coupon not found");
  }

  const nextCoupon: Coupon = {
    ...input,
    code: normalizeCouponCode(input.code),
    createdAt: currentCoupon.createdAt,
    updatedAt: new Date(),
  };

  demoCouponsState = sortCoupons(
    demoCouponsState.map((coupon) => (coupon.id === couponId ? nextCoupon : coupon))
  );

  return cloneCoupon(nextCoupon);
}

export function deleteDemoCoupon(couponId: string) {
  demoCouponsState = demoCouponsState.filter((coupon) => coupon.id !== couponId);
}

export async function getCoupons(options: CouponQueryOptions = {}): Promise<Coupon[]> {
  const { activeOnly = false } = options;

  if (shouldUseMockData()) {
    return getDemoCoupons({ activeOnly });
  }

  const coupons = await prisma.coupon.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ code: "asc" }],
  });

  return coupons as Coupon[];
}

function isCouponExpired(coupon: Coupon, now = new Date()) {
  return Boolean(coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now.getTime());
}

export function getCouponDiscountAmount(coupon: Coupon, subtotal: number) {
  const rawDiscount =
    coupon.discountType === "percentage"
      ? Math.round((subtotal * coupon.discountValue) / 100)
      : Math.round(coupon.discountValue);

  return Math.max(0, Math.min(rawDiscount, subtotal));
}

function getCouponDescription(coupon: Coupon) {
  if (coupon.discountType === "percentage") {
    return `${coupon.discountValue}% off your order`;
  }

  return `KSh ${Math.round(coupon.discountValue)} off your order`;
}

export async function validateCouponForSubtotal(input: {
  code: string;
  subtotal: number;
  now?: Date;
}): Promise<AppliedCoupon> {
  const normalizedCode = normalizeCouponCode(input.code);
  if (!normalizedCode) {
    throw new Error("Enter a coupon code to continue.");
  }

  const now = input.now ?? new Date();
  const coupon = shouldUseMockData()
    ? getDemoCoupons().find((item) => item.code === normalizedCode) ?? null
    : ((await prisma.coupon.findUnique({
        where: { code: normalizedCode },
      })) as Coupon | null);

  if (!coupon) {
    throw new Error("Coupon code not found.");
  }

  if (!coupon.isActive) {
    throw new Error("This coupon is not active.");
  }

  if (isCouponExpired(coupon, now)) {
    throw new Error("This coupon has expired.");
  }

  if (coupon.maxUsage !== null && coupon.maxUsage !== undefined && coupon.usedCount >= coupon.maxUsage) {
    throw new Error("This coupon has reached its usage limit.");
  }

  if (
    coupon.minOrderAmount !== null &&
    coupon.minOrderAmount !== undefined &&
    input.subtotal < coupon.minOrderAmount
  ) {
    throw new Error(`This coupon requires a minimum order of KSh ${Math.round(coupon.minOrderAmount)}.`);
  }

  const discountAmount = getCouponDiscountAmount(coupon, input.subtotal);
  if (discountAmount <= 0) {
    throw new Error("This coupon does not apply to the current cart.");
  }

  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    description: getCouponDescription(coupon),
  };
}

export async function reserveCouponUsage(
  tx: Prisma.TransactionClient,
  couponCode?: string | null
) {
  if (!couponCode) {
    return;
  }

  const normalizedCode = normalizeCouponCode(couponCode);
  const result = await tx.$executeRaw(Prisma.sql`
    UPDATE "Coupon"
    SET "usedCount" = "usedCount" + 1,
        "updatedAt" = NOW()
    WHERE "code" = ${normalizedCode}
      AND "isActive" = true
      AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
      AND ("maxUsage" IS NULL OR "usedCount" < "maxUsage")
  `);

  if (result === 0) {
    throw new Error("This coupon is no longer available.");
  }
}

export async function releaseCouponUsage(
  tx: Prisma.TransactionClient,
  couponCode?: string | null
) {
  if (!couponCode) {
    return;
  }

  await tx.coupon.updateMany({
    where: {
      code: normalizeCouponCode(couponCode),
      usedCount: { gt: 0 },
    },
    data: {
      usedCount: { decrement: 1 },
    },
  });
}
