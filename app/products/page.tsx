import { Suspense } from "react";
import { CatalogBrowser } from "@/components/shop/catalog-browser";
import { buildCatalogHref } from "@/lib/catalog-routing";
import { getCatalogPageData } from "@/lib/catalog-page-data";
import type { CatalogQueryInput } from "@/lib/catalog-routing";

export const revalidate = 0;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogQueryInput>;
}) {
  const params = await searchParams;
  const { heading, products, categories } = await getCatalogPageData(params);
  const browserKey = buildCatalogHref(params, "/products");

  return (
    <Suspense>
      <CatalogBrowser
        key={browserKey}
        heading={heading}
        products={products}
        categories={categories}
      />
    </Suspense>
  );
}
