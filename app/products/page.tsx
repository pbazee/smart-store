import { Suspense } from "react";
import { CatalogBrowser } from "@/components/shop/catalog-browser";
import { getProducts } from "@/lib/data-service";

export const revalidate = 0;

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <Suspense>
      <CatalogBrowser heading="All Products" products={products} />
    </Suspense>
  );
}
