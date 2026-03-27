import { unstable_cache } from "next/cache";
import { getActiveCategories } from "@/lib/category-service";
import {
  buildCatalogHref,
  buildCatalogHeading,
  normalizeCatalogCollectionKey,
  normalizeCatalogGender,
  resolveCatalogQueryMatches,
  type CatalogCollectionKey,
  type CatalogQueryInput,
} from "@/lib/catalog-routing";
import { getProducts, type ProductQueryFilters } from "@/lib/data-service";
import { getHomepageProductSectionsData } from "@/lib/homepage-data";
import type { Category, Product } from "@/types";

export type CatalogPageData = {
  heading: string;
  products: Product[];
  categories: Category[];
};

const CATALOG_CACHE_REVALIDATE_SECONDS = 300;

const COLLECTION_PRODUCT_KEYS: Record<
  CatalogCollectionKey,
  keyof Awaited<ReturnType<typeof getHomepageProductSectionsData>>
> = {
  popular: "featured",
  trending: "trending",
  "new-arrivals": "newArrivals",
  recommended: "alsoBought",
  "city-inspired": "cityInspired",
};

function buildServerFilters(query: CatalogQueryInput, categories: Category[]): ProductQueryFilters {
  const matches = resolveCatalogQueryMatches(query, categories);
  const filters: ProductQueryFilters = {};
  const normalizedCategory = query.category?.trim().toLowerCase();
  const normalizedSubcategory = query.subcategory?.trim();
  const normalizedGender =
    matches.gender ??
    normalizeCatalogGender(query.gender) ??
    (!matches.topCategory && !matches.subcategory ? normalizeCatalogGender(query.category) : null);
  
  const collection = normalizeCatalogCollectionKey(query.collection ?? query.filter);
  if(collection) {
    filters.collection = collection;
  }

  if (matches.topCategory) {
    filters.category = matches.topCategory.slug;
  } else if (normalizedCategory && !normalizeCatalogGender(normalizedCategory)) {
    filters.category = normalizedCategory;
  }

  if (matches.subcategory) {
    filters.subcategory = matches.subcategory.name;
  } else if (normalizedSubcategory) {
    filters.subcategory = normalizedSubcategory;
  }

  if (normalizedGender) {
    filters.gender = normalizedGender;
  }

  if (query.search?.trim()) {
    filters.search = query.search.trim();
  }

  if (query.tag?.trim()) {
    filters.tag = query.tag.trim().toLowerCase();
  } else if (query.tags?.trim()) {
    filters.tag = query.tags.trim().toLowerCase();
  }

  return filters;
}

function buildCatalogCacheKey(query: CatalogQueryInput = {}) {
  return buildCatalogHref(query, "/shop");
}

function parseCatalogCacheKey(cacheKey: string): CatalogQueryInput {
  const url = new URL(cacheKey, "https://smartest-store-ke.local");

  return {
    collection: url.searchParams.get("collection"),
    category: url.searchParams.get("category"),
    subcategory: url.searchParams.get("subcategory"),
    gender: url.searchParams.get("gender"),
    search: url.searchParams.get("search"),
    tag: url.searchParams.get("tag"),
  };
}

async function resolveCatalogPageData(query: CatalogQueryInput = {}): Promise<CatalogPageData> {
  const categories = await getActiveCategories();
  const serverFilters = buildServerFilters(query, categories);
  const products = await getProducts(serverFilters);
  const collection = normalizeCatalogCollectionKey(query.collection ?? query.filter);

  return {
    heading: buildCatalogHeading(collection ? { ...query, collection } : query, categories),
    products,
    categories,
  };
}

const getCachedCatalogPageData = unstable_cache(
  async (cacheKey: string) => resolveCatalogPageData(parseCatalogCacheKey(cacheKey)),
  ["catalog-page-data"],
  {
    revalidate: CATALOG_CACHE_REVALIDATE_SECONDS,
  }
);

export async function getCatalogPageData(query: CatalogQueryInput = {}): Promise<CatalogPageData> {
  return getCachedCatalogPageData(buildCatalogCacheKey(query));
}
