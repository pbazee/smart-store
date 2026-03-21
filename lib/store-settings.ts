import { DEFAULT_STORE_SETTINGS } from "@/lib/default-store-settings";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import { ensureStoreSettingsStorage } from "@/lib/runtime-schema-repair";
import type { StoreSettings } from "@/types";

let demoStoreSettings: StoreSettings = { ...DEFAULT_STORE_SETTINGS };

type StoreSettingsInput = Pick<
  StoreSettings,
  | "supportEmail"
  | "supportPhone"
  | "adminNotificationEmail"
  | "contactPhone"
  | "footerContactPhone"
>;

function normalizeOptionalText(value?: string | null) {
  return (value ?? "").trim();
}

export async function getStoreSettings(options: { seedIfEmpty?: boolean } = {}) {
  if (shouldUseMockData()) {
    return demoStoreSettings;
  }

  try {
    await ensureStoreSettingsStorage();

    const settings = await prisma.storeSettings.findFirst({
      orderBy: { id: "asc" },
    });

    if (!settings && options.seedIfEmpty) {
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
      return seeded;
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

    return settings as StoreSettings | null;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[StoreSettings] Query failed:", errorMsg, {
      dbUrl: process.env.DATABASE_URL ? "set" : "NOT SET",
      seedIfEmpty: options.seedIfEmpty,
    });
    
    if (options.seedIfEmpty) {
      console.warn("[StoreSettings] Falling back to default settings");
      return DEFAULT_STORE_SETTINGS;
    }
    throw error;
  }
}

export async function upsertStoreSettings(input: StoreSettingsInput) {
  if (shouldUseMockData()) {
    demoStoreSettings = {
      ...demoStoreSettings,
      ...input,
      updatedAt: new Date(),
    };
    return demoStoreSettings;
  }

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

  return settings as StoreSettings;
}

export function updateDemoStoreSettings(input: StoreSettingsInput) {
  demoStoreSettings = {
    ...demoStoreSettings,
    ...input,
    updatedAt: new Date(),
  };
  return demoStoreSettings;
}
