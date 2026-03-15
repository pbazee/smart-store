import {
  DEFAULT_WHATSAPP_SETTINGS,
  createDefaultWhatsAppSettings,
} from "@/lib/default-whatsapp-settings";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { WhatsAppSettings } from "@/types";

let demoWhatsAppSettingsState: WhatsAppSettings = createDefaultWhatsAppSettings();

function cloneWhatsAppSettings(settings: WhatsAppSettings): WhatsAppSettings {
  return {
    ...settings,
    createdAt:
      settings.createdAt instanceof Date ? new Date(settings.createdAt) : settings.createdAt,
    updatedAt:
      settings.updatedAt instanceof Date ? new Date(settings.updatedAt) : settings.updatedAt,
  };
}

export function normalizeWhatsAppPhoneNumber(phoneNumber: string) {
  return phoneNumber.trim();
}

export function getDemoWhatsAppSettings() {
  return cloneWhatsAppSettings(demoWhatsAppSettingsState);
}

export function updateDemoWhatsAppSettings(
  input: Omit<WhatsAppSettings, "createdAt" | "updatedAt">
) {
  demoWhatsAppSettingsState = {
    ...input,
    createdAt: demoWhatsAppSettingsState.createdAt,
    updatedAt: new Date(),
  };

  return cloneWhatsAppSettings(demoWhatsAppSettingsState);
}

async function ensureWhatsAppSettingsSeeded() {
  const existingSettings = await prisma.whatsAppSettings.findUnique({
    where: { id: DEFAULT_WHATSAPP_SETTINGS.id },
  });

  if (existingSettings) {
    console.log("[WhatsAppSettings] Settings already exist in database, skipping seed");
    return;
  }

  console.log("[WhatsAppSettings] No settings found, seeding defaults...");
  await prisma.whatsAppSettings.create({
    data: DEFAULT_WHATSAPP_SETTINGS,
  });
  console.log("[WhatsAppSettings] Seeded successfully");
}

export async function getWhatsAppSettings(options: { seedIfEmpty?: boolean } = {}) {
  const { seedIfEmpty = false } = options;

  if (shouldUseMockData()) {
    console.log("[WhatsAppSettings] Using mock data");
    return getDemoWhatsAppSettings();
  }

  try {
    if (seedIfEmpty) {
      await ensureWhatsAppSettingsSeeded();
    }

    const settings = await prisma.whatsAppSettings.findUnique({
      where: { id: DEFAULT_WHATSAPP_SETTINGS.id },
    });

    if (settings) {
      console.log("[WhatsAppSettings] Loaded from database:", { phone: settings.phoneNumber });
    } else {
      console.log("[WhatsAppSettings] Not found in database, returning null");
    }

    return settings as WhatsAppSettings | null;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[WhatsAppSettings] Query failed:", errorMsg, {
      dbUrl: process.env.DATABASE_URL ? "set" : "NOT SET",
      seedIfEmpty,
    });
    return null;
  }
}
