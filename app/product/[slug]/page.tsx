import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { ProductDetail } from "@/components/shop/product-detail";
import { ProductJsonLd } from "@/components/shop/product-json-ld";
import { InlineLoader } from "@/components/ui/ripple-loader";
import { getProductByIdentifier, getProducts } from "@/lib/data-service";
import { buildProductHref } from "@/lib/product-routes";
import { ProductRecommendations } from "./product-recommendations";

export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getProducts(undefined, {
    cacheKey: "product-static-params",
    revalidateSeconds: 300,
  });

  return products.map((product) => ({ slug: product.slug }));
}

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

      <Suspense fallback={<InlineLoader label="Loading recommendations..." />}>
        <ProductRecommendations product={product} />
      </Suspense>
    </div>
  );
}
