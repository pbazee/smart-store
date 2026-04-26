import { DEFAULT_STORE_SETTINGS } from "@/lib/default-store-settings";
import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";
import { getStoreSettings } from "@/lib/store-settings";
import type { StoreSettings } from "@/types";

export type SupportContactInfo = {
  supportEmail: string;
  supportPhone: string;
  supportTel: string;
  contactPhone: string;
  contactTel: string;
  footerContactPhone: string;
  footerTel: string;
  adminNotificationEmail: string;
};

function normalizeText(value?: string | null) {
  return value?.trim() ?? "";
}

function normalizeTel(phone: string) {
  return phone.replace(/[^+\d]/g, "");
}

export function resolveSupportContactInfo(
  storeSettings?: StoreSettings | null
): SupportContactInfo {
  const supportEmail =
    normalizeText(storeSettings?.supportEmail) ||
    normalizeText(DEFAULT_STORE_SETTINGS.supportEmail) ||
    "support@smarteststore.ke";
  const supportPhone =
    normalizeText(storeSettings?.supportPhone) ||
    normalizeText(DEFAULT_STORE_SETTINGS.supportPhone) ||
    "+254 700 123 456";
  const contactPhone =
    normalizeText(storeSettings?.contactPhone) ||
    normalizeText(storeSettings?.footerContactPhone) ||
    supportPhone;
  const footerContactPhone =
    normalizeText(storeSettings?.footerContactPhone) ||
    normalizeText(storeSettings?.contactPhone) ||
    supportPhone;
  const adminNotificationEmail =
    normalizeText(storeSettings?.adminNotificationEmail) ||
    normalizeText(DEFAULT_STORE_SETTINGS.adminNotificationEmail) ||
    supportEmail;

  return {
    supportEmail,
    supportPhone,
    supportTel: normalizeTel(supportPhone),
    contactPhone,
    contactTel: normalizeTel(contactPhone),
    footerContactPhone,
    footerTel: normalizeTel(footerContactPhone),
    adminNotificationEmail,
  };
}

export async function getSupportContactInfo() {
  if (shouldSkipLiveDataDuringBuild()) {
    return resolveSupportContactInfo(DEFAULT_STORE_SETTINGS);
  }

  const storeSettings = await getStoreSettings({
    seedIfEmpty: true,
    fallbackOnError: true,
  });

  return resolveSupportContactInfo(storeSettings);
}
