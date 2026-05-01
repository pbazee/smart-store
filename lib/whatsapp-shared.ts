import {
  DEFAULT_WHATSAPP_SETTINGS,
  createDefaultWhatsAppSettings,
} from "@/lib/default-whatsapp-settings";
import type { WhatsAppPosition, WhatsAppSettings } from "@/types";

const WHATSAPP_SETTINGS_META_PREFIX = "__smartest_store_whatsapp__";

export function normalizeWhatsAppPosition(position?: string | null): WhatsAppPosition {
  return position === "left" ? "left" : "right";
}

export function normalizeWhatsAppPhoneNumber(phoneNumber: string) {
  return phoneNumber.trim();
}

export function buildWhatsAppHref(phoneNumber: string, defaultMessage: string) {
  const normalizedPhone = phoneNumber.replace(/[^\d]/g, "");
  const message = encodeURIComponent(defaultMessage);
  return `https://wa.me/${normalizedPhone}?text=${message}`;
}

export function decodePersistedWhatsAppMessage(defaultMessage: string) {
  if (!defaultMessage.startsWith(WHATSAPP_SETTINGS_META_PREFIX)) {
    return {
      defaultMessage,
      position: DEFAULT_WHATSAPP_SETTINGS.position,
    };
  }

  try {
    const parsed = JSON.parse(
      defaultMessage.slice(WHATSAPP_SETTINGS_META_PREFIX.length)
    ) as { message: string; position?: WhatsAppPosition };

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

export function encodePersistedWhatsAppMessage(
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

export function hydrateWhatsAppSettings(
  settings: Pick<WhatsAppSettings, "defaultMessage"> & WhatsAppSettings
): WhatsAppSettings {
  const decoded = decodePersistedWhatsAppMessage(settings.defaultMessage);

  return {
    ...settings,
    defaultMessage: decoded.defaultMessage,
    position: "position" in settings ? normalizeWhatsAppPosition(settings.position) : decoded.position,
  };
}

export function getWhatsAppSettingsFallback() {
  return createDefaultWhatsAppSettings();
}
