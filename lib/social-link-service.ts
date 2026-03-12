import {
  DEFAULT_SOCIAL_LINK_SEEDS,
  createSocialLinkSeed,
} from "@/lib/default-social-links";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { SocialLink } from "@/types";

let demoSocialLinksState: SocialLink[] = DEFAULT_SOCIAL_LINK_SEEDS.map((seed) =>
  createSocialLinkSeed(seed)
);

function cloneSocialLink(link: SocialLink): SocialLink {
  return {
    ...link,
    createdAt: link.createdAt instanceof Date ? new Date(link.createdAt) : link.createdAt,
    updatedAt: link.updatedAt instanceof Date ? new Date(link.updatedAt) : link.updatedAt,
  };
}

function sortSocialLinks(links: SocialLink[]) {
  return [...links].sort((left, right) => {
    const leftDate = new Date(left.createdAt).getTime();
    const rightDate = new Date(right.createdAt).getTime();
    return leftDate - rightDate;
  });
}

export function getDemoSocialLinks() {
  return sortSocialLinks(demoSocialLinksState).map(cloneSocialLink);
}

export function createDemoSocialLink(input: Omit<SocialLink, "createdAt" | "updatedAt">) {
  const now = new Date();
  const nextLink: SocialLink = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  demoSocialLinksState = sortSocialLinks([...demoSocialLinksState, nextLink]);
  return cloneSocialLink(nextLink);
}

export function updateDemoSocialLink(
  socialLinkId: string,
  input: Omit<SocialLink, "createdAt" | "updatedAt">
) {
  const currentLink = demoSocialLinksState.find((link) => link.id === socialLinkId);
  if (!currentLink) {
    throw new Error("Social link not found");
  }

  const nextLink: SocialLink = {
    ...input,
    createdAt: currentLink.createdAt,
    updatedAt: new Date(),
  };

  demoSocialLinksState = sortSocialLinks(
    demoSocialLinksState.map((link) => (link.id === socialLinkId ? nextLink : link))
  );

  return cloneSocialLink(nextLink);
}

export function deleteDemoSocialLink(socialLinkId: string) {
  demoSocialLinksState = demoSocialLinksState.filter((link) => link.id !== socialLinkId);
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

  if (shouldUseMockData()) {
    return getDemoSocialLinks();
  }

  if (seedIfEmpty) {
    await ensureSocialLinksSeeded();
  }

  const links = await prisma.socialLink.findMany({
    orderBy: { createdAt: "asc" },
  });

  return links as SocialLink[];
}
