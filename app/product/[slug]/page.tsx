import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { ProductDetail } from "@/components/shop/product-detail";
import { ProductJsonLd } from "@/components/shop/product-json-ld";
import { getProductByIdentifier } from "@/lib/data-service";
import { buildProductHref } from "@/lib/product-routes";
import { ProductRecommendations } from "./product-recommendations";
import { ProductRecommendationsSkeleton } from "./product-recommendations-skeleton";

export const revalidate = 0;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductByIdentifier(slug);

  if (!product) {
    notFound();
  }

  if (slug !== product.slug) {
    redirect(buildProductHref(product));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ProductJsonLd
        product={product}
        ratingValue={product.rating}
        reviewCount={product.reviewCount}
      />

      <ProductDetail product={product} />

      <Suspense fallback={<ProductRecommendationsSkeleton />}>
        <ProductRecommendations product={product} />
      </Suspense>
    </div>
  );
}
