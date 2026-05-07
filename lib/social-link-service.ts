import "server-only";

import {
  DEFAULT_SOCIAL_LINK_SEEDS,
} from "@/lib/default-social-links";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-error-utils";
import type { SocialLink } from "@/types";

let lastKnownSocialLinks: SocialLink[] | null = null;
const pendingSocialLinkRequests = new Map<string, Promise<SocialLink[]>>();

function getSocialLinksFallback() {
  return (lastKnownSocialLinks && lastKnownSocialLinks.length > 0
    ? lastKnownSocialLinks
    : DEFAULT_SOCIAL_LINK_SEEDS) as SocialLink[];
}

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
  const requestKey = seedIfEmpty ? "seed" : "noseed";
  const existingRequest = pendingSocialLinkRequests.get(requestKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      if (seedIfEmpty) {
        await ensureSocialLinksSeeded();
      }

      const links = await prisma.socialLink.findMany({
        orderBy: { createdAt: "asc" },
      });

      lastKnownSocialLinks = links as SocialLink[];

      return lastKnownSocialLinks;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        console.warn("[SocialLinks] Database unavailable, returning fallback social links.");
      } else {
        console.error("[SocialLinks] Query failed:", error);
      }
      return getSocialLinksFallback();
    }
  })().finally(() => {
    pendingSocialLinkRequests.delete(requestKey);
  });

  pendingSocialLinkRequests.set(requestKey, request);

  return request;
}
