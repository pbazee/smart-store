import "server-only";

import { unstable_cache } from "next/cache";
import { DEFAULT_SOCIAL_LINK_SEEDS, createSocialLinkSeed } from "@/lib/default-social-links";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";
import { getSocialLinks } from "@/lib/social-link-service";
import { getStoreSettings, getStoreSettingsFallback } from "@/lib/store-settings";
import { getWhatsAppSettings, getWhatsAppSettingsFallback } from "@/lib/whatsapp-service";
import type { SocialLink, StoreSettings, WhatsAppSettings } from "@/types";

const STORE_SETTINGS_REVALIDATE_SECONDS = 3600;
const STORE_SETTINGS_CACHE_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.GITHUB_SHA ||
  "local";

export type StorefrontContactData = {
  socialLinks: SocialLink[];
  storeSettings: StoreSettings | null;
  whatsAppSettings: WhatsAppSettings | null;
};

function getFallbackSocialLinks(): SocialLink[] {
  return DEFAULT_SOCIAL_LINK_SEEDS.map((seed) => createSocialLinkSeed(seed));
}

async function resolveStorefrontContactData(): Promise<StorefrontContactData> {
  if (shouldSkipLiveDataDuringBuild()) {
    return {
      socialLinks: getFallbackSocialLinks(),
      storeSettings: getStoreSettingsFallback(),
      whatsAppSettings: getWhatsAppSettingsFallback(),
    };
  }

  const [socialLinks, storeSettings, whatsAppSettings] = await Promise.all([
    getSocialLinks({ seedIfEmpty: true }).catch((error) => {
      console.error("[StorefrontSettings] Failed to load social links:", error);
      return getFallbackSocialLinks();
    }),
    getStoreSettings({
      seedIfEmpty: true,
      fallbackOnError: true,
    }).catch((error) => {
      console.error("[StorefrontSettings] Failed to load store settings:", error);
      return getStoreSettingsFallback();
    }),
    getWhatsAppSettings({
      seedIfEmpty: true,
      fallbackOnError: true,
    }).catch((error) => {
      console.error("[StorefrontSettings] Failed to load WhatsApp settings:", error);
      return getWhatsAppSettingsFallback();
    }),
  ]);

  return {
    socialLinks,
    storeSettings: storeSettings ?? getStoreSettingsFallback(),
    whatsAppSettings: whatsAppSettings ?? getWhatsAppSettingsFallback(),
  };
}

const getStorefrontContactDataForProd = unstable_cache(
  resolveStorefrontContactData,
  ["storefront-contact-data", STORE_SETTINGS_CACHE_VERSION],
  {
    revalidate: STORE_SETTINGS_REVALIDATE_SECONDS,
    tags: [HOMEPAGE_CACHE_TAG],
  }
);

export async function getStorefrontContactData() {
  return process.env.NODE_ENV === "production"
    ? getStorefrontContactDataForProd()
    : resolveStorefrontContactData();
}
