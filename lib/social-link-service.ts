import {
  DEFAULT_SOCIAL_LINK_SEEDS,
} from "@/lib/default-social-links";
import { prisma } from "@/lib/prisma";
import type { SocialLink } from "@/types";

async function ensureSocialLinksSeeded() {
  const existingCount = await prisma.socialLink.count();
  if (existingCount > 0) {
    return;
  }

  await prisma.socialLink.createMany({
    data: DEFAULT_SOCIAL_LINK_SEEDS,
    skipDuplicates: true,
  });
}

export async function getSocialLinks(options: { seedIfEmpty?: boolean } = {}) {
  const { seedIfEmpty = false } = options;

  if (seedIfEmpty) {
    await ensureSocialLinksSeeded();
  }

  const links = await prisma.socialLink.findMany({
    orderBy: { createdAt: "asc" },
  });

  return links as SocialLink[];
}
