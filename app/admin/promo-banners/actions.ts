"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import {
  createPromoBanner,
  deletePromoBanner,
  getPromoBanners,
  savePromoBannerOrder,
  updatePromoBanner,
} from "@/lib/promo-banner-service";
import { deleteStoreAsset, uploadStoreAsset } from "@/lib/supabase-storage";
import type { PromoBanner } from "@/types";

const optionalLinkSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith("/")) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "CTA link must be a valid URL or start with /" }
  );

const optionalImageUrlSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith("/")) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Background image must be a valid URL or uploaded image." }
  );

const adminPromoBannerSchema = z
  .object({
    id: z.string().optional(),
    badgeText: z.string().trim().max(40, "Keep badge text under 40 characters").optional().or(z.literal("")),
    title: z.string().trim().min(2, "Title is required").max(120, "Keep title under 120 characters"),
    subtitle: z.string().trim().max(160, "Keep subtitle under 160 characters").optional().or(z.literal("")),
    ctaText: z.string().trim().max(40, "Keep CTA text under 40 characters").optional().or(z.literal("")),
    ctaLink: optionalLinkSchema,
    backgroundImageUrl: optionalImageUrlSchema,
    backgroundColor: z.string().trim().max(40, "Keep background color under 40 characters").optional().or(z.literal("")),
    isActive: z.boolean().default(true),
    position: z.number().int().min(0).default(0),
  })
  .superRefine((data, context) => {
    const hasCtaText = Boolean(data.ctaText?.trim());
    const hasCtaLink = Boolean(data.ctaLink?.trim());

    if (hasCtaText !== hasCtaLink) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasCtaText ? "ctaLink" : "ctaText"],
        message: "CTA text and CTA link should be filled together.",
      });
    }
  });

const reorderSchema = z.array(
  z.object({ id: z.string().min(1), position: z.number().int().min(0) })
);

export type AdminPromoBannerInput = z.infer<typeof adminPromoBannerSchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) throw new Error("Unauthorized");
}

function normalizePromoBannerInput(input: AdminPromoBannerInput) {
  const data = adminPromoBannerSchema.parse(input);
  return {
    id: data.id,
    badgeText: data.badgeText?.trim() || null,
    title: data.title.trim(),
    subtitle: data.subtitle?.trim() || null,
    ctaText: data.ctaText?.trim() || null,
    ctaLink: data.ctaLink?.trim() || null,
    backgroundImageUrl: data.backgroundImageUrl?.trim() || null,
    backgroundColor: data.backgroundColor?.trim() || null,
    isActive: data.isActive,
    position: data.position,
  };
}

function revalidatePromoBannerPaths() {
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidateTag("promo-banners");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/promo-banners");
}

export async function fetchAdminPromoBanners() {
  await ensureAdmin();
  return getPromoBanners({ seedIfEmpty: true });
}

export async function uploadPromoBannerImageAction(formData: FormData) {
  await ensureAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Please choose an image to upload.");
  if (!file.type.startsWith("image/")) throw new Error("Only image uploads are supported.");
  const imageUrl = await uploadStoreAsset(file, "promo-banner", "promo-banners");
  return { imageUrl };
}

export async function cleanupPromoBannerImageAction(imageUrl: string) {
  await ensureAdmin();
  const normalizedImageUrl = z.string().trim().min(1).parse(imageUrl);
  await deleteStoreAsset(normalizedImageUrl);
  return { cleaned: true };
}

export async function createAdminPromoBannerAction(input: AdminPromoBannerInput) {
  await ensureAdmin();
  const data = normalizePromoBannerInput(input);
  const banner = await createPromoBanner(data);
  revalidatePromoBannerPaths();
  return banner as PromoBanner;
}

export async function updateAdminPromoBannerAction(input: AdminPromoBannerInput) {
  await ensureAdmin();
  const id = z.string().min(1).parse(input.id);
  const normalized = normalizePromoBannerInput({ ...input, id });
  const existingBanners = await getPromoBanners({ seedIfEmpty: true });
  const existingBanner = existingBanners.find((banner) => banner.id === id);

  if (!existingBanner) {
    throw new Error("Promotional banner not found.");
  }

  const banner = await updatePromoBanner(id, normalized);

  if (
    existingBanner.backgroundImageUrl &&
    existingBanner.backgroundImageUrl !== banner.backgroundImageUrl
  ) {
    await deleteStoreAsset(existingBanner.backgroundImageUrl);
  }

  revalidatePromoBannerPaths();
  return banner;
}

export async function saveAdminPromoBannerOrderAction(
  input: Array<{ id: string; position: number }>
) {
  await ensureAdmin();
  const normalized = reorderSchema.parse(input);
  const banners = await savePromoBannerOrder(normalized);
  revalidatePromoBannerPaths();
  return banners;
}

export async function deleteAdminPromoBannerAction(bannerId: string) {
  await ensureAdmin();
  const id = z.string().min(1).parse(bannerId);
  const banner = await deletePromoBanner(id);

  if (banner.backgroundImageUrl) {
    await deleteStoreAsset(banner.backgroundImageUrl);
  }

  revalidatePromoBannerPaths();
  return { deletedId: id };
}
