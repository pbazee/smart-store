import {
  DEFAULT_WHATSAPP_SETTINGS,
  createDefaultWhatsAppSettings,
} from "@/lib/default-whatsapp-settings";
import { prisma } from "@/lib/prisma";
import type { WhatsAppPosition, WhatsAppSettings } from "@/types";

const WHATSAPP_SETTINGS_META_PREFIX = "__smartest_store_whatsapp__";

type PersistedWhatsAppSettingsRecord = {
  id: string;
  phoneNumber: string;
  defaultMessage: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type PersistedWhatsAppMetadata = {
  message: string;
  position?: WhatsAppPosition;
};

function normalizeWhatsAppPosition(position?: string | null): WhatsAppPosition {
  return position === "left" ? "left" : "right";
}

function decodePersistedWhatsAppMessage(defaultMessage: string) {
  if (!defaultMessage.startsWith(WHATSAPP_SETTINGS_META_PREFIX)) {
    return {
      defaultMessage,
      position: DEFAULT_WHATSAPP_SETTINGS.position,
    };
  }

  try {
    const parsed = JSON.parse(
      defaultMessage.slice(WHATSAPP_SETTINGS_META_PREFIX.length)
    ) as PersistedWhatsAppMetadata;

    return {
      defaultMessage: parsed.message || DEFAULT_WHATSAPP_SETTINGS.defaultMessage,
      position: normalizeWhatsAppPosition(parsed.position),
    };
  } catch (error) {
    console.error("[WhatsAppSettings] Failed to parse persisted metadata:", error);

    return {
      defaultMessage: DEFAULT_WHATSAPP_SETTINGS.defaultMessage,
      position: DEFAULT_WHATSAPP_SETTINGS.position,
    };
  }
}

function encodePersistedWhatsAppMessage(
  defaultMessage: string,
  position: WhatsAppPosition
) {
  const trimmedMessage = defaultMessage.trim();

  if (position === DEFAULT_WHATSAPP_SETTINGS.position) {
    return trimmedMessage;
  }

  return `${WHATSAPP_SETTINGS_META_PREFIX}${JSON.stringify({
    message: trimmedMessage,
    position,
  })}`;
}

function hydrateWhatsAppSettings(
  settings: PersistedWhatsAppSettingsRecord | WhatsAppSettings
): WhatsAppSettings {
  const decoded = decodePersistedWhatsAppMessage(settings.defaultMessage);

  return {
    ...settings,
    defaultMessage: decoded.defaultMessage,
    position: "position" in settings ? normalizeWhatsAppPosition(settings.position) : decoded.position,
  };
}

export function normalizeWhatsAppPhoneNumber(phoneNumber: string) {
  return phoneNumber.trim();
}

export function buildWhatsAppHref(phoneNumber: string, defaultMessage: string) {
  const normalizedPhone = phoneNumber.replace(/[^\d]/g, "");
  const message = encodeURIComponent(defaultMessage);
  return `https://wa.me/${normalizedPhone}?text=${message}`;
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
  const serializedDefaults = serializeWhatsAppSettings(DEFAULT_WHATSAPP_SETTINGS);
  await prisma.whatsAppSettings.create({
    data: {
      id: DEFAULT_WHATSAPP_SETTINGS.id,
      phoneNumber: serializedDefaults.phoneNumber,
      defaultMessage: serializedDefaults.defaultMessage,
      isActive: serializedDefaults.isActive,
    },
  });
  console.log("[WhatsAppSettings] Seeded successfully");
}

export async function getWhatsAppSettings(options: { seedIfEmpty?: boolean } = {}) {
  const { seedIfEmpty = false } = options;

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

    if (!settings && seedIfEmpty) {
      return createDefaultWhatsAppSettings();
    }

    return settings
      ? hydrateWhatsAppSettings(settings as PersistedWhatsAppSettingsRecord)
      : null;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[WhatsAppSettings] Query failed:", errorMsg, {
      dbUrl: process.env.DATABASE_URL ? "set" : "NOT SET",
      seedIfEmpty,
    });

    if (seedIfEmpty) {
      return createDefaultWhatsAppSettings();
    }

    return null;
  }
}

export function serializeWhatsAppSettings(input: Pick<
  WhatsAppSettings,
  "phoneNumber" | "defaultMessage" | "isActive" | "position"
>) {
  return {
    phoneNumber: normalizeWhatsAppPhoneNumber(input.phoneNumber),
    defaultMessage: encodePersistedWhatsAppMessage(input.defaultMessage, input.position),
    isActive: input.isActive,
  };
}
