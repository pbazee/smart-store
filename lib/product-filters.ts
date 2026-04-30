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
  const selectedParentCategory = lockedCategory || filters.category[0] || null;
  const selectedSubcategory = filters.subcategory[0] || null;
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

  if (selectedParentCategory || selectedSubcategory) {
    const selectedParent = selectedParentCategory ? categoryMap.get(selectedParentCategory) : null;
    const selectedChild = selectedSubcategory ? categoryMap.get(selectedSubcategory) : null;
    const selectedParentValues = [
      selectedParentCategory,
      selectedParent?.id,
      selectedParent?.slug,
      selectedParent?.name,
    ]
      .map((value) => normalizeCatalogValue(value))
      .filter(Boolean);
    const selectedChildValues = [
      selectedSubcategory,
      selectedChild?.id,
      selectedChild?.slug,
      selectedChild?.name,
    ]
      .map((value) => normalizeCatalogValue(value))
      .filter(Boolean);

    results = results.filter((product) => {
      const productCategoryId = (product as any).categoryId as string | undefined;
      const productCategory = productCategoryId ? categoryMap.get(productCategoryId) : null;
      const productParent = productCategory?.parentId
        ? categoryMap.get(productCategory.parentId)
        : productCategory;
      const productParentValues = [
        productParent?.id,
        productParent?.slug,
        productParent?.name,
        product.category,
      ]
        .map((value) => normalizeCatalogValue(value))
        .filter(Boolean);
      const productChildValues = [
        product.subcategory,
      ]
        .map((value) => normalizeCatalogValue(value))
        .filter(Boolean);

      const matchesParent =
        selectedParentValues.length === 0 ||
        selectedParentValues.some((value) => productParentValues.includes(value));
      const matchesChild =
        selectedChildValues.length === 0 ||
        selectedChildValues.some((value) => productChildValues.includes(value));

      return matchesParent && matchesChild;
    });
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
