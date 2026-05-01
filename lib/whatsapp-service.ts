import "server-only";

import {
  DEFAULT_WHATSAPP_SETTINGS,
} from "@/lib/default-whatsapp-settings";
import { prisma } from "@/lib/prisma";
import {
  encodePersistedWhatsAppMessage,
  getWhatsAppSettingsFallback as getSharedWhatsAppSettingsFallback,
  hydrateWhatsAppSettings,
  normalizeWhatsAppPhoneNumber,
  normalizeWhatsAppPosition,
} from "@/lib/whatsapp-shared";
import type { WhatsAppSettings } from "@/types";

// Use globalThis so state survives Next.js dev-mode module reloads.
const globalForWhatsApp = globalThis as typeof globalThis & {
  _lastKnownWhatsAppSettings?: WhatsAppSettings | null;
  _pendingWhatsAppRequests?: Map<string, Promise<WhatsAppSettings | null>>;
};
if (!globalForWhatsApp._pendingWhatsAppRequests) {
  globalForWhatsApp._pendingWhatsAppRequests = new Map();
}
const pendingWhatsAppRequests = globalForWhatsApp._pendingWhatsAppRequests;
const shouldLogWhatsAppSettings =
  process.env.NODE_ENV === "development" && process.env.DEBUG_WHATSAPP_SETTINGS === "true";

type PersistedWhatsAppSettingsRecord = {
  id: string;
  phoneNumber: string;
  defaultMessage: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function rememberWhatsAppSettings(settings: WhatsAppSettings | null) {
  if (settings) {
    globalForWhatsApp._lastKnownWhatsAppSettings = settings;
  }

  return settings;
}

export function getWhatsAppSettingsFallback() {
  return globalForWhatsApp._lastKnownWhatsAppSettings ?? getSharedWhatsAppSettingsFallback();
}

async function ensureWhatsAppSettingsSeeded() {
  const existingSettings = await prisma.whatsAppSettings.findUnique({
    where: { id: DEFAULT_WHATSAPP_SETTINGS.id },
  });

  if (existingSettings) {
    if (shouldLogWhatsAppSettings) {
      console.log("[WhatsAppSettings] Settings already exist in database, skipping seed");
    }
    return;
  }

  if (shouldLogWhatsAppSettings) {
    console.log("[WhatsAppSettings] No settings found, seeding defaults...");
  }
  const serializedDefaults = serializeWhatsAppSettings(DEFAULT_WHATSAPP_SETTINGS);
  await prisma.whatsAppSettings.create({
    data: {
      id: DEFAULT_WHATSAPP_SETTINGS.id,
      phoneNumber: serializedDefaults.phoneNumber,
      defaultMessage: serializedDefaults.defaultMessage,
      isActive: serializedDefaults.isActive,
    },
  });
  if (shouldLogWhatsAppSettings) {
    console.log("[WhatsAppSettings] Seeded successfully");
  }
}

export async function getWhatsAppSettings(options: {
  seedIfEmpty?: boolean;
  fallbackOnError?: boolean;
} = {}) {
  const { seedIfEmpty = false, fallbackOnError = seedIfEmpty } = options;
  const requestKey = `${seedIfEmpty ? "seed" : "noseed"}:${fallbackOnError ? "fallback" : "strict"}`;
  const existingRequest = pendingWhatsAppRequests.get(requestKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      if (seedIfEmpty) {
        await ensureWhatsAppSettingsSeeded();
      }

      const settings = await prisma.whatsAppSettings.findUnique({
        where: { id: DEFAULT_WHATSAPP_SETTINGS.id },
      });

      if (settings && shouldLogWhatsAppSettings) {
        console.log("[WhatsAppSettings] Loaded from database:", { phone: settings.phoneNumber });
      } else if (shouldLogWhatsAppSettings) {
        console.log("[WhatsAppSettings] Not found in database, returning null");
      }

      if (!settings && seedIfEmpty) {
        return rememberWhatsAppSettings(getWhatsAppSettingsFallback());
      }

      return settings
        ? rememberWhatsAppSettings(
            hydrateWhatsAppSettings(settings as PersistedWhatsAppSettingsRecord)
          )
        : null;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[WhatsAppSettings] Query failed:", errorMsg, {
        dbUrl: process.env.DATABASE_URL ? "set" : "NOT SET",
        seedIfEmpty,
        fallbackOnError,
      });

      if (fallbackOnError) {
        return getWhatsAppSettingsFallback();
      }

      throw error;
    } finally {
      pendingWhatsAppRequests.delete(requestKey);
    }
  })();

  pendingWhatsAppRequests.set(requestKey, request);

  return request;
}

export function serializeWhatsAppSettings(input: Pick<
  WhatsAppSettings,
  "phoneNumber" | "defaultMessage" | "isActive" | "position"
>) {
  return {
    phoneNumber: normalizeWhatsAppPhoneNumber(input.phoneNumber),
    defaultMessage: encodePersistedWhatsAppMessage(
      input.defaultMessage,
      normalizeWhatsAppPosition(input.position)
    ),
    isActive: input.isActive,
  };
}
