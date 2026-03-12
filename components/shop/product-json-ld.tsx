import type { Product } from "@/types";

export function ProductJsonLd({
  product,
  ratingValue,
  reviewCount,
}: {
  product: Product;
  ratingValue: number;
  reviewCount: number;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "Smartest Store KE",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: product.basePrice,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
