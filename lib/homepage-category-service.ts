import { KNOWN_SUBCATEGORY_PARENT_SLUGS } from "@/lib/catalog-config";
import { getActiveCategories } from "@/lib/category-service";
import { prisma } from "@/lib/prisma";
import { ensureHomepageCategoryStorage } from "@/lib/runtime-schema-repair";
import { slugify } from "@/lib/utils";
import type { Category, HomepageCategory } from "@/types";

type HomepageCategoryQueryOptions = {
  activeOnly?: boolean;
};

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

export async function getHomepageCategories(
  options: HomepageCategoryQueryOptions = {}
): Promise<HomepageCategory[]> {
  const { activeOnly = false } = options;

  await ensureHomepageCategoryStorage();

  const categories = await prisma.homepageCategory.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return hydrateHomepageCategoryParentIds(categories as HomepageCategory[]);
}

export async function getHomepageSubcategoriesForCategory(parentCategoryId: string) {
  const categories = await getHomepageCategories();
  return categories.filter((category) => category.parentCategoryId === parentCategoryId);
}

export async function getActiveHomepageCategories() {
  return getHomepageCategories({
    activeOnly: true,
  });
}
