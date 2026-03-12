"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import {
  getWhatsAppSettings,
  normalizeWhatsAppPhoneNumber,
  updateDemoWhatsAppSettings,
} from "@/lib/whatsapp-service";
import { DEFAULT_WHATSAPP_SETTINGS } from "@/lib/default-whatsapp-settings";
import type { WhatsAppSettings } from "@/types";

const whatsappSettingsSchema = z.object({
  phoneNumber: z.string().trim().min(7, "Phone number is required"),
  defaultMessage: z.string().trim().min(4, "Default message is required"),
  isActive: z.boolean().default(true),
});

export type AdminWhatsAppSettingsInput = z.infer<typeof whatsappSettingsSchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function normalizeWhatsAppSettingsInput(input: AdminWhatsAppSettingsInput) {
  const data = whatsappSettingsSchema.parse(input);

  return {
    phoneNumber: normalizeWhatsAppPhoneNumber(data.phoneNumber),
    defaultMessage: data.defaultMessage.trim(),
    isActive: data.isActive,
  };
}

function revalidateWhatsAppPaths() {
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/whatsapp-settings");
}

export async function fetchAdminWhatsAppSettings() {
  await ensureAdmin();
  return getWhatsAppSettings({ seedIfEmpty: true });
}

export async function updateAdminWhatsAppSettingsAction(
  input: AdminWhatsAppSettingsInput
) {
  await ensureAdmin();
  const data = normalizeWhatsAppSettingsInput(input);

  if (shouldUseMockData()) {
    const settings = updateDemoWhatsAppSettings({
      id: DEFAULT_WHATSAPP_SETTINGS.id,
      phoneNumber: data.phoneNumber,
      defaultMessage: data.defaultMessage,
      isActive: data.isActive,
    });
    revalidateWhatsAppPaths();
    return settings;
  }

  const settings = await prisma.whatsAppSettings.upsert({
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

  revalidateWhatsAppPaths();
  return settings as WhatsAppSettings;
}
