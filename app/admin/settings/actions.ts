"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { normalizeCheckoutPhoneNumber } from "@/lib/checkout-payload";
import { getStoreSettings, STORE_SETTINGS_CACHE_TAG, upsertStoreSettings } from "@/lib/store-settings";
import type { StoreSettings } from "@/types";

const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(2, "Store name is required"),
  storeTagline: z.string().trim().min(2, "Store tagline is required"),
  logoUrl: z.string().trim().optional(),
  logoDarkUrl: z.string().trim().optional(),
  faviconUrl: z.string().trim().optional(),
  supportEmail: z.string().trim().email("Valid support email required"),
  supportPhone: z.string().trim().min(7, "Support phone is required"),
  adminNotificationEmail: z.string().trim().email("Admin notification email required"),
  contactPhone: z.string().trim().optional(),
  footerContactPhone: z.string().trim().optional(),
});

export type AdminStoreSettingsInput = z.infer<typeof storeSettingsSchema>;

export type SaveSettingsResult =
  | { success: true; data: StoreSettings }
  | { success: false; error: string };

function normalizeOptionalPhone(phone?: string) {
  const trimmed = phone?.trim() ?? "";
  return trimmed ? normalizeCheckoutPhoneNumber(trimmed) : "";
}

function revalidateStorefront() {
  revalidateTag('store-settings');
  revalidateTag('homepage-shell');
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/faq");
  revalidatePath("/privacy-policy");
  revalidatePath("/returns");
  revalidatePath("/track-order");
  revalidatePath("/checkout/complete");
  revalidatePath("/admin");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/settings");
}

export async function fetchAdminStoreSettings() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) return null;
  return (await getStoreSettings({
    seedIfEmpty: true,
    fallbackOnError: true,
  })) as StoreSettings | null;
}

export async function updateAdminStoreSettingsAction(
  input: AdminStoreSettingsInput
): Promise<SaveSettingsResult> {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized. Please log in as admin." };
    }

    let data: AdminStoreSettingsInput;
    try {
      data = storeSettingsSchema.parse(input);
    } catch (err: any) {
      const firstIssue = err?.errors?.[0];
      return {
        success: false,
        error: firstIssue?.message || "Invalid input. Check all fields and try again.",
      };
    }

    const settings = await upsertStoreSettings({
      storeName: data.storeName,
      storeTagline: data.storeTagline,
      logoUrl: data.logoUrl,
      logoDarkUrl: data.logoDarkUrl,
      faviconUrl: data.faviconUrl,
      supportEmail: data.supportEmail,
      supportPhone: normalizeCheckoutPhoneNumber(data.supportPhone),
      adminNotificationEmail: data.adminNotificationEmail,
      contactPhone:
        normalizeOptionalPhone(data.contactPhone) ||
        normalizeCheckoutPhoneNumber(data.supportPhone),
      footerContactPhone: normalizeOptionalPhone(data.footerContactPhone),
    });

    revalidateStorefront();
    return { success: true, data: settings as StoreSettings };
  } catch (err: any) {
    console.error("[Settings] updateAdminStoreSettingsAction failed:", err?.message ?? err);
    return {
      success: false,
      error: err?.message || "Failed to save settings. Please check your database connection and try again.",
    };
  }
}
