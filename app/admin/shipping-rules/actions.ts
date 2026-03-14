"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import {
  deleteShippingRule,
  getShippingRules,
  upsertShippingRule,
} from "@/lib/shipping-rules";
import type { ShippingRule } from "@/types";

const shippingRuleSchema = z.object({
  id: z.number().optional(),
  name: z.string().trim().min(3, "Name is required"),
  description: z.string().trim().optional(),
  locationScope: z.enum(["Nairobi", "Kenya", "Other"]),
  minOrderAmount: z
    .number()
    .nonnegative()
    .nullable()
    .optional()
    .transform((val) => (val === null ? null : val)),
  cost: z.number().nonnegative(),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
});

export async function fetchShippingRulesAction() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  return getShippingRules();
}

export async function upsertShippingRuleAction(input: z.infer<typeof shippingRuleSchema>) {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  const parsed = shippingRuleSchema.parse(input);
  const rule = await upsertShippingRule({
    ...parsed,
    minOrderAmount: parsed.minOrderAmount ?? null,
  } as ShippingRule);

  revalidatePath("/admin/shipping-rules");
  revalidatePath("/admin");
  revalidatePath("/checkout");
  return rule;
}

export async function deleteShippingRuleAction(id: number) {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  await deleteShippingRule(id);
  revalidatePath("/admin/shipping-rules");
  revalidatePath("/admin");
  revalidatePath("/checkout");
}
