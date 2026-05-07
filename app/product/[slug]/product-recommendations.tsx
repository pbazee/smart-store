import { RecommendationCarousel } from "@/components/shop/recommendation-carousel";
import { getProducts, getRelatedProducts } from "@/lib/data-service";
import { isPrismaConnectionError } from "@/lib/prisma-error-utils";
import { getCityInspiredProducts } from "@/lib/recommendations";
import type { Product } from "@/types";

export async function ProductRecommendations({ product }: { product: Product }) {
  let alsoBought: Product[] = [];
  let trendingProducts: Product[] = [];

  try {
    [alsoBought, trendingProducts] = await Promise.all([
      getRelatedProducts(product, 8),
      getProducts({ isTrending: true, take: 18 }),
    ]);
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.warn("[ProductRecommendations] Skipping recommendations because the database is unavailable.");
      return null;
    }

    throw error;
  }

  const cityInspired = getCityInspiredProducts(
    trendingProducts.filter((candidate) => candidate.id !== product.id),
    "Nairobi",
    8
  );

  if (alsoBought.length === 0 && cityInspired.length === 0) {
    return null;
  }

  return (
    <div className="mt-20">
      {alsoBought.length > 0 ? (
        <RecommendationCarousel
          eyebrow="Smart pairing"
          title="Customers who bought this also bought"
          description="Cross-category recommendations grounded in style proximity, pricing, and what fits naturally into the same wardrobe."
          products={alsoBought}
        />
      ) : null}
      {cityInspired.length > 0 ? (
        <RecommendationCarousel
          eyebrow="City signal"
          title="Inspired by your city"
          description="More Nairobi-coded pieces with the same mix of flexibility, edge, and easy repeat wear."
          products={cityInspired}
        />
      ) : null}
    </div>
  );
}
