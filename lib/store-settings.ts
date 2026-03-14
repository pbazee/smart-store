import { DEFAULT_STORE_SETTINGS } from "@/lib/default-store-settings";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { StoreSettings } from "@/types";

let demoStoreSettings: StoreSettings = { ...DEFAULT_STORE_SETTINGS };

type StoreSettingsInput = Pick<
  StoreSettings,
  "supportEmail" | "supportPhone" | "adminNotificationEmail"
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
      const seeded = await prisma.storeSettings.create({
        data: {
          supportEmail: DEFAULT_STORE_SETTINGS.supportEmail,
          supportPhone: DEFAULT_STORE_SETTINGS.supportPhone,
          adminNotificationEmail: DEFAULT_STORE_SETTINGS.adminNotificationEmail,
        },
      });
      return seeded;
    }

    return settings as StoreSettings | null;
  } catch (error) {
    if (options.seedIfEmpty) {
      console.warn("StoreSettings query failed, falling back to defaults:", error);
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
