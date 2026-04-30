import { resolveCategoryConfig } from "@/lib/catalog-config";
import type { Category } from "@/types";

export type CatalogCollectionKey =
  | "popular"
  | "trending"
  | "new-arrivals"
  | "recommended"
  | "city-inspired";

export type CatalogQueryInput = {
  collection?: string | null;
  filter?: string | null;
  category?: string | null;
  subcategory?: string | null;
  gender?: string | null;
  search?: string | null;
  tag?: string | null;
  tags?: string | null;
};

const COLLECTION_HEADINGS: Record<CatalogCollectionKey, string> = {
  popular: "Popular Products",
  trending: "Trending Products",
  "new-arrivals": "New Arrivals",
  recommended: "Recommended For You",
  "city-inspired": "City Inspired Picks",
};

function normalizeCatalogToken(value?: string | null) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCatalogValue(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function humanizeCatalogValue(value?: string | null) {
  const normalized = normalizeCatalogToken(value);

  if (!normalized) {
    return "All Products";
  }

  return normalized
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function matchesCategoryValue(category: Category, value: string) {
  const normalizedValue = normalizeCatalogToken(value);
  const directValue = normalizeCatalogValue(value);

  return (
    directValue === normalizeCatalogValue(category.id) ||
    normalizedValue === normalizeCatalogToken(category.slug) ||
    normalizedValue === normalizeCatalogToken(category.name)
  );
}

function findTopLevelCategory(categories: Category[], value?: string | null) {
  if (!value) {
    return null;
  }

  return (
    categories.find((category) => !category.parentId && matchesCategoryValue(category, value)) ?? null
  );
}

function findSubcategory(categories: Category[], value?: string | null) {
  if (!value) {
    return null;
  }

  return (
    categories.find((category) => Boolean(category.parentId) && matchesCategoryValue(category, value)) ??
    null
  );
}

function findParentCategory(categories: Category[], child?: Category | null) {
  if (!child?.parentId) {
    return null;
  }

  return categories.find((category) => category.id === child.parentId) ?? null;
}

export function normalizeCatalogCollectionKey(value?: string | null): CatalogCollectionKey | null {
  switch (normalizeCatalogToken(value)) {
    case "popular":
    case "featured":
      return "popular";
    case "trending":
      return "trending";
    case "new":
    case "new-arrival":
    case "new-arrivals":
    case "newarrival":
    case "newarrivals":
      return "new-arrivals";
    case "recommended":
    case "recommendations":
      return "recommended";
    case "city":
    case "city-inspired":
    case "cityinspired":
    case "nairobi":
      return "city-inspired";
    default:
      return null;
  }
}

export function normalizeCatalogGender(value?: string | null) {
  switch (normalizeCatalogToken(value)) {
    case "male":
    case "man":
    case "men":
      return "men";
    case "female":
    case "woman":
    case "women":
      return "women";
    case "child":
    case "children":
    case "kids":
      return "children";
    case "unisex":
      return "unisex";
    default:
      return null;
  }
}

export function getCatalogCollectionHeading(collection: CatalogCollectionKey) {
  return COLLECTION_HEADINGS[collection];
}

export function resolveCatalogQueryMatches(query: CatalogQueryInput, categories: Category[]) {
  let topCategory = findTopLevelCategory(categories, query.category);
  let subcategory = findSubcategory(categories, query.subcategory);

  if (!subcategory && query.category) {
    const matchedCategory = findSubcategory(categories, query.category);
    if (matchedCategory) {
      subcategory = matchedCategory;
      topCategory = findParentCategory(categories, matchedCategory);
    }
  }

  if (!topCategory && subcategory) {
    topCategory = findParentCategory(categories, subcategory);
  }

  return {
    topCategory,
    subcategory,
    gender:
      normalizeCatalogGender(query.gender) ??
      (!topCategory && !subcategory ? normalizeCatalogGender(query.category) : null),
  };
}

export function resolveCatalogFilterSelections(
  query: CatalogQueryInput,
  categories: Category[],
  lockedCategory?: string
) {
  if (lockedCategory) {
    return {
      category: [lockedCategory],
      subcategory: [],
      gender: normalizeCatalogGender(query.gender) ? [normalizeCatalogGender(query.gender)!] : [],
    };
  }

  const matches = resolveCatalogQueryMatches(query, categories);
  const rawCategory =
    query.category && !normalizeCatalogGender(query.category)
      ? normalizeCatalogValue(query.category)
      : "";
  const selectedCategory = matches.topCategory?.id ?? rawCategory;
  const selectedSubcategory = matches.subcategory?.id ?? "";

  return {
    category: selectedCategory ? [selectedCategory] : [],
    subcategory: selectedSubcategory ? [selectedSubcategory] : [],
    gender: matches.gender ? [matches.gender] : [],
  };
}

export function buildCatalogHeading(query: CatalogQueryInput, categories: Category[]) {
  const collection = normalizeCatalogCollectionKey(query.collection ?? query.filter);
  if (collection) {
    return getCatalogCollectionHeading(collection);
  }

  const matches = resolveCatalogQueryMatches(query, categories);

  if (matches.subcategory) {
    return matches.subcategory.name;
  }

  if (matches.topCategory) {
    return matches.topCategory.name;
  }

  if (matches.gender) {
    return humanizeCatalogValue(matches.gender);
  }

  if (query.subcategory) {
    return humanizeCatalogValue(query.subcategory);
  }

  if (query.category) {
    return humanizeCatalogValue(query.category);
  }

  return "All Products";
}

export function buildCatalogHref(
  query: CatalogQueryInput,
  basePath: "/shop" | "/products" = "/shop"
) {
  const params = new URLSearchParams();
  const collection = normalizeCatalogCollectionKey(query.collection ?? query.filter);
  const category = normalizeCatalogValue(query.category);
  const subcategory = normalizeCatalogValue(query.subcategory);
  const gender = normalizeCatalogGender(query.gender);
  const search = query.search?.trim();
  const tag = normalizeCatalogValue(query.tag ?? query.tags);

  if (collection) {
    params.set("collection", collection);
  }

  if (category) {
    params.set("category", category);
  }

  if (subcategory) {
    params.set("subcategory", subcategory);
  }

  if (gender) {
    params.set("gender", gender);
  }

  if (search) {
    params.set("search", search);
  }

  if (tag) {
    params.set("tag", tag);
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function buildCatalogHrefFromCategorySlug(
  slug: string,
  basePath: "/shop" | "/products" = "/shop"
) {
  const categoryConfig = resolveCategoryConfig(slug);

  return buildCatalogHref(categoryConfig.filters, basePath);
}

export function resolveCatalogListingHref(
  href?: string | null,
  basePath: "/shop" | "/products" = "/shop"
) {
  if (!href) {
    return basePath;
  }

  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  const resolvedUrl = new URL(href, "https://smartest-store-ke.local");
  const pathname = resolvedUrl.pathname;

  if (pathname.startsWith("/category/")) {
    const slug = pathname.split("/").filter(Boolean).at(-1);
    return slug ? buildCatalogHrefFromCategorySlug(slug, basePath) : basePath;
  }

  if (pathname === "/products" || pathname === "/shop") {
    return buildCatalogHref(
      {
        collection:
          resolvedUrl.searchParams.get("collection") ?? resolvedUrl.searchParams.get("filter"),
        category: resolvedUrl.searchParams.get("category"),
        subcategory: resolvedUrl.searchParams.get("subcategory"),
        gender: resolvedUrl.searchParams.get("gender"),
        search: resolvedUrl.searchParams.get("search"),
        tag: resolvedUrl.searchParams.get("tag") ?? resolvedUrl.searchParams.get("tags"),
      },
      basePath
    );
  }

  return href;
}
