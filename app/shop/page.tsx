import { Suspense } from "react";
import { CatalogBrowser } from "@/components/shop/catalog-browser";
import { buildCatalogHref } from "@/lib/catalog-routing";
import { getCatalogPageData } from "@/lib/catalog-page-data";
import type { CatalogQueryInput } from "@/lib/catalog-routing";

// Allow Next.js to cache this page per unique filter combination.
// Products are revalidated every 5 minutes via unstable_cache in data-service.ts.
// Removing force-dynamic means repeat navigations (Shop → Women → Men → Shop)
// are served from the cache after the first load, making them near-instant.
export const revalidate = 300;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<CatalogQueryInput>;
}) {
  const params = await searchParams;
  // disableProductCache removed — let the 300-second unstable_cache in
  // data-service.ts do its job for each unique filter combination.
  const { heading, products, categories } = await getCatalogPageData(params);
  const browserKey = buildCatalogHref(params);

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

