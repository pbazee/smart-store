import { DEFAULT_STORE_SETTINGS } from "@/lib/default-store-settings";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { StoreSettings } from "@/types";

let demoStoreSettings: StoreSettings = { ...DEFAULT_STORE_SETTINGS };

type StoreSettingsInput = Pick<
  StoreSettings,
  "supportEmail" | "supportPhone" | "adminNotificationEmail" | "contactPhone"
>;

export async function getStoreSettings(options: { seedIfEmpty?: boolean } = {}) {
  if (shouldUseMockData()) {
    return demoStoreSettings;
  }

  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: DEFAULT_STORE_SETTINGS.id },
    });

    if (!settings && options.seedIfEmpty) {
      console.log("[StoreSettings] No settings found in database, seeding with defaults...");
      const seeded = await prisma.storeSettings.create({
        data: {
          supportEmail: DEFAULT_STORE_SETTINGS.supportEmail,
          supportPhone: DEFAULT_STORE_SETTINGS.supportPhone,
          adminNotificationEmail: DEFAULT_STORE_SETTINGS.adminNotificationEmail,
        },
      });
      console.log("[StoreSettings] Seeded successfully");
      return seeded;
    }

    if (settings) {
      console.log("[StoreSettings] Loaded from database:", {
        email: settings.supportEmail,
        phone: settings.supportPhone,
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

  const data = {
    supportEmail: (input.supportEmail ?? "").trim(),
    supportPhone: (input.supportPhone ?? "").trim(),
    adminNotificationEmail: (input.adminNotificationEmail ?? "").trim(),
    contactPhone: (input.contactPhone ?? "").trim(),
  };

  const settings = await prisma.storeSettings.upsert({
    where: { id: DEFAULT_STORE_SETTINGS.id },
    update: data,
    create: {
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
