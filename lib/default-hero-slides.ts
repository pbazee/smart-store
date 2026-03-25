import type { HeroSlide } from "@/types";

export type HeroSlideSeed = Omit<HeroSlide, "createdAt" | "updatedAt">;

export const DEFAULT_HERO_SLIDE_SEEDS: HeroSlideSeed[] = [
  {
    id: "hero-nairobi-summer-edit",
    title: "Summer Arrival for Nairobi",
    subtitle:
      "Vibrant hoodies, clean cargos, and statement shades styled for fast city days, golden-hour linkups, and rooftop nights.",
    imageUrl:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1800&q=80",
    ctaText: "Explore New Arrivals",
    ctaLink: "/shop?collection=new-arrivals",
    moodTags: ["Golden hour", "Street utility", "City heat"],
    locationBadge: "CBD rooftops and Westlands side streets",
    order: 0,
    isActive: true,
  },
  {
    id: "hero-city-cargo-mood",
    title: "Light Layers, Bold Moves",
    subtitle:
      "Built around cargos, oversized hoodies, and confident color blocking that feels effortless from Kilimani mornings to late-night hangs.",
    imageUrl:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1800&q=80",
    ctaText: "Shop Trending Fits",
    ctaLink: "/shop?collection=trending",
    moodTags: ["Cargo focus", "Color pop", "After-hours"],
    locationBadge: "Kilimani corners and city cafe stops",
    order: 1,
    isActive: true,
  },
  {
    id: "hero-golden-hour-essentials",
    title: "Sun-Ready Fits, Street-Ready Finish",
    subtitle:
      "Fresh textures and breathable silhouettes for warm afternoons, quick photos, and all-day movement without losing the edge.",
    imageUrl:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=80",
    ctaText: "Discover Womenswear",
    ctaLink: "/shop?gender=women",
    moodTags: ["Editorial", "Breathable layers", "Weekend plans"],
    locationBadge: "Karen drives and Upper Hill golden hour",
    order: 2,
    isActive: true,
  },
  {
    id: "hero-hoodie-season-recut",
    title: "Hoodies, Cargos, and Nairobi Energy",
    subtitle:
      "Our fastest-moving silhouettes remixed with crisp accessories and a sharper summer palette for everyday streetwear rotation.",
    imageUrl:
      "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=1800&q=80",
    ctaText: "Shop Menswear",
    ctaLink: "/shop?gender=men",
    moodTags: ["Daily uniform", "Layered comfort", "Street polish"],
    locationBadge: "Ngong Road traffic, then the after-plan",
    order: 3,
    isActive: true,
  },
];

export function createHeroSlideSeed(seed: HeroSlideSeed, date = new Date()): HeroSlide {
  return {
    ...seed,
    moodTags: [...seed.moodTags],
    createdAt: date,
    updatedAt: date,
  };
}

export function getDefaultHeroSlides(): HeroSlide[] {
  return DEFAULT_HERO_SLIDE_SEEDS.map((seed) => createHeroSlideSeed(seed));
}
