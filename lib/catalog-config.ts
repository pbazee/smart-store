import type { Product } from "@/types";

export type CatalogCategoryConfig = {
  slug: string;
  heading: string;
  filters: {
    category?: string;
    subcategory?: string;
    gender?: string;
  };
  lockedCategory?: string;
};

type ProductListFilterConfig = {
  heading: string;
  predicate: (product: Product) => boolean;
};

const CATEGORY_CONFIGS: Record<string, CatalogCategoryConfig> = {
  shoes: {
    slug: "shoes",
    heading: "Shoes",
    filters: { category: "shoes" },
    lockedCategory: "shoes",
  },
  bags: {
    slug: "bags",
    heading: "Bags",
    filters: { subcategory: "bag" },
  },
  tshirts: {
    slug: "tshirts",
    heading: "T-Shirts",
    filters: { subcategory: "tshirt" },
  },
  dresses: {
    slug: "dresses",
    heading: "Dresses",
    filters: { subcategory: "dresses" },
  },
  jeans: {
    slug: "jeans",
    heading: "Jeans",
    filters: { subcategory: "jeans" },
  },
  jackets: {
    slug: "jackets",
    heading: "Jackets",
    filters: { subcategory: "jackets" },
  },
  accessories: {
    slug: "accessories",
    heading: "Accessories",
    filters: { category: "accessories" },
    lockedCategory: "accessories",
  },
  clothes: {
    slug: "clothes",
    heading: "Clothes",
    filters: { category: "clothes" },
    lockedCategory: "clothes",
  },
  men: {
    slug: "men",
    heading: "Men",
    filters: { gender: "men" },
  },
  women: {
    slug: "women",
    heading: "Women",
    filters: { gender: "women" },
  },
  children: {
    slug: "children",
    heading: "Children",
    filters: { gender: "children" },
  },
};

const PRODUCT_LIST_FILTERS: Record<string, ProductListFilterConfig> = {
  trending: {
    heading: "Trending Products",
    predicate: (product) => product.tags.includes("trending"),
  },
  new: {
    heading: "New Arrivals",
    predicate: (product) => product.isNew || product.tags.includes("new-arrival"),
  },
  popular: {
    heading: "Popular Products",
    predicate: (product) => product.isFeatured,
  },
  recommended: {
    heading: "Recommended For You",
    predicate: (product) =>
      product.isFeatured || product.isNew || product.tags.includes("trending"),
  },
};

function humanizeSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function resolveCategoryConfig(slug: string): CatalogCategoryConfig {
  const normalizedSlug = slug.trim().toLowerCase();

  return (
    CATEGORY_CONFIGS[normalizedSlug] ?? {
      slug: normalizedSlug,
      heading: humanizeSlug(normalizedSlug),
      filters: { category: normalizedSlug },
      lockedCategory: normalizedSlug,
    }
  );
}

export function getProductListFilterConfig(filter: string | null | undefined) {
  if (!filter) {
    return null;
  }

  return PRODUCT_LIST_FILTERS[filter.trim().toLowerCase()] ?? null;
}
