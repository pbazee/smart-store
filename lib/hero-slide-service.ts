import { DEFAULT_HERO_SLIDE_SEEDS, createHeroSlideSeed } from "@/lib/default-hero-slides";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { HeroSlide } from "@/types";

type HeroSlideQueryOptions = {
  activeOnly?: boolean;
};

let demoHeroSlidesState: HeroSlide[] = DEFAULT_HERO_SLIDE_SEEDS.map((seed, index) =>
  createHeroSlideSeed(seed, new Date(`2026-01-0${index + 1}T10:00:00.000Z`))
);

function cloneHeroSlide(slide: HeroSlide): HeroSlide {
  return {
    ...slide,
    moodTags: [...slide.moodTags],
    createdAt: new Date(slide.createdAt),
    updatedAt: new Date(slide.updatedAt),
  };
}

function sortHeroSlides(slides: HeroSlide[]) {
  return [...slides].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return String(left.id).localeCompare(String(right.id));
  });
}

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

export function getDemoHeroSlides(options: HeroSlideQueryOptions = {}) {
  const { activeOnly = false } = options;
  const slides = activeOnly
    ? demoHeroSlidesState.filter((slide) => slide.isActive)
    : demoHeroSlidesState;

  return sortHeroSlides(slides).map(cloneHeroSlide);
}

export function createDemoHeroSlide(input: Omit<HeroSlide, "createdAt" | "updatedAt">) {
  const nextSlide: HeroSlide = {
    ...input,
    moodTags: [...input.moodTags],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  demoHeroSlidesState = sortHeroSlides([nextSlide, ...demoHeroSlidesState]);
  return cloneHeroSlide(nextSlide);
}

export function updateDemoHeroSlide(
  slideId: string,
  input: Omit<HeroSlide, "createdAt" | "updatedAt">
) {
  const currentSlide = demoHeroSlidesState.find((slide) => slide.id === slideId);
  if (!currentSlide) {
    throw new Error("Hero slide not found");
  }

  const nextSlide: HeroSlide = {
    ...input,
    moodTags: [...input.moodTags],
    createdAt: currentSlide.createdAt,
    updatedAt: new Date(),
  };

  demoHeroSlidesState = sortHeroSlides(
    demoHeroSlidesState.map((slide) => (slide.id === slideId ? nextSlide : slide))
  );

  return cloneHeroSlide(nextSlide);
}

export function deleteDemoHeroSlide(slideId: string) {
  demoHeroSlidesState = demoHeroSlidesState.filter((slide) => slide.id !== slideId);
}

export function reorderDemoHeroSlides(orderMap: Array<{ id: string; order: number }>) {
  const orderLookup = new Map(orderMap.map((item) => [item.id, item.order]));

  demoHeroSlidesState = sortHeroSlides(
    demoHeroSlidesState.map((slide) =>
      orderLookup.has(slide.id)
        ? {
            ...slide,
            order: orderLookup.get(slide.id) ?? slide.order,
            updatedAt: new Date(),
          }
        : slide
    )
  );

  return demoHeroSlidesState.map(cloneHeroSlide);
}

export async function getHeroSlides(options: HeroSlideQueryOptions = {}): Promise<HeroSlide[]> {
  const { activeOnly = false } = options;

  if (shouldUseMockData()) {
    return getDemoHeroSlides({ activeOnly });
  }

  try {
    const slides = await prisma.heroSlide.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return slides.map((slide) => normalizeHeroSlideRecord(slide));
  } catch (error) {
    console.error("Hero slide lookup failed:", error);
    return getDefaultHeroSlides().filter((slide) => (activeOnly ? slide.isActive : true));
  }
}

export async function getActiveHeroSlides() {
  return getHeroSlides({ activeOnly: true });
}
