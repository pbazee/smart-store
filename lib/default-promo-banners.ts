import type { PromoBanner } from "@/types";

export type PromoBannerSeed = Omit<PromoBanner, "createdAt">;

export const DEFAULT_PROMO_BANNER_SEEDS: PromoBannerSeed[] = [
  {
    id: "promo-men-collection",
    badgeText: "Curated edit",
    title: "Men's Collection",
    subtitle: "Street-ready fits for every vibe",
    ctaText: "Shop Men's",
    ctaLink: "/shop?gender=men",
    backgroundImageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80",
    backgroundColor: "#111827",
    position: 0,
    isActive: true,
  },
  {
    id: "promo-women-collection",
    badgeText: "Curated edit",
    title: "Women's Collection",
    subtitle: "Elegant & bold styles for every occasion",
    ctaText: "Shop Women's",
    ctaLink: "/shop?gender=women",
    backgroundImageUrl:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=80",
    backgroundColor: "#431407",
    position: 1,
    isActive: true,
  },
];

export function createPromoBannerSeed(
  seed: PromoBannerSeed,
  createdAt = new Date()
): PromoBanner {
  return {
    ...seed,
    createdAt,
  };
}

export function getDefaultPromoBanners() {
  return DEFAULT_PROMO_BANNER_SEEDS.map((seed) => createPromoBannerSeed(seed));
}
