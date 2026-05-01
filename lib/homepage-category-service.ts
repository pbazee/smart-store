import { unstable_cache } from "next/cache";
import { getActiveCategories, getChildCategories } from "@/lib/category-service";
import { ensureCategoryHomepageFields } from "@/lib/runtime-schema-repair";
import { slugify } from "@/lib/utils";
import type { Category, HomepageCategory } from "@/types";

type HomepageCategoryQueryOptions = {
  activeOnly?: boolean;
};

const HOMEPAGE_REVALIDATE_SECONDS = 60;
const HOMEPAGE_CATEGORY_FALLBACK_LIMIT = 6;

function toHomepageCategory(category: Category, index: number): HomepageCategory {
  const hasParent = Boolean(category.parentId);
  const categorySlug = slugify(category.slug || category.name);

  return {
    id: category.id,
    title: category.name,
    subtitle: category.homepageSubtitle?.trim() || category.description?.trim() || null,
    imageUrl: category.homepageImageUrl || "/images/product-placeholder.png",
    link: hasParent
      ? `/shop?category=${encodeURIComponent(category.parentId || "")}&subcategory=${encodeURIComponent(categorySlug)}`
      : `/shop?category=${encodeURIComponent(categorySlug)}`,
    parentCategoryId: category.parentId ?? null,
    order: category.homepageOrder ?? category.order ?? index,
    isActive: category.isHomepageVisible ?? false,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

async function getCatalogBackedHomepageCategories(): Promise<HomepageCategory[]> {
  const categories = await getActiveCategories();
  const homepageCategories = categories
    .filter((category) => category.isHomepageVisible)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .slice(0, HOMEPAGE_CATEGORY_FALLBACK_LIMIT);

  if (homepageCategories.length > 0) {
    return homepageCategories.map((category, index) => toHomepageCategory(category, index));
  }

  return categories
    .filter((category) => !category.parentId)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .slice(0, HOMEPAGE_CATEGORY_FALLBACK_LIMIT)
    .map((category, index) => toHomepageCategory(category, index));
}

export async function getHomepageCategories(
  options: HomepageCategoryQueryOptions = {}
): Promise<HomepageCategory[]> {
  const { activeOnly = false } = options;
  const loadCategories = async () => {
    try {
      await ensureCategoryHomepageFields();

      const categories = await getActiveCategories();
      const homepageCategories = categories
        .filter((category) => (activeOnly ? category.isHomepageVisible : true))
        .sort(
          (left, right) =>
            (left.homepageOrder ?? left.order ?? 0) - (right.homepageOrder ?? right.order ?? 0) ||
            left.name.localeCompare(right.name)
        );

      if (activeOnly && homepageCategories.length === 0) {
        return getCatalogBackedHomepageCategories();
      }

      return homepageCategories.map((category, index) => toHomepageCategory(category, index));
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
  const categories = await getChildCategories(parentCategoryId);
  return categories.map((category, index) => toHomepageCategory(category, index));
}

export async function getActiveHomepageCategories() {
  return getHomepageCategories({
    activeOnly: true,
  });
}
