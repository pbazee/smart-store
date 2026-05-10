import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductDetail } from "@/components/shop/product-detail";
import { ProductJsonLd } from "@/components/shop/product-json-ld";
import { InlineLoader } from "@/components/ui/ripple-loader";
import { getAppUrl } from "@/lib/app-url";
import { getProductByIdentifier, getProducts } from "@/lib/data-service";
import { buildProductHref } from "@/lib/product-routes";
import { getStoreBranding } from "@/lib/store-branding";
import { formatKES } from "@/lib/utils";
import { ProductRecommendations } from "./product-recommendations";

export const revalidate = 300;

function buildAbsoluteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, getAppUrl()).toString();
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
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
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
  const productUrl = buildAbsoluteUrl(buildProductHref(product));
  const imageUrl = buildAbsoluteUrl(product.images[0] || "/og-image.jpg");
  const description = buildProductDescription(product, storeName);
  const title = `${product.name} | ${storeName}`;
  const socialTitle = `${product.name} — ${formatKES(product.basePrice)} at ${storeName}`;

  const normalizedSocialTitle = `${product.name} - ${formatKES(product.basePrice)} at ${storeName}`;

  return {
    title,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: normalizedSocialTitle,
      description,
      url: productUrl,
      siteName: storeName,
      type: "website",
      locale: "en_KE",
      images: [
        {
          url: imageUrl,
          alt: product.name,
          width: 800,
          height: 800,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: normalizedSocialTitle,
      description,
      images: [imageUrl],
    },
    other: {
      "og:price:amount": String(product.basePrice),
      "og:price:currency": "KES",
    },
  };
}

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ProductJsonLd
        product={product}
        ratingValue={product.rating}
        reviewCount={product.reviewCount}
        productUrl={productUrl}
        storeName={storeName}
      />

      <ProductDetail product={product} />

      <Suspense fallback={<InlineLoader label="Loading recommendations..." />}>
        <ProductRecommendations product={product} />
      </Suspense>
    </div>
  );
}
