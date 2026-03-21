import {
  DEFAULT_HOMEPAGE_CATEGORY_SEEDS,
  createHomepageCategorySeed,
} from "@/lib/default-homepage-categories";
import { getActiveCategories } from "@/lib/category-service";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import { ensureHomepageCategoryStorage } from "@/lib/runtime-schema-repair";
import { slugify } from "@/lib/utils";
import type { Category, HomepageCategory } from "@/types";

type HomepageCategoryQueryOptions = {
  activeOnly?: boolean;
  fallbackOnError?: boolean;
};

const KNOWN_SUBCATEGORY_PARENT_SLUGS: Record<string, string> = {
  shoes: "shoes",
  sneaker: "shoes",
  sneakers: "shoes",
  boots: "shoes",
  sandals: "shoes",
  heels: "shoes",
  loafers: "shoes",
  dresses: "clothes",
  dress: "clothes",
  jeans: "clothes",
  jackets: "clothes",
  jacket: "clothes",
  tshirts: "clothes",
  "t-shirts": "clothes",
  tops: "clothes",
  shorts: "clothes",
  suits: "clothes",
  skirts: "clothes",
  bags: "accessories",
  bag: "accessories",
  belts: "accessories",
  watches: "accessories",
  caps: "accessories",
  jewellery: "accessories",
  jewelry: "accessories",
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

function normalizeCategoryToken(value?: string | null) {
  return slugify(value || "")
    .replace(/-/g, "")
    .toLowerCase();
}

function extractCategorySlugFromLink(link: string) {
  const pathname = link.split("?")[0];
  const segments = pathname.split("/").filter(Boolean);
  return segments.at(-1) ?? "";
}

export function resolveHomepageCategoryParentCategoryId(
  homepageCategory: HomepageCategory,
  categories: Category[]
) {
  if (homepageCategory.parentCategoryId) {
    return homepageCategory.parentCategoryId;
  }

  const topLevelCategories = categories.filter((category) => !category.parentId);
  const tokens = Array.from(
    new Set(
      [extractCategorySlugFromLink(homepageCategory.link), homepageCategory.title]
        .map((value) => normalizeCategoryToken(value))
        .filter(Boolean)
    )
  );

  for (const token of tokens) {
    const directParent = topLevelCategories.find(
      (category) =>
        normalizeCategoryToken(category.slug) === token ||
        normalizeCategoryToken(category.name) === token
    );
    if (directParent) {
      return directParent.id;
    }

    const mappedParentSlug = KNOWN_SUBCATEGORY_PARENT_SLUGS[token];
    if (!mappedParentSlug) {
      continue;
    }

    const mappedParent = topLevelCategories.find(
      (category) =>
        normalizeCategoryToken(category.slug) === normalizeCategoryToken(mappedParentSlug) ||
        normalizeCategoryToken(category.name) === normalizeCategoryToken(mappedParentSlug)
    );

    if (mappedParent) {
      return mappedParent.id;
    }
  }

  return null;
}

async function hydrateHomepageCategoryParentIds(categories: HomepageCategory[]) {
  const topLevelCategories = await getActiveCategories();

  return categories.map((category) => ({
    ...category,
    parentCategoryId:
      category.parentCategoryId ?? resolveHomepageCategoryParentCategoryId(category, topLevelCategories),
  }));
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
    return hydrateHomepageCategoryParentIds(getDemoHomepageCategories({ activeOnly }));
  }

  try {
    await ensureHomepageCategoryStorage();

    const categories = await prisma.homepageCategory.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return hydrateHomepageCategoryParentIds(categories as HomepageCategory[]);
  } catch (error) {
    console.error("Homepage category lookup failed:", error);

    if (fallbackOnError) {
      return hydrateHomepageCategoryParentIds(
        DEFAULT_HOMEPAGE_CATEGORY_SEEDS.map((seed) => createHomepageCategorySeed(seed))
      );
    }

    return [];
  }
}

export async function getHomepageSubcategoriesForCategory(parentCategoryId: string) {
  const categories = await getHomepageCategories({ fallbackOnError: true });
  return categories.filter((category) => category.parentCategoryId === parentCategoryId);
}

export async function getActiveHomepageCategories() {
  return getHomepageCategories({
    activeOnly: true,
    fallbackOnError: true,
  });
}
