import "server-only";

import {
  DEFAULT_SOCIAL_LINK_SEEDS,
} from "@/lib/default-social-links";
import { prisma, withPrismaRetry } from "@/lib/prisma";
import type { SocialLink } from "@/types";

let lastKnownSocialLinks: SocialLink[] | null = null;
const pendingSocialLinkRequests = new Map<string, Promise<SocialLink[]>>();

async function ensureSocialLinksSeeded() {
  const existingCount = await withPrismaRetry("ensureSocialLinksSeeded count", () =>
    prisma.socialLink.count()
  );
  if (existingCount > 0) {
    return;
  }

  await withPrismaRetry("ensureSocialLinksSeeded createMany", () =>
    prisma.socialLink.createMany({
      data: DEFAULT_SOCIAL_LINK_SEEDS,
      skipDuplicates: true,
    })
  );
}

export async function getSocialLinks(options: { seedIfEmpty?: boolean } = {}) {
  const { seedIfEmpty = false } = options;
  const requestKey = seedIfEmpty ? "seed" : "noseed";
  const existingRequest = pendingSocialLinkRequests.get(requestKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    if (seedIfEmpty) {
      await ensureSocialLinksSeeded();
    }

    const links = await withPrismaRetry("getSocialLinks", () =>
      prisma.socialLink.findMany({
        orderBy: { createdAt: "asc" },
      })
    );

    lastKnownSocialLinks = links as SocialLink[];

    return lastKnownSocialLinks;
  })().finally(() => {
    pendingSocialLinkRequests.delete(requestKey);
  });

  pendingSocialLinkRequests.set(requestKey, request);

  return request;
}
