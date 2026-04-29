import { DEFAULT_STORE_SETTINGS } from "@/lib/default-store-settings";
import type { StoreSettings } from "@/types";

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
