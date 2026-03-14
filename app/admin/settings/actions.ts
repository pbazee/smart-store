"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { normalizeCheckoutPhoneNumber } from "@/lib/checkout-payload";
import { getStoreSettings, upsertStoreSettings } from "@/lib/store-settings";
import type { StoreSettings } from "@/types";

const storeSettingsSchema = z.object({
  supportEmail: z.string().trim().email("Valid support email required"),
  supportPhone: z.string().trim().min(7, "Support phone is required"),
  adminNotificationEmail: z.string().trim().email("Admin notification email required"),
});

export type AdminStoreSettingsInput = z.infer<typeof storeSettingsSchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function revalidateStorefront() {
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
}

export async function fetchAdminStoreSettings() {
  await ensureAdmin();
  return (await getStoreSettings({ seedIfEmpty: true })) as StoreSettings | null;
}

export async function updateAdminStoreSettingsAction(input: AdminStoreSettingsInput) {
  await ensureAdmin();
  const data = storeSettingsSchema.parse(input);

  const settings = await upsertStoreSettings({
    supportEmail: data.supportEmail,
    supportPhone: normalizeCheckoutPhoneNumber(data.supportPhone),
    adminNotificationEmail: data.adminNotificationEmail,
  });

  revalidateStorefront();
  return settings;
}
