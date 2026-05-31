import "server-only";

import { unstable_cache } from "next/cache";
import type { StoreSettings } from "@/types";
import { getStoreSettings } from "@/lib/store-settings";

export const STORE_SETTINGS_TAG = "store-settings";

const getCachedStoreBranding = unstable_cache(
  async () => {
    const settings = await getStoreSettings({
      seedIfEmpty: false,
      fallbackOnError: false,
    });
    return settings ?? null;
  },
  ["store-branding"],
  { revalidate: 3600, tags: [STORE_SETTINGS_TAG] }
);

export async function getStoreBranding(): Promise<StoreSettings | null> {
  return getCachedStoreBranding();
}

export async function getStoreLogo(mode: "light" | "dark" = "light") {
  const branding = await getStoreBranding();
  const lightLogo = branding?.logoUrl || null;
  const darkLogo = branding?.logoDarkUrl || lightLogo || null;

  return mode === "dark" ? darkLogo : lightLogo;
}

export async function getStoreLogoSet() {
  const branding = await getStoreBranding();
  return {
    storeName: branding?.storeName || "Smartest Store KE",
    storeTagline: branding?.storeTagline || "Kenya's smartest fashion destination",
    logoUrl: branding?.logoUrl || null,
    logoDarkUrl: branding?.logoDarkUrl || branding?.logoUrl || null,
    faviconUrl: branding?.faviconUrl || null,
  };
}
