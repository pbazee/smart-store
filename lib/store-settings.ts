import { DEFAULT_STORE_SETTINGS } from "@/lib/default-store-settings";
import { prisma } from "@/lib/prisma";
import { ensureStoreSettingsStorage } from "@/lib/runtime-schema-repair";
import type { StoreSettings } from "@/types";

type StoreSettingsInput = Pick<
  StoreSettings,
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

let lastKnownStoreSettings: StoreSettings | null = null;

function normalizeOptionalText(value?: string | null) {
  return (value ?? "").trim();
}

function rememberStoreSettings(settings: StoreSettings | null) {
  if (settings) {
    lastKnownStoreSettings = settings;
  }

  return settings;
}

export function getStoreSettingsFallback() {
  return lastKnownStoreSettings ?? DEFAULT_STORE_SETTINGS;
}

export async function getStoreSettings(options: GetStoreSettingsOptions = {}) {
  const { seedIfEmpty = false, fallbackOnError = seedIfEmpty } = options;

  try {
    await ensureStoreSettingsStorage();

    const settings = await prisma.storeSettings.findFirst({
      orderBy: { id: "asc" },
    });

    if (!settings && seedIfEmpty) {
      console.log("[StoreSettings] No settings found in database, seeding with defaults...");
      const seeded = await prisma.storeSettings.create({
        data: {
          supportEmail: DEFAULT_STORE_SETTINGS.supportEmail,
          supportPhone: DEFAULT_STORE_SETTINGS.supportPhone,
          adminNotificationEmail: DEFAULT_STORE_SETTINGS.adminNotificationEmail,
          contactPhone: DEFAULT_STORE_SETTINGS.contactPhone,
          footerContactPhone: DEFAULT_STORE_SETTINGS.footerContactPhone,
        },
      });
      console.log("[StoreSettings] Seeded successfully");
      return rememberStoreSettings(seeded as StoreSettings);
    }

    if (settings) {
      console.log("[StoreSettings] Loaded from database:", {
        email: settings.supportEmail,
        phone: settings.supportPhone,
        footerPhone: settings.footerContactPhone,
      });
    } else {
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
  }
}

export async function upsertStoreSettings(input: StoreSettingsInput) {
  await ensureStoreSettingsStorage();

  const data = {
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
