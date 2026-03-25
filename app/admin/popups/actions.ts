"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { getPopups } from "@/lib/popup-service";
import { prisma } from "@/lib/prisma";
import { deletePopupImage, uploadPopupImage } from "@/lib/supabase-storage";
import type { Popup } from "@/types";

const optionalImageUrlSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith("data:image/") || value.startsWith("/")) return true;
      try { new URL(value); return true; } catch { return false; }
    },
    { message: "Image must be a valid URL or uploaded image." }
  );

const popupLinkSchema = z
  .string()
  .trim()
  .min(1, "CTA link is required")
  .refine(
    (value) => {
      if (value.startsWith("/")) return true;
      try { new URL(value); return true; } catch { return false; }
    },
    { message: "CTA link must be a valid URL or start with /" }
  );

const adminPopupSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Title is required").max(120, "Keep it under 120 characters"),
  message: z.string().trim().min(8, "Message is required").max(400, "Keep it under 400 characters"),
  imageUrl: optionalImageUrlSchema,
  ctaText: z.string().trim().min(2, "CTA text is required").max(40, "Keep it under 40 characters"),
  ctaLink: popupLinkSchema,
  showOn: z.enum(["homepage", "all"]),
  delaySeconds: z.number().int().min(0).max(30),
  isActive: z.boolean().default(true),
  expiresAt: z.string().trim().optional().or(z.literal("")),
});

export type AdminPopupInput = z.infer<typeof adminPopupSchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) throw new Error("Unauthorized");
}

function parseOptionalDate(value?: string) {
  const normalized = value?.trim();
  if (!normalized) return null;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new Error("Use a valid expiry date.");
  return date;
}

function normalizePopupInput(input: AdminPopupInput) {
  const data = adminPopupSchema.parse(input);
  return {
    id: data.id,
    title: data.title.trim(),
    message: data.message.trim(),
    imageUrl: data.imageUrl?.trim() || null,
    ctaText: data.ctaText.trim(),
    ctaLink: data.ctaLink.trim(),
    showOn: data.showOn,
    delaySeconds: data.delaySeconds,
    isActive: data.isActive,
    expiresAt: parseOptionalDate(data.expiresAt),
  };
}

function revalidatePopupPaths() {
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/popups");
}

export async function fetchAdminPopups() {
  await ensureAdmin();
  return getPopups();
}

export async function uploadPopupImageAction(formData: FormData) {
  await ensureAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Please choose an image to upload.");
  if (!file.type.startsWith("image/")) throw new Error("Only image uploads are supported.");
  const imageUrl = await uploadPopupImage(file);
  return { imageUrl };
}

export async function cleanupPopupImageAction(imageUrl: string) {
  await ensureAdmin();
  const normalizedImageUrl = z.string().trim().min(1).parse(imageUrl);
  await deletePopupImage(normalizedImageUrl);
  return { cleaned: true };
}

export async function createAdminPopupAction(input: AdminPopupInput) {
  await ensureAdmin();
  const data = normalizePopupInput(input);

  const popup = await prisma.popup.create({
    data: {
      title: data.title,
      message: data.message,
      imageUrl: data.imageUrl,
      ctaText: data.ctaText,
      ctaLink: data.ctaLink,
      showOn: data.showOn,
      delaySeconds: data.delaySeconds,
      isActive: data.isActive,
      expiresAt: data.expiresAt,
    },
  });

  revalidatePopupPaths();
  return popup as Popup;
}

export async function updateAdminPopupAction(input: AdminPopupInput) {
  await ensureAdmin();
  const id = z.string().min(1).parse(input.id);
  const normalized = normalizePopupInput({ ...input, id });

  const existingPopup = await prisma.popup.findUnique({ where: { id } });
  if (!existingPopup) throw new Error("Popup not found.");

  const popup = await prisma.popup.update({
    where: { id },
    data: {
      title: normalized.title,
      message: normalized.message,
      imageUrl: normalized.imageUrl,
      ctaText: normalized.ctaText,
      ctaLink: normalized.ctaLink,
      showOn: normalized.showOn,
      delaySeconds: normalized.delaySeconds,
      isActive: normalized.isActive,
      expiresAt: normalized.expiresAt,
    },
  });

  if (existingPopup.imageUrl && existingPopup.imageUrl !== normalized.imageUrl) {
    await deletePopupImage(existingPopup.imageUrl);
  }

  revalidatePopupPaths();
  return popup as Popup;
}

export async function deleteAdminPopupAction(popupId: string) {
  await ensureAdmin();
  const id = z.string().min(1).parse(popupId);

  const existingPopup = await prisma.popup.findUnique({ where: { id } });

  await prisma.popup.delete({ where: { id } });

  if (existingPopup?.imageUrl) {
    await deletePopupImage(existingPopup.imageUrl);
  }

  revalidatePopupPaths();
  return { deletedId: id };
}
