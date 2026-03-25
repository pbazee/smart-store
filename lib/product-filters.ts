import type { Category, FilterState, Product } from "@/types";
import { smartSearchProducts } from "@/lib/smart-search";

type ProductFilterOptions = {
  filters: FilterState;
  categories?: Category[];
  tag?: string | null;
  lockedCategory?: string;
};

function normalizeCatalogValue(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

export function filterProductCatalog(
  products: Product[],
  options: ProductFilterOptions
): Product[] {
  const { filters, tag, lockedCategory, categories } = options;
  const selectedCategories = lockedCategory ? [lockedCategory] : filters.category;
  const selectedGenders = filters.gender.map((gender) => normalizeCatalogValue(gender)).filter(Boolean);
  let results = [...products];
  const categoryMap = new Map<string, Category>();

  (categories || []).forEach((cat) => {
    categoryMap.set(cat.id, cat);
  });

  if (tag) {
    const normalizedTag = normalizeCatalogValue(tag);
    results = results.filter((product) =>
      product.tags.some((productTag) => normalizeCatalogValue(productTag) === normalizedTag)
    );
  }

  if (filters.search) {
    results = smartSearchProducts(results, filters.search).results;
  }

  if (selectedCategories.length > 0) {
    results = results.filter((product) =>
      selectedCategories.some((category) => {
        const selectedCategory = categoryMap.get(category);
        const productCategoryId = (product as any).categoryId as string | undefined;
        const productCategory = productCategoryId ? categoryMap.get(productCategoryId) : null;
        const parentId = productCategory?.parentId ?? null;
        const parent = parentId ? categoryMap.get(parentId) : null;
        const productValues = [
          productCategoryId,
          productCategory?.id,
          productCategory?.slug,
          productCategory?.name,
          parentId,
          parent?.id,
          parent?.slug,
          parent?.name,
          product.category,
          product.subcategory,
        ]
          .map((value) => normalizeCatalogValue(value))
          .filter(Boolean);
        const selectedValues = [
          category,
          selectedCategory?.id,
          selectedCategory?.slug,
          selectedCategory?.name,
        ]
          .map((value) => normalizeCatalogValue(value))
          .filter(Boolean);

        return selectedValues.some((value) => productValues.includes(value));
      })
    );
  }

  if (selectedGenders.length > 0) {
    results = results.filter((product) =>
      selectedGenders.some(
        (gender) =>
          normalizeCatalogValue(product.gender) === gender ||
          normalizeCatalogValue(product.gender) === "unisex"
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
    results = [...results].sort((a, b) => Number(b.isNew) - Number(a.isNew) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (filters.sortBy === "featured") {
    results = [...results].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return results;
}
