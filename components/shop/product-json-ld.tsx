import { getEffectiveProductStock } from "@/lib/product-stock";
import type { Product } from "@/types";

export function ProductJsonLd({
  product,
  ratingValue,
  reviewCount,
  productUrl,
  storeName,
}: {
  product: Product;
  ratingValue: number;
  reviewCount: number;
  productUrl: string;
  storeName: string;
}) {
  const absoluteImages = product.images
    .filter(Boolean)
    .map((image) => new URL(image, productUrl).toString());
  const pricePoints = product.variants
    .map((variant) => variant.price)
    .filter((price) => Number.isFinite(price) && price > 0);
  const price = pricePoints.length > 0 ? Math.min(...pricePoints) : product.basePrice;
  const stock = getEffectiveProductStock(product);
  const availability = (typeof stock !== "number" || stock > 0)
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: absoluteImages,
    sku: product.id,
    url: productUrl,
    category: [product.category, product.subcategory].filter(Boolean).join(" > "),
    brand: {
      "@type": "Brand",
      name: storeName,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "KES",
      price,
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: storeName,
      },
    },
    ...(reviewCount > 0 && ratingValue > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue,
            reviewCount,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
