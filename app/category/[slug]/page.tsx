import { Suspense } from "react";
import { CatalogBrowser } from "@/components/shop/catalog-browser";
import { resolveCategoryConfig } from "@/lib/catalog-config";
import { getActiveCategories } from "@/lib/category-service";
import { getProducts } from "@/lib/data-service";

export const revalidate = 0;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryConfig = resolveCategoryConfig(slug);
  const [products, categories] = await Promise.all([
    getProducts(categoryConfig.filters),
    getActiveCategories(),
  ]);

  return (
    <Suspense>
      <CatalogBrowser
        heading={categoryConfig.heading}
        products={products}
        categories={categories}
        lockedCategory={categoryConfig.lockedCategory}
      />
    </Suspense>
  );
}
