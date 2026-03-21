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

export type SaveWhatsAppResult =
  | { success: true; data: WhatsAppSettings }
  | { success: false; error: string };

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
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) return null;
  try {
    return await getWhatsAppSettings({ seedIfEmpty: true });
  } catch (err) {
    console.error("[WhatsApp] fetchAdminWhatsAppSettings failed:", err);
    return null;
  }
}

export async function updateAdminWhatsAppSettingsAction(
  input: AdminWhatsAppSettingsInput
): Promise<SaveWhatsAppResult> {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized. Please log in as admin." };
    }

    let validatedInput: AdminWhatsAppSettingsInput;
    try {
      validatedInput = whatsappSettingsSchema.parse(input);
    } catch (err: any) {
      const firstIssue = err?.errors?.[0];
      return {
        success: false,
        error: firstIssue?.message || "Invalid input. Check all fields and try again.",
      };
    }

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
      return { success: true, data: settings as WhatsAppSettings };
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
    return {
      success: true,
      data: {
        ...settings,
        defaultMessage: validatedInput.defaultMessage.trim(),
        position: validatedInput.position,
      } as WhatsAppSettings,
    };
  } catch (err: any) {
    console.error("[WhatsApp Settings] updateAdminWhatsAppSettingsAction failed:", err?.message ?? err);
    return {
      success: false,
      error: err?.message || "Failed to save WhatsApp settings. Please try again.",
    };
  }
}
