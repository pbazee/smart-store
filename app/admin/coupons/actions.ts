"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import {
  createDemoCoupon,
  deleteDemoCoupon,
  getCoupons,
  normalizeCouponCode,
  updateDemoCoupon,
} from "@/lib/coupon-service";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { Coupon } from "@/types";

const optionalCurrencyAmount = z.number().finite().nonnegative().nullable().optional();
const optionalUsageLimit = z.number().int().nonnegative().nullable().optional();

const adminCouponSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2, "Coupon code is required").max(50, "Keep it under 50 characters"),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive("Discount value is required"),
  minOrderAmount: optionalCurrencyAmount,
  maxUsage: optionalUsageLimit,
  expiresAt: z.string().trim().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
}).superRefine((data, context) => {
  if (data.discountType === "percentage" && data.discountValue > 100) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountValue"],
      message: "Percentage discounts cannot exceed 100%.",
    });
  }
});

export type AdminCouponInput = z.infer<typeof adminCouponSchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function parseOptionalNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseOptionalDate(value?: string) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Use a valid expiry date.");
  }

  return date;
}

function normalizeCouponInput(input: AdminCouponInput) {
  const data = adminCouponSchema.parse(input);

  return {
    id: data.id,
    code: normalizeCouponCode(data.code),
    discountType: data.discountType,
    discountValue: data.discountValue,
    minOrderAmount: parseOptionalNumber(data.minOrderAmount),
    maxUsage: parseOptionalNumber(data.maxUsage),
    expiresAt: parseOptionalDate(data.expiresAt),
    isActive: data.isActive,
  };
}

function revalidateCouponPaths() {
  revalidatePath("/checkout");
  revalidatePath("/admin");
  revalidatePath("/admin/coupons");
}

export async function fetchAdminCoupons() {
  await ensureAdmin();
  return getCoupons();
}

export async function createAdminCouponAction(input: AdminCouponInput) {
  await ensureAdmin();
  const data = normalizeCouponInput(input);

  if (shouldUseMockData()) {
    const coupon = createDemoCoupon({
      id: crypto.randomUUID(),
      code: data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount,
      maxUsage: data.maxUsage,
      usedCount: 0,
      expiresAt: data.expiresAt,
      isActive: data.isActive,
    });
    revalidateCouponPaths();
    return coupon;
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount,
      maxUsage: data.maxUsage ? Math.round(data.maxUsage) : null,
      expiresAt: data.expiresAt,
      isActive: data.isActive,
    },
  });

  revalidateCouponPaths();
  return coupon as Coupon;
}

export async function updateAdminCouponAction(input: AdminCouponInput) {
  await ensureAdmin();
  const id = z.string().min(1).parse(input.id);
  const normalized = normalizeCouponInput({ ...input, id });

  if (shouldUseMockData()) {
    const currentCoupons = await getCoupons();
    const currentCoupon = currentCoupons.find((coupon) => coupon.id === id);
    const coupon = updateDemoCoupon(id, {
      id,
      code: normalized.code,
      discountType: normalized.discountType,
      discountValue: normalized.discountValue,
      minOrderAmount: normalized.minOrderAmount,
      maxUsage: normalized.maxUsage ? Math.round(normalized.maxUsage) : null,
      usedCount: currentCoupon?.usedCount ?? 0,
      expiresAt: normalized.expiresAt,
      isActive: normalized.isActive,
    });
    revalidateCouponPaths();
    return coupon;
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      code: normalized.code,
      discountType: normalized.discountType,
      discountValue: normalized.discountValue,
      minOrderAmount: normalized.minOrderAmount,
      maxUsage: normalized.maxUsage ? Math.round(normalized.maxUsage) : null,
      expiresAt: normalized.expiresAt,
      isActive: normalized.isActive,
    },
  });

  revalidateCouponPaths();
  return coupon as Coupon;
}

export async function deleteAdminCouponAction(couponId: string) {
  await ensureAdmin();
  const id = z.string().min(1).parse(couponId);

  if (shouldUseMockData()) {
    deleteDemoCoupon(id);
    revalidateCouponPaths();
    return { deletedId: id };
  }

  await prisma.coupon.delete({
    where: { id },
  });

  revalidateCouponPaths();
  return { deletedId: id };
}
