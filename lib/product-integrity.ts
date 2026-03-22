import type { Prisma } from "@prisma/client";
import type { Category, HomepageCategory } from "../types";

export const VALID_CATALOG_PRODUCT_WHERE = {
  AND: [{ categoryId: { not: null } }, { category: { not: "" } }, { subcategory: { not: "" } }],
} satisfies Prisma.ProductWhereInput;

function hasWhereClauses(where?: Prisma.ProductWhereInput) {
  return Boolean(where && Object.keys(where).length > 0);
}

function normalizeCatalogToken(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-/g, "");
}

function extractLinkSlug(link: string) {
  return link
    .split("?")[0]
    .split("/")
    .filter(Boolean)
    .at(-1);
}

export function buildValidCatalogProductWhere(
  where?: Prisma.ProductWhereInput
): Prisma.ProductWhereInput {
  if (!hasWhereClauses(where)) {
    return VALID_CATALOG_PRODUCT_WHERE;
  }

  const nextWhere = where as Prisma.ProductWhereInput;

  return {
    AND: [VALID_CATALOG_PRODUCT_WHERE, nextWhere],
  };
}

export function buildInvalidCatalogProductWhere(
  seededProductIds: string[] = []
): Prisma.ProductWhereInput {
  const orClauses: Prisma.ProductWhereInput[] = [
    { categoryId: null },
    { category: "" },
    { subcategory: "" },
  ];

  if (seededProductIds.length > 0) {
    orClauses.push({
      id: {
        in: seededProductIds,
      },
    });
  }

  return {
    OR: orClauses,
  };
}

export function resolveCanonicalProductSubcategory(
  parentCategory: Pick<Category, "name" | "slug">,
  subcategory: string,
  homepageSubcategories: Array<Pick<HomepageCategory, "title" | "link">>
) {
  const requestedToken = normalizeCatalogToken(subcategory);
  if (!requestedToken) {
    return null;
  }

  const parentTokens = [parentCategory.name, parentCategory.slug].map((value) =>
    normalizeCatalogToken(value)
  );
  if (parentTokens.includes(requestedToken)) {
    return parentCategory.name;
  }

  const matchedSubcategory = homepageSubcategories.find((option) => {
    const optionTokens = [option.title, extractLinkSlug(option.link)].map((value) =>
      normalizeCatalogToken(value)
    );
    return optionTokens.includes(requestedToken);
  });

  return matchedSubcategory?.title ?? null;
}

export async function resolveAdminProductCatalogAssignment(input: {
  categoryId?: string | null;
  subcategory: string;
}) {
  const [{ getActiveCategories }, { getHomepageSubcategoriesForCategory }] = await Promise.all([
    import("./category-service"),
    import("./homepage-category-service"),
  ]);
  const parentCategoryId = input.categoryId?.trim();
  if (!parentCategoryId) {
    throw new Error("Select a category before saving this product.");
  }

  const categories = await getActiveCategories();
  const parentCategory = categories.find(
    (category) => category.id === parentCategoryId && !category.parentId
  );

  if (!parentCategory) {
    throw new Error("The selected category is no longer available. Refresh and try again.");
  }

  const homepageSubcategories = await getHomepageSubcategoriesForCategory(parentCategory.id);
  const resolvedSubcategory = resolveCanonicalProductSubcategory(
    parentCategory,
    input.subcategory,
    homepageSubcategories
  );

  if (!resolvedSubcategory) {
    throw new Error("Select a valid subcategory for the chosen category.");
  }

  return {
    categoryId: parentCategory.id,
    category: parentCategory.slug,
    subcategory: resolvedSubcategory,
  };
}
