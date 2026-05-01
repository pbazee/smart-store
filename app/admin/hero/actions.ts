"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { getHeroSlides } from "@/lib/hero-slide-service";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import { prisma } from "@/lib/prisma";
import { deleteHeroSlideImage, uploadHeroSlideImage } from "@/lib/supabase-storage";
import type { HeroSlide } from "@/types";

const optionalLinkSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith("/")) return true;
      try { new URL(value); return true; } catch { return false; }
    },
    { message: "Link must be a valid URL or start with /" }
  );

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "Image is required")
  .refine(
    (value) => {
      if (value.startsWith("data:image/") || value.startsWith("/")) return true;
      try { new URL(value); return true; } catch { return false; }
    },
    { message: "Image must be a valid URL or uploaded image." }
  );

const adminHeroSlideSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Title is required").max(120, "Keep it under 120 characters"),
  subtitle: z.string().trim().min(12, "Subtitle is required").max(280, "Keep it under 280 characters"),
  imageUrl: imageUrlSchema,
  ctaText: z.string().trim().min(2, "CTA text is required").max(40, "Keep it under 40 characters"),
  ctaLink: optionalLinkSchema,
  moodTags: z.array(z.string().trim().min(1).max(24)).max(6).default([]),
  locationBadge: z.string().trim().max(80, "Keep it under 80 characters").default(""),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

const reorderSchema = z.array(
  z.object({ id: z.string().min(1), order: z.number().int().min(0) })
);

export type AdminHeroSlideInput = z.infer<typeof adminHeroSlideSchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) throw new Error("Unauthorized");
}

function normalizeHeroSlideInput(input: AdminHeroSlideInput) {
  const data = adminHeroSlideSchema.parse(input);
  return {
    id: data.id,
    title: data.title.trim(),
    subtitle: data.subtitle.trim(),
    imageUrl: data.imageUrl.trim(),
    ctaText: data.ctaText.trim(),
    ctaLink: data.ctaLink?.trim() || "/shop",
    moodTags: data.moodTags.map((tag) => tag.trim()).filter(Boolean),
    locationBadge: data.locationBadge.trim(),
    isActive: data.isActive,
    order: data.order,
  };
}

function revalidateHeroPaths() {
  revalidateTag('hero-slides');
  revalidateTag('homepage-shell');
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/hero");
}

export async function fetchAdminHeroSlides() {
  await ensureAdmin();
  return getHeroSlides();
}

export async function uploadHeroSlideImageAction(formData: FormData) {
  await ensureAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Please choose an image to upload.");
  if (!file.type.startsWith("image/")) throw new Error("Only image uploads are supported.");
  const imageUrl = await uploadHeroSlideImage(file);
  return { imageUrl };
}

export async function cleanupHeroSlideImageAction(imageUrl: string) {
  await ensureAdmin();
  const normalizedImageUrl = z.string().trim().min(1).parse(imageUrl);
  await deleteHeroSlideImage(normalizedImageUrl);
  return { cleaned: true };
}

export async function createAdminHeroSlideAction(input: AdminHeroSlideInput) {
  await ensureAdmin();
  const data = normalizeHeroSlideInput(input);

  const slide = await prisma.heroSlide.create({
    data: {
      title: data.title,
      subtitle: data.subtitle,
      imageUrl: data.imageUrl,
      ctaText: data.ctaText,
      ctaLink: data.ctaLink,
      moodTags: data.moodTags,
      locationBadge: data.locationBadge,
      isActive: data.isActive,
      order: data.order,
    },
  });

  revalidateHeroPaths();
  return { ...slide, moodTags: data.moodTags } as HeroSlide;
}

export async function updateAdminHeroSlideAction(input: AdminHeroSlideInput) {
  await ensureAdmin();
  const data = adminHeroSlideSchema.extend({ id: z.string().min(1) }).parse(input);
  const normalized = normalizeHeroSlideInput(data);

  const existingSlide = await prisma.heroSlide.findUnique({ where: { id: data.id } });
  if (!existingSlide) throw new Error("Hero slide not found.");

  const slide = await prisma.heroSlide.update({
    where: { id: data.id },
    data: {
      title: normalized.title,
      subtitle: normalized.subtitle,
      imageUrl: normalized.imageUrl,
      ctaText: normalized.ctaText,
      ctaLink: normalized.ctaLink,
      moodTags: normalized.moodTags,
      locationBadge: normalized.locationBadge,
      isActive: normalized.isActive,
      order: normalized.order,
    },
  });

  if (existingSlide.imageUrl !== normalized.imageUrl) {
    await deleteHeroSlideImage(existingSlide.imageUrl);
  }

  revalidateHeroPaths();
  return { ...slide, moodTags: normalized.moodTags } as HeroSlide;
}

export async function saveAdminHeroSlideOrderAction(input: Array<{ id: string; order: number }>) {
  await ensureAdmin();
  const normalized = reorderSchema.parse(input);

  await prisma.$transaction(
    normalized.map((item) =>
      prisma.heroSlide.update({ where: { id: item.id }, data: { order: item.order } })
    )
  );

  revalidateHeroPaths();
  return getHeroSlides();
}

export async function deleteAdminHeroSlideAction(slideId: string) {
  await ensureAdmin();
  const id = z.string().min(1).parse(slideId);

  const existingSlide = await prisma.heroSlide.findUnique({ where: { id } });

  await prisma.heroSlide.delete({ where: { id } });

  if (existingSlide?.imageUrl) {
    await deleteHeroSlideImage(existingSlide.imageUrl);
  }

  revalidateHeroPaths();
  return { deletedId: id };
}
