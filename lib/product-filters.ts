import type { Category, FilterState, Product } from "@/types";
import { getProductListFilterConfig } from "@/lib/catalog-config";
import { smartSearchProducts } from "@/lib/smart-search";

type ProductFilterOptions = {
  filters: FilterState;
  categories?: Category[];
  tag?: string | null;
  filterKey?: string | null;
  lockedCategory?: string;
};

export function filterProductCatalog(
  products: Product[],
  options: ProductFilterOptions
): Product[] {
  const { filters, tag, filterKey, lockedCategory, categories } = options;
  const selectedCategories = lockedCategory ? [lockedCategory] : filters.category;
  const selectedGenders = filters.gender;
  const filterConfig = getProductListFilterConfig(filterKey);
  let results = [...products];
  const categoryMap = new Map<string, Category>();

  (categories || []).forEach((cat) => {
    categoryMap.set(cat.id, cat);
  });

  if (filterConfig) {
    results = results.filter(filterConfig.predicate);
  } else if (tag) {
    results = results.filter((product) => product.tags.includes(tag));
  }

  if (filters.search) {
    results = smartSearchProducts(results, filters.search).results;
  }

  if (selectedCategories.length > 0) {
    results = results.filter((product) =>
      selectedCategories.some((category) => {
        const productCategoryId = (product as any).categoryId as string | undefined;
        const productCategory = productCategoryId ? categoryMap.get(productCategoryId) : null;
        const parentId = productCategory?.parentId ?? null;
        const parent = parentId ? categoryMap.get(parentId) : null;

        return (
          (productCategoryId && category === productCategoryId) ||
          (productCategory && category === productCategory.slug) ||
          (parentId && category === parentId) ||
          (parent && category === parent.slug) ||
          product.category === category ||
          product.subcategory === category
        );
      })
    );
  }

  if (selectedGenders.length > 0) {
    results = results.filter((product) =>
      selectedGenders.some(
        (gender) => product.gender === gender || product.gender === "unisex"
      )
    );
  }

  results = results.filter(
    (product) =>
      product.basePrice >= filters.priceRange[0] &&
      product.basePrice <= filters.priceRange[1]
  );

  if (filters.colors.length > 0) {
    results = results.filter((product) =>
      product.variants.some((variant) =>
        filters.colors.some((color) =>
          variant.color.toLowerCase().includes(color.toLowerCase())
        )
      )
    );
  }

  if (filters.sizes.length > 0) {
    results = results.filter((product) =>
      product.variants.some((variant) => filters.sizes.includes(variant.size))
    );
  }

  if (filters.sortBy === "price-asc") {
    results = [...results].sort((a, b) => a.basePrice - b.basePrice);
  }

  if (filters.sortBy === "price-desc") {
    results = [...results].sort((a, b) => b.basePrice - a.basePrice);
  }

  if (filters.sortBy === "rating") {
    results = [...results].sort((a, b) => b.rating - a.rating);
  }

  if (filters.sortBy === "new") {
    results = results.filter((product) => product.isNew);
  }

  if (filters.sortBy === "featured") {
    results = [...results].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  }

  return results;
}
