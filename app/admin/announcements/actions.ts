"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createDemoAnnouncement,
  deleteDemoAnnouncement,
  getAnnouncementMessages,
  updateDemoAnnouncement,
} from "@/lib/announcement-service";
import { requireAdminAuth } from "@/lib/auth-utils";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { AnnouncementMessage } from "@/types";

const optionalLinkSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => {
      if (!value) {
        return true;
      }

      if (value.startsWith("/")) {
        return true;
      }

      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Link must be a valid URL or start with /" }
  );

const optionalColorSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => !value || /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value),
    { message: "Use a valid hex color" }
  );

const adminAnnouncementSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(2, "Text is required").max(180, "Keep it under 180 characters"),
  icon: z.string().trim().min(1, "Icon is required").max(24, "Icon is too long"),
  link: optionalLinkSchema,
  bgColor: optionalColorSchema,
  textColor: optionalColorSchema,
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export type AdminAnnouncementInput = z.infer<typeof adminAnnouncementSchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function normalizeAnnouncementInput(input: AdminAnnouncementInput) {
  const data = adminAnnouncementSchema.parse(input);

  return {
    id: data.id,
    text: data.text.trim(),
    icon: data.icon.trim(),
    link: data.link?.trim() || null,
    bgColor: data.bgColor?.trim() || null,
    textColor: data.textColor?.trim() || null,
    isActive: data.isActive,
    order: data.order,
  };
}

function revalidateAnnouncementPaths() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
}

export async function fetchAdminAnnouncements() {
  await ensureAdmin();

  return getAnnouncementMessages({ seedIfEmpty: true });
}

export async function createAdminAnnouncementAction(input: AdminAnnouncementInput) {
  await ensureAdmin();
  const data = normalizeAnnouncementInput(input);

  if (shouldUseMockData()) {
    const announcement = createDemoAnnouncement({
      id: crypto.randomUUID(),
      text: data.text,
      icon: data.icon,
      link: data.link,
      bgColor: data.bgColor,
      textColor: data.textColor,
      isActive: data.isActive,
      order: data.order,
    });
    revalidateAnnouncementPaths();
    return announcement;
  }

  const announcement = await prisma.announcementMessage.create({
    data: {
      text: data.text,
      icon: data.icon,
      link: data.link,
      bgColor: data.bgColor,
      textColor: data.textColor,
      isActive: data.isActive,
      order: data.order,
    },
  });

  revalidateAnnouncementPaths();
  return announcement as AnnouncementMessage;
}

export async function updateAdminAnnouncementAction(input: AdminAnnouncementInput) {
  await ensureAdmin();
  const data = adminAnnouncementSchema.extend({ id: z.string().min(1) }).parse(input);
  const normalized = normalizeAnnouncementInput(data);

  if (shouldUseMockData()) {
    const announcement = updateDemoAnnouncement(data.id, {
      id: data.id,
      text: normalized.text,
      icon: normalized.icon,
      link: normalized.link,
      bgColor: normalized.bgColor,
      textColor: normalized.textColor,
      isActive: normalized.isActive,
      order: normalized.order,
    });
    revalidateAnnouncementPaths();
    return announcement;
  }

  const announcement = await prisma.announcementMessage.update({
    where: { id: data.id },
    data: {
      text: normalized.text,
      icon: normalized.icon,
      link: normalized.link,
      bgColor: normalized.bgColor,
      textColor: normalized.textColor,
      isActive: normalized.isActive,
      order: normalized.order,
    },
  });

  revalidateAnnouncementPaths();
  return announcement as AnnouncementMessage;
}

export async function deleteAdminAnnouncementAction(announcementId: string) {
  await ensureAdmin();
  const id = z.string().min(1).parse(announcementId);

  if (shouldUseMockData()) {
    deleteDemoAnnouncement(id);
    revalidateAnnouncementPaths();
    return { deletedId: id };
  }

  await prisma.announcementMessage.delete({
    where: { id },
  });

  revalidateAnnouncementPaths();
  return { deletedId: id };
}
