import type { HomepageCategory } from "@/types";

export type HomepageCategorySeed = Omit<HomepageCategory, "createdAt" | "updatedAt">;

export const DEFAULT_HOMEPAGE_CATEGORY_SEEDS: HomepageCategorySeed[] = [
  {
    id: "seed-homepage-category-shoes",
    title: "Shoes",
    subtitle: "Street-ready sneakers and statement pairs",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    link: "/category/shoes",
    order: 0,
    isActive: true,
  },
  {
    id: "seed-homepage-category-dresses",
    title: "Dresses",
    subtitle: "Flowing silhouettes built for warm city days",
    imageUrl:
      "https://images.pexels.com/photos/31965807/pexels-photo-31965807.jpeg?auto=compress&cs=tinysrgb&w=900",
    link: "/category/dresses",
    order: 1,
    isActive: true,
  },
  {
    id: "seed-homepage-category-jeans",
    title: "Jeans",
    subtitle: "Premium denim with a polished everyday edge",
    imageUrl:
      "https://images.pexels.com/photos/936001/pexels-photo-936001.jpeg?auto=compress&cs=tinysrgb&w=900",
    link: "/category/jeans",
    order: 2,
    isActive: true,
  },
  {
    id: "seed-homepage-category-jackets",
    title: "Jackets",
    subtitle: "Layering heroes for Nairobi nights",
    imageUrl:
      "https://images.pexels.com/photos/19824497/pexels-photo-19824497.jpeg?auto=compress&cs=tinysrgb&w=900",
    link: "/category/jackets",
    order: 3,
    isActive: true,
  },
];

export function createHomepageCategorySeed(
  seed: HomepageCategorySeed,
  timestamp = new Date("2026-01-01T00:00:00.000Z")
): HomepageCategory {
  return {
    ...seed,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
