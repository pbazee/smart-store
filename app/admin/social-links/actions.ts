"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import {
  createDemoSocialLink,
  deleteDemoSocialLink,
  getSocialLinks,
  updateDemoSocialLink,
} from "@/lib/social-link-service";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { SocialLink } from "@/types";

const socialLinkSchema = z.object({
  id: z.string().optional(),
  platform: z.enum([
    "instagram",
    "tiktok",
    "facebook",
    "x",
    "youtube",
    "linkedin",
    "whatsapp",
  ]),
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .url("Enter a valid URL"),
  icon: z.string().trim().optional().or(z.literal("")),
});

export type AdminSocialLinkInput = z.infer<typeof socialLinkSchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function normalizeSocialLinkInput(input: AdminSocialLinkInput) {
  const data = socialLinkSchema.parse(input);

  return {
    id: data.id,
    platform: data.platform,
    url: data.url.trim(),
    icon: data.icon?.trim() || null,
  };
}

function revalidateSocialLinkPaths() {
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/social-links");
}

export async function fetchAdminSocialLinks() {
  await ensureAdmin();
  return getSocialLinks({ seedIfEmpty: true });
}

export async function createAdminSocialLinkAction(input: AdminSocialLinkInput) {
  await ensureAdmin();
  const data = normalizeSocialLinkInput(input);

  if (shouldUseMockData()) {
    const link = createDemoSocialLink({
      id: crypto.randomUUID(),
      platform: data.platform,
      url: data.url,
      icon: data.icon,
    });
    revalidateSocialLinkPaths();
    return link;
  }

  const link = await prisma.socialLink.create({
    data: {
      platform: data.platform,
      url: data.url,
      icon: data.icon,
    },
  });

  revalidateSocialLinkPaths();
  return link as SocialLink;
}

export async function updateAdminSocialLinkAction(input: AdminSocialLinkInput) {
  await ensureAdmin();
  const id = z.string().min(1).parse(input.id);
  const normalized = normalizeSocialLinkInput({ ...input, id });

  if (shouldUseMockData()) {
    const link = updateDemoSocialLink(id, {
      id,
      platform: normalized.platform,
      url: normalized.url,
      icon: normalized.icon,
    });
    revalidateSocialLinkPaths();
    return link;
  }

  const link = await prisma.socialLink.update({
    where: { id },
    data: {
      platform: normalized.platform,
      url: normalized.url,
      icon: normalized.icon,
    },
  });

  revalidateSocialLinkPaths();
  return link as SocialLink;
}

export async function deleteAdminSocialLinkAction(socialLinkId: string) {
  await ensureAdmin();
  const id = z.string().min(1).parse(socialLinkId);

  if (shouldUseMockData()) {
    deleteDemoSocialLink(id);
    revalidateSocialLinkPaths();
    return { deletedId: id };
  }

  await prisma.socialLink.delete({
    where: { id },
  });

  revalidateSocialLinkPaths();
  return { deletedId: id };
}
