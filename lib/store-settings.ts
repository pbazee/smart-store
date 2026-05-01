import "server-only";

import { DEFAULT_STORE_SETTINGS } from "@/lib/default-store-settings";
import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import { ensureStoreSettingsStorage } from "@/lib/runtime-schema-repair";
import type { StoreSettings } from "@/types";

export const STORE_SETTINGS_CACHE_TAG = "store-settings";

type StoreSettingsInput = Pick<
  StoreSettings,
  | "storeName"
  | "storeTagline"
  | "logoUrl"
  | "logoDarkUrl"
  | "faviconUrl"
  | "supportEmail"
  | "supportPhone"
  | "adminNotificationEmail"
  | "contactPhone"
  | "footerContactPhone"
>;

type GetStoreSettingsOptions = {
  seedIfEmpty?: boolean;
  fallbackOnError?: boolean;
};

// Use globalThis so state survives Next.js dev-mode module reloads.
const globalForStoreSettings = globalThis as typeof globalThis & {
  _lastKnownStoreSettings?: StoreSettings | null;
  _pendingStoreSettingsRequests?: Map<string, Promise<StoreSettings | null>>;
};
if (!globalForStoreSettings._pendingStoreSettingsRequests) {
  globalForStoreSettings._pendingStoreSettingsRequests = new Map();
}

function getLastKnownStoreSettings(): StoreSettings | null {
  return globalForStoreSettings._lastKnownStoreSettings ?? null;
}
function setLastKnownStoreSettings(settings: StoreSettings | null) {
  globalForStoreSettings._lastKnownStoreSettings = settings;
}
const pendingStoreSettingsRequests = globalForStoreSettings._pendingStoreSettingsRequests;
const shouldLogStoreSettings = process.env.NODE_ENV === "development" && process.env.DEBUG_STORE_SETTINGS === "true";

function normalizeOptionalText(value?: string | null) {
  return (value ?? "").trim();
}

function rememberStoreSettings(settings: StoreSettings | null) {
  if (settings) {
    setLastKnownStoreSettings(settings);
  }

  return settings;
}

export function getStoreSettingsFallback() {
  return getLastKnownStoreSettings() ?? DEFAULT_STORE_SETTINGS;
}

export async function getStoreSettings(options: GetStoreSettingsOptions = {}) {
  if (shouldSkipLiveDataDuringBuild()) {
    return getStoreSettingsFallback();
  }

  const { seedIfEmpty = false, fallbackOnError = seedIfEmpty } = options;
  const requestKey = `${seedIfEmpty ? "seed" : "noseed"}:${fallbackOnError ? "fallback" : "strict"}`;
  const existingRequest = pendingStoreSettingsRequests.get(requestKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      await ensureStoreSettingsStorage();

      const settings = await prisma.storeSettings.findFirst({
        orderBy: { id: "asc" },
      });

      if (!settings && seedIfEmpty) {
        if (shouldLogStoreSettings) {
          console.log("[StoreSettings] No settings found in database, seeding with defaults...");
        }
        const seeded = await prisma.storeSettings.create({
          data: {
            storeName: DEFAULT_STORE_SETTINGS.storeName,
            storeTagline: DEFAULT_STORE_SETTINGS.storeTagline,
            logoUrl: DEFAULT_STORE_SETTINGS.logoUrl,
            logoDarkUrl: DEFAULT_STORE_SETTINGS.logoDarkUrl,
            faviconUrl: DEFAULT_STORE_SETTINGS.faviconUrl,
            supportEmail: DEFAULT_STORE_SETTINGS.supportEmail,
            supportPhone: DEFAULT_STORE_SETTINGS.supportPhone,
            adminNotificationEmail: DEFAULT_STORE_SETTINGS.adminNotificationEmail,
            contactPhone: DEFAULT_STORE_SETTINGS.contactPhone,
            footerContactPhone: DEFAULT_STORE_SETTINGS.footerContactPhone,
          },
        });
        if (shouldLogStoreSettings) {
          console.log("[StoreSettings] Seeded successfully");
        }
        return rememberStoreSettings(seeded as StoreSettings);
      }

      if (settings && shouldLogStoreSettings) {
        console.log("[StoreSettings] Loaded from database:", {
          storeName: settings.storeName,
          email: settings.supportEmail,
          phone: settings.supportPhone,
          footerPhone: settings.footerContactPhone,
        });
      } else if (shouldLogStoreSettings) {
        console.log("[StoreSettings] No settings found and seedIfEmpty=false, returning null");
      }

      return rememberStoreSettings(settings as StoreSettings | null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[StoreSettings] Query failed:", errorMsg, {
        dbUrl: process.env.DATABASE_URL ? "set" : "NOT SET",
        seedIfEmpty,
        fallbackOnError,
      });

      if (fallbackOnError) {
        console.warn("[StoreSettings] Falling back to last known storefront settings");
        return getStoreSettingsFallback();
      }
      throw error;
    } finally {
      pendingStoreSettingsRequests.delete(requestKey);
    }
  })();

  pendingStoreSettingsRequests.set(requestKey, request);

  return request;
}

export async function upsertStoreSettings(input: StoreSettingsInput) {
  await ensureStoreSettingsStorage();

  const data = {
    storeName: normalizeOptionalText(input.storeName),
    storeTagline: normalizeOptionalText(input.storeTagline),
    logoUrl: normalizeOptionalText(input.logoUrl),
    logoDarkUrl: normalizeOptionalText(input.logoDarkUrl),
    faviconUrl: normalizeOptionalText(input.faviconUrl),
    supportEmail: normalizeOptionalText(input.supportEmail),
    supportPhone: normalizeOptionalText(input.supportPhone),
    adminNotificationEmail: normalizeOptionalText(input.adminNotificationEmail),
    contactPhone:
      normalizeOptionalText(input.contactPhone) || normalizeOptionalText(input.supportPhone),
    footerContactPhone: normalizeOptionalText(input.footerContactPhone),
  };

  const existingSettings = await prisma.storeSettings.findFirst({
    select: { id: true },
    orderBy: { id: "asc" },
  });

  const settings = existingSettings
    ? await prisma.storeSettings.update({
        where: { id: existingSettings.id },
        data,
      })
    : await prisma.storeSettings.create({
        data: {
          id: DEFAULT_STORE_SETTINGS.id,
          ...data,
        },
      });

  return rememberStoreSettings(settings as StoreSettings) as StoreSettings;
}
