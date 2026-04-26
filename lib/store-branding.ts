import { unstable_cache } from "next/cache";
import { DEFAULT_STORE_SETTINGS } from "@/lib/default-store-settings";
import { getStoreSettings } from "@/lib/store-settings";
import type { StoreSettings } from "@/types";

export const STORE_SETTINGS_TAG = "store-settings";

const getCachedStoreBranding = unstable_cache(
  async () => {
    const settings = await getStoreSettings({ seedIfEmpty: true, fallbackOnError: true });
    return settings ?? DEFAULT_STORE_SETTINGS;
  },
  ["store-branding"],
  { revalidate: 3600, tags: [STORE_SETTINGS_TAG] }
);

export async function getStoreBranding() {
  return getCachedStoreBranding();
}

export async function getStoreLogo(mode: "light" | "dark" = "light") {
  const branding = await getStoreBranding();
  const lightLogo = branding.logoUrl || null;
  const darkLogo = branding.logoDarkUrl || lightLogo || null;

  return mode === "dark" ? darkLogo : lightLogo;
}

export async function getStoreLogoSet() {
  const branding = await getStoreBranding();
  return {
    storeName: branding.storeName || DEFAULT_STORE_SETTINGS.storeName || "Smartest Store KE",
    storeTagline:
      branding.storeTagline ||
      DEFAULT_STORE_SETTINGS.storeTagline ||
      "Kenya's smartest fashion destination",
    logoUrl: branding.logoUrl || null,
    logoDarkUrl: branding.logoDarkUrl || branding.logoUrl || null,
    faviconUrl: branding.faviconUrl || null,
  };
}

export function getStoreLogoSetFromSettings(storeSettings?: StoreSettings | null) {
  const resolved = storeSettings ?? DEFAULT_STORE_SETTINGS;
  return {
    storeName: resolved.storeName || DEFAULT_STORE_SETTINGS.storeName || "Smartest Store KE",
    storeTagline:
      resolved.storeTagline ||
      DEFAULT_STORE_SETTINGS.storeTagline ||
      "Kenya's smartest fashion destination",
    logoUrl: resolved.logoUrl || null,
    logoDarkUrl: resolved.logoDarkUrl || resolved.logoUrl || null,
    faviconUrl: resolved.faviconUrl || null,
  };
}
