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
    filters: { category: "accessories", subcategory: "bags" },
  },
  tshirts: {
    slug: "tshirts",
    heading: "T-Shirts",
    filters: { category: "clothes", subcategory: "t-shirts" },
  },
  dresses: {
    slug: "dresses",
    heading: "Dresses",
    filters: { category: "clothes", subcategory: "dresses" },
  },
  jeans: {
    slug: "jeans",
    heading: "Jeans",
    filters: { category: "clothes", subcategory: "jeans" },
  },
  jackets: {
    slug: "jackets",
    heading: "Jackets",
    filters: { category: "clothes", subcategory: "jackets" },
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
    predicate: (product) => product.isTrending,
  },
  new: {
    heading: "New Arrivals",
    predicate: (product) => product.isNew,
  },
  popular: {
    heading: "Popular Products",
    predicate: (product) => product.isPopular,
  },
  recommended: {
    heading: "Recommended For You",
    predicate: (product) => product.isRecommended,
  },
};

export const KNOWN_SUBCATEGORY_PARENT_SLUGS: Record<string, string> = {
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
function humanizeSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function resolveCategoryConfig(slug: string): CatalogCategoryConfig {
  const normalizedSlug = slug.trim().toLowerCase();
  const parentSlug = KNOWN_SUBCATEGORY_PARENT_SLUGS[normalizedSlug];

  if (parentSlug && parentSlug !== normalizedSlug) {
    return (
      CATEGORY_CONFIGS[normalizedSlug] ?? {
        slug: normalizedSlug,
        heading: humanizeSlug(normalizedSlug),
        filters: {
          category: parentSlug,
          subcategory: normalizedSlug,
        },
      }
    );
  }

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
