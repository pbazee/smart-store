import type { SocialLink } from "@/types";

export type SocialLinkSeed = Omit<SocialLink, "createdAt" | "updatedAt">;

export const DEFAULT_SOCIAL_LINK_SEEDS: SocialLinkSeed[] = [
  {
    id: "seed-social-instagram",
    platform: "instagram",
    url: "https://instagram.com/smarteststoreke",
    icon: "instagram",
  },
  {
    id: "seed-social-tiktok",
    platform: "tiktok",
    url: "https://tiktok.com/@smarteststoreke",
    icon: "tiktok",
  },
  {
    id: "seed-social-facebook",
    platform: "facebook",
    url: "https://facebook.com/smarteststoreke",
    icon: "facebook",
  },
  {
    id: "seed-social-x",
    platform: "x",
    url: "https://x.com/smarteststoreke",
    icon: "x",
  },
];

export function createSocialLinkSeed(seed: SocialLinkSeed): SocialLink {
  const timestamp = new Date("2026-01-01T00:00:00.000Z");

  return {
    ...seed,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
