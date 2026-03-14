import { Suspense } from "react";
import { CatalogBrowser } from "@/components/shop/catalog-browser";
import { getActiveCategories } from "@/lib/category-service";
import { getProducts } from "@/lib/data-service";

export const revalidate = 0;

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getActiveCategories()]);

  return (
    <Suspense>
      <CatalogBrowser heading="All Products" products={products} categories={categories} />
    </Suspense>
  );
}
