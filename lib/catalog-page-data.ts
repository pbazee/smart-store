import { getActiveCategories } from "@/lib/category-service";
import {
  buildCatalogHeading,
  normalizeCatalogCollectionKey,
  normalizeCatalogGender,
  resolveCatalogQueryMatches,
  type CatalogCollectionKey,
  type CatalogQueryInput,
} from "@/lib/catalog-routing";
import { getProducts, type ProductQueryFilters } from "@/lib/data-service";
import { getHomepageCollectionProducts } from "@/lib/homepage-data";
import type { Category, Product } from "@/types";

export type CatalogPageData = {
  heading: string;
  products: Product[];
  categories: Category[];
};

const COLLECTION_PRODUCT_KEYS: Record<CatalogCollectionKey, Parameters<typeof getHomepageCollectionProducts>[0]> = {
  popular: "popular",
  trending: "trending",
  "new-arrivals": "new-arrivals",
  recommended: "recommended",
  "city-inspired": "city-inspired",
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

export async function getCatalogPageData(query: CatalogQueryInput = {}): Promise<CatalogPageData> {
  const categories = await getActiveCategories();
  const serverFilters = buildServerFilters(query, categories);
  const collection = normalizeCatalogCollectionKey(query.collection ?? query.filter);
  const products = collection
    ? await getHomepageCollectionProducts(COLLECTION_PRODUCT_KEYS[collection])
    : await getProducts(serverFilters);

  return {
    heading: buildCatalogHeading(collection ? { ...query, collection } : query, categories),
    products,
    categories,
  };
}
