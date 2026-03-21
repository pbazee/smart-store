"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import {
  getWhatsAppSettings,
  serializeWhatsAppSettings,
  updateDemoWhatsAppSettings,
} from "@/lib/whatsapp-service";
import { DEFAULT_WHATSAPP_SETTINGS } from "@/lib/default-whatsapp-settings";
import type { WhatsAppSettings } from "@/types";

const whatsappSettingsSchema = z.object({
  phoneNumber: z.string().trim().min(7, "Phone number is required"),
  defaultMessage: z.string().trim().min(4, "Default message is required"),
  isActive: z.boolean().default(true),
  position: z.enum(["left", "right"]).default("right"),
});

export type AdminWhatsAppSettingsInput = z.infer<typeof whatsappSettingsSchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function revalidateWhatsAppPaths() {
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/faq");
  revalidatePath("/admin");
  revalidatePath("/admin/whatsapp-settings");
  revalidatePath("/admin/settings");
}

export async function fetchAdminWhatsAppSettings() {
  await ensureAdmin();
  return getWhatsAppSettings({ seedIfEmpty: true });
}

export async function updateAdminWhatsAppSettingsAction(
  input: AdminWhatsAppSettingsInput
) {
  await ensureAdmin();
  const validatedInput = whatsappSettingsSchema.parse(input);
  const data = serializeWhatsAppSettings(validatedInput);

  if (shouldUseMockData()) {
    const settings = updateDemoWhatsAppSettings({
      id: DEFAULT_WHATSAPP_SETTINGS.id,
      phoneNumber: data.phoneNumber,
      defaultMessage: validatedInput.defaultMessage.trim(),
      isActive: data.isActive,
      position: validatedInput.position,
    });
    revalidateWhatsAppPaths();
    return settings;
  }

  let settings;
  try {
    settings = await prisma.whatsAppSettings.upsert({
      where: { id: DEFAULT_WHATSAPP_SETTINGS.id },
      update: {
        phoneNumber: data.phoneNumber,
        defaultMessage: data.defaultMessage,
        isActive: data.isActive,
      },
      create: {
        id: DEFAULT_WHATSAPP_SETTINGS.id,
        phoneNumber: data.phoneNumber,
        defaultMessage: data.defaultMessage,
        isActive: data.isActive,
      },
    });
  } catch (error: any) {
    console.error("[WhatsApp Settings] upsert failed:", error?.message ?? error);
    throw new Error("Failed to save WhatsApp settings. Please try again.");
  }

  revalidateWhatsAppPaths();
  return {
    ...settings,
    defaultMessage: validatedInput.defaultMessage.trim(),
    position: validatedInput.position,
  } as WhatsAppSettings;
}
