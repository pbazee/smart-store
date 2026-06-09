import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductDetail } from "@/components/shop/product-detail";
import { ProductJsonLd } from "@/components/shop/product-json-ld";
import { InlineLoader } from "@/components/ui/ripple-loader";

import { getAppUrl } from "@/lib/app-url";
import { getProductByIdentifier } from "@/lib/data-service";
import { buildProductHref } from "@/lib/product-routes";
import { getProductReviews } from "@/lib/reviews-service";
import { getStoreBranding } from "@/lib/store-branding";
import { formatKES } from "@/lib/utils";
import { ProductRecommendations } from "./product-recommendations";


export const dynamic = "force-dynamic";
export const revalidate = 0;
const PRODUCT_SHARE_BASE_URL = "https://smart-store-iota.vercel.app";

function buildAbsoluteUrl(pathOrUrl: string) {
  const baseUrl = getAppUrl().includes("localhost") ? PRODUCT_SHARE_BASE_URL : getAppUrl();
  return new URL(pathOrUrl, baseUrl).toString();
}

function buildProductDescription(
  product: {
    name: string;
    description: string;
    basePrice: number;
  },
  storeName: string
) {
  const summary = `${product.name} for ${formatKES(product.basePrice)} at ${storeName}.`;
  const combined = `${summary} ${product.description}`.trim();
  return combined.length > 160 ? `${combined.slice(0, 157).trimEnd()}...` : combined;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const variantId = resolvedSearchParams?.variant as string | undefined;
  const [product, branding] = await Promise.all([
    getProductByIdentifier(slug),
    getStoreBranding().catch(() => null),
  ]);

  if (!product) {
    return {
      title: "Product not found | Smartest Store KE",
      description: "The product you are looking for could not be found.",
    };
  }

  const storeName = branding?.storeName || "Smartest Store KE";
  const metadataBase = new URL(getAppUrl().includes("localhost") ? PRODUCT_SHARE_BASE_URL : getAppUrl());
  const variant = variantId ? product.variants.find((v) => v.id === variantId) : null;
  const variantUrlSuffix = variantId ? `?variant=${variantId}` : "";
  const productUrl = buildAbsoluteUrl(`${buildProductHref(product)}${variantUrlSuffix}`);
  const primaryImage =
    variant?.variantImageUrl ||
    product.variants?.find((v) => v.variantImageUrl)?.variantImageUrl ||
    product.images?.[0] ||
    "";
  const imageUrl = primaryImage
    ? buildAbsoluteUrl(primaryImage)
    : buildAbsoluteUrl("/og-image.jpg");
  
  const variantTitleSuffix = variant ? ` - ${variant.color}` : "";
  const displayPrice = variant?.price ?? product.basePrice;
  const description = buildProductDescription(
    { name: `${product.name}${variantTitleSuffix}`, description: product.description, basePrice: displayPrice },
    storeName
  );

  return {
    metadataBase,
    title: `${product.name}${variantTitleSuffix} | ${storeName}`,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: `${product.name}${variantTitleSuffix} - ${formatKES(displayPrice)}`,
      description,
      url: productUrl,
      siteName: storeName,
      type: "website",
      locale: "en_KE",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name}${variantTitleSuffix} - ${formatKES(displayPrice)}`,
      description,
      images: [imageUrl],
    },
    other: {
      "og:price:amount": String(displayPrice),
      "og:price:currency": "KES",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, branding] = await Promise.all([
    getProductByIdentifier(slug),
    getStoreBranding().catch(() => null),
  ]);

  if (!product) {
    notFound();
  }

  if (slug !== product.slug) {
    redirect(buildProductHref(product));
  }

  const productUrl = buildAbsoluteUrl(buildProductHref(product));
  const storeName = branding?.storeName || "Smartest Store KE";
  const initialReviews = await getProductReviews(product.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      <ProductJsonLd
        product={product}
        ratingValue={product.rating}
        reviewCount={product.reviewCount}
        productUrl={productUrl}
        storeName={storeName}
      />

      <ProductDetail product={product} initialReviews={initialReviews} />

      <Suspense fallback={<InlineLoader label="Loading recommendations..." />}>
        <ProductRecommendations product={product} />
      </Suspense>
    </div>
  );
}
