import type { WhatsAppSettings } from "@/types";

export const DEFAULT_WHATSAPP_SETTINGS: Omit<
  WhatsAppSettings,
  "createdAt" | "updatedAt"
> = {
  id: "default",
  phoneNumber: "+254700000000",
  defaultMessage: "Hi Smartest Store KE, I would love help with my order.",
  isActive: true,
};

export function createDefaultWhatsAppSettings(): WhatsAppSettings {
  const timestamp = new Date("2026-01-01T00:00:00.000Z");

  return {
    ...DEFAULT_WHATSAPP_SETTINGS,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
