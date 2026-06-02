import { unstable_cache } from "next/cache";
import { DEFAULT_HERO_SLIDE_SEEDS, createHeroSlideSeed } from "@/lib/default-hero-slides";
import { isProductionRuntime } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { HeroSlide } from "@/types";

type HeroSlideQueryOptions = {
  activeOnly?: boolean;
};

const HOMEPAGE_REVALIDATE_SECONDS = 60;
let lastKnownHeroSlides: HeroSlide[] = [];

function normalizeMoodTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);
}

function normalizeHeroSlideRecord(record: {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  moodTags: unknown;
  locationBadge: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): HeroSlide {
  return {
    id: record.id,
    title: record.title,
    subtitle: record.subtitle,
    imageUrl: record.imageUrl,
    ctaText: record.ctaText,
    ctaLink: record.ctaLink,
    moodTags: normalizeMoodTags(record.moodTags),
    locationBadge: record.locationBadge,
    order: record.order,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function getDefaultHeroSlides() {
  return DEFAULT_HERO_SLIDE_SEEDS.map((seed) => createHeroSlideSeed(seed));
}

function rememberHeroSlides(slides: HeroSlide[]) {
  if (slides.length > 0) {
    lastKnownHeroSlides = slides;
  }

  return slides;
}

function getHeroSlidesFallback() {
  return lastKnownHeroSlides.length > 0 ? lastKnownHeroSlides : getDefaultHeroSlides();
}

export async function getHeroSlides(options: HeroSlideQueryOptions = {}): Promise<HeroSlide[]> {
  const { activeOnly = false } = options;
  const loadSlides = async () => {
    try {
      const slides = await prisma.heroSlide.findMany({
        where: activeOnly ? { isActive: true } : undefined,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });

      return rememberHeroSlides(slides.map((slide) => normalizeHeroSlideRecord(slide)));
    } catch (error) {
      console.error("[HeroSlides] Lookup failed:", error);
      // Fall back to last known slides (or default seeds) in all environments.
      return getHeroSlidesFallback();
    }
  };

  if (activeOnly) {
    return unstable_cache(loadSlides, ["hero-slides", "active"], {
      revalidate: HOMEPAGE_REVALIDATE_SECONDS,
      tags: ["homepage", "hero-slides"],
    })();
  }

  return loadSlides();
}

export async function getActiveHeroSlides() {
  return getHeroSlides({ activeOnly: true });
}
