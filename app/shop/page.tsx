import { Suspense } from "react";
import { CatalogBrowser } from "@/components/shop/catalog-browser";
import { InlineLoader } from "@/components/ui/ripple-loader";
import { buildCatalogHref } from "@/lib/catalog-routing";
import { getCatalogPageData } from "@/lib/catalog-page-data";
import type { CatalogQueryInput } from "@/lib/catalog-routing";

export const revalidate = 300;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<CatalogQueryInput>;
}) {
  const params = await searchParams;
  const { heading, products, categories } = await getCatalogPageData(params);
  const browserKey = buildCatalogHref(params);

  return (
    <Suspense fallback={<InlineLoader label="Loading products..." />}>
      <CatalogBrowser
        key={browserKey}
        heading={heading}
        products={products}
        categories={categories}
      />
    </Suspense>
  );
}
