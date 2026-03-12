import { Suspense } from "react";
import { CatalogBrowser } from "@/components/shop/catalog-browser";
import { resolveCategoryConfig } from "@/lib/catalog-config";
import { getProducts } from "@/lib/data-service";

export const revalidate = 0;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryConfig = resolveCategoryConfig(slug);
  const products = await getProducts(categoryConfig.filters);

  return (
    <Suspense>
      <CatalogBrowser
        heading={categoryConfig.heading}
        products={products}
        lockedCategory={categoryConfig.lockedCategory}
      />
    </Suspense>
  );
}
