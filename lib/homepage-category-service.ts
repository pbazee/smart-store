import { unstable_cache } from "next/cache";
import { buildValidCatalogProductWhere } from "@/lib/product-integrity";
import { KNOWN_SUBCATEGORY_PARENT_SLUGS } from "@/lib/catalog-config";
import { getActiveCategories } from "@/lib/category-service";
import { prisma } from "@/lib/prisma";
import { ensureHomepageCategoryStorage } from "@/lib/runtime-schema-repair";
import { slugify } from "@/lib/utils";
import type { Category, HomepageCategory } from "@/types";

type HomepageCategoryQueryOptions = {
  activeOnly?: boolean;
};

const HOMEPAGE_REVALIDATE_SECONDS = 60;
const HOMEPAGE_CATEGORY_FALLBACK_LIMIT = 6;

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

function matchesHomepageFallbackCategory(
  homepageCategory: Pick<HomepageCategory, "title" | "link">,
  category: Pick<Category, "name" | "slug">
) {
  const categoryTokens = new Set(
    [category.slug, category.name].map((value) => normalizeCategoryToken(value)).filter(Boolean)
  );
  const homepageTokens = [
    homepageCategory.title,
    extractCategorySlugFromLink(homepageCategory.link),
  ]
    .map((value) => normalizeCategoryToken(value))
    .filter(Boolean);

  return homepageTokens.some((token) => categoryTokens.has(token));
}

async function getCatalogBackedHomepageCategories(): Promise<HomepageCategory[]> {
  const categories = await getActiveCategories();
  const topLevelCategories = categories
    .filter((category) => !category.parentId)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .slice(0, HOMEPAGE_CATEGORY_FALLBACK_LIMIT);

  if (topLevelCategories.length === 0) {
    return [];
  }

  const categoryProducts = await prisma.product.findMany({
    where: buildValidCatalogProductWhere({
      OR: topLevelCategories.flatMap((category) => [
        { categoryId: category.id },
        {
          category: {
            equals: category.slug,
            mode: "insensitive",
          },
        },
        {
          category: {
            equals: category.name,
            mode: "insensitive",
          },
        },
      ]),
    }),
    select: {
      categoryId: true,
      category: true,
      images: true,
      updatedAt: true,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: Math.max(topLevelCategories.length * 8, 24),
  });

  return topLevelCategories.flatMap((category, index) => {
    const matchingProduct = categoryProducts.find((product) => {
      if (product.categoryId === category.id && product.images.some(Boolean)) {
        return true;
      }

      return (
        product.images.some(Boolean) &&
        matchesHomepageFallbackCategory(
          {
            title: category.name,
            link: `/shop?category=${encodeURIComponent(category.slug)}`,
          },
          {
            name: product.category,
            slug: product.category,
          }
        )
      );
    });

    const imageUrl = matchingProduct?.images.find(Boolean);
    if (!imageUrl) {
      return [];
    }

    if (!matchingProduct) {
      return [];
    }

    return [
      {
        id: `catalog-homepage-category-${category.id}`,
        title: category.name,
        subtitle: category.description?.trim() || null,
        imageUrl,
        link: `/shop?category=${encodeURIComponent(category.slug)}`,
        parentCategoryId: category.id,
        order: index,
        isActive: true,
        createdAt: category.createdAt,
        updatedAt: matchingProduct.updatedAt,
      } satisfies HomepageCategory,
    ];
  });
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
  const loadCategories = async () => {
    try {
      await ensureHomepageCategoryStorage();

      const categories = await prisma.homepageCategory.findMany({
        where: activeOnly ? { isActive: true } : undefined,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });

      const hydratedCategories = await hydrateHomepageCategoryParentIds(
        categories as HomepageCategory[]
      );

      if (activeOnly && hydratedCategories.length === 0) {
        return getCatalogBackedHomepageCategories();
      }

      return hydratedCategories;
    } catch (error) {
      if (!activeOnly) {
        throw error;
      }

      console.error("[HomepageCategories] Falling back to catalog-backed categories:", error);
      return getCatalogBackedHomepageCategories();
    }
  };

  if (activeOnly) {
    return unstable_cache(loadCategories, ["homepage-categories", "active"], {
      revalidate: HOMEPAGE_REVALIDATE_SECONDS,
      tags: ["homepage", "homepage-categories"],
    })();
  }

  return loadCategories();
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
