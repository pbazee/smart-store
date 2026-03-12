import {
  DEFAULT_HOMEPAGE_CATEGORY_SEEDS,
  createHomepageCategorySeed,
} from "@/lib/default-homepage-categories";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { HomepageCategory } from "@/types";

type HomepageCategoryQueryOptions = {
  activeOnly?: boolean;
  fallbackOnError?: boolean;
};

let demoHomepageCategoriesState: HomepageCategory[] = DEFAULT_HOMEPAGE_CATEGORY_SEEDS.map(
  (seed, index) =>
    createHomepageCategorySeed(seed, new Date(`2026-01-0${index + 1}T09:00:00.000Z`))
);

function cloneHomepageCategory(category: HomepageCategory): HomepageCategory {
  return {
    ...category,
    createdAt:
      category.createdAt instanceof Date ? new Date(category.createdAt) : category.createdAt,
    updatedAt:
      category.updatedAt instanceof Date ? new Date(category.updatedAt) : category.updatedAt,
  };
}

function sortHomepageCategories(categories: HomepageCategory[]) {
  return [...categories].sort((left, right) => {
    const orderDifference = left.order - right.order;
    if (orderDifference !== 0) {
      return orderDifference;
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

export function getDemoHomepageCategories(options: HomepageCategoryQueryOptions = {}) {
  const { activeOnly = false } = options;
  const categories = activeOnly
    ? demoHomepageCategoriesState.filter((category) => category.isActive)
    : demoHomepageCategoriesState;

  return sortHomepageCategories(categories).map(cloneHomepageCategory);
}

export function createDemoHomepageCategory(
  input: Omit<HomepageCategory, "createdAt" | "updatedAt">
) {
  const now = new Date();
  const nextCategory: HomepageCategory = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  demoHomepageCategoriesState = sortHomepageCategories([nextCategory, ...demoHomepageCategoriesState]);
  return cloneHomepageCategory(nextCategory);
}

export function updateDemoHomepageCategory(
  categoryId: string,
  input: Omit<HomepageCategory, "createdAt" | "updatedAt">
) {
  const currentCategory = demoHomepageCategoriesState.find((category) => category.id === categoryId);
  if (!currentCategory) {
    throw new Error("Homepage category not found");
  }

  const nextCategory: HomepageCategory = {
    ...input,
    createdAt: currentCategory.createdAt,
    updatedAt: new Date(),
  };

  demoHomepageCategoriesState = sortHomepageCategories(
    demoHomepageCategoriesState.map((category) =>
      category.id === categoryId ? nextCategory : category
    )
  );

  return cloneHomepageCategory(nextCategory);
}

export function deleteDemoHomepageCategory(categoryId: string) {
  demoHomepageCategoriesState = demoHomepageCategoriesState.filter(
    (category) => category.id !== categoryId
  );
}

export async function getHomepageCategories(
  options: HomepageCategoryQueryOptions = {}
): Promise<HomepageCategory[]> {
  const { activeOnly = false, fallbackOnError = false } = options;

  if (shouldUseMockData()) {
    return getDemoHomepageCategories({ activeOnly });
  }

  try {
    const categories = await prisma.homepageCategory.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return categories as HomepageCategory[];
  } catch (error) {
    console.error("Homepage category lookup failed:", error);

    if (fallbackOnError) {
      return DEFAULT_HOMEPAGE_CATEGORY_SEEDS.map((seed) => createHomepageCategorySeed(seed));
    }

    return [];
  }
}

export async function getActiveHomepageCategories() {
  return getHomepageCategories({
    activeOnly: true,
    fallbackOnError: true,
  });
}
