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
    return;
  }

  await prisma.whatsAppSettings.create({
    data: DEFAULT_WHATSAPP_SETTINGS,
  });
}

export async function getWhatsAppSettings(options: { seedIfEmpty?: boolean } = {}) {
  const { seedIfEmpty = false } = options;

  if (shouldUseMockData()) {
    return getDemoWhatsAppSettings();
  }

  if (seedIfEmpty) {
    await ensureWhatsAppSettingsSeeded();
  }

  const settings = await prisma.whatsAppSettings.findUnique({
    where: { id: DEFAULT_WHATSAPP_SETTINGS.id },
  });

  if (!settings) {
    return null;
  }

  return settings as WhatsAppSettings;
}
