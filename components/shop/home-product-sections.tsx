import { FeaturedGrid } from "@/components/shop/featured-grid";
import { NewArrivalsSection } from "@/components/shop/new-arrivals-section";
import { RecommendationCarousel } from "@/components/shop/recommendation-carousel";
import { TrendingSection } from "@/components/shop/trending-section";
import {
  getHomepageProductSectionsData,
  type HomepageProductSectionsData,
} from "@/lib/homepage-data";

export async function HomeProductSections({
  data: providedData,
}: {
  data?: HomepageProductSectionsData;
}) {
  const data = providedData ?? (await getHomepageProductSectionsData());
  const { featured, trending, newArrivals, alsoBought, cityInspired } = data;

  return (
    <>
      <FeaturedGrid products={featured} />
      <RecommendationCarousel
        eyebrow="Smart recommendations"
        title="Customers who bought this also bought"
        description="A fast-moving mix of compatible silhouettes, matching price bands, and category logic that feels personal without slowing down the storefront."
        products={alsoBought}
        viewAllLabel="Explore Recommended"
        viewAllHref="/shop?collection=recommended"
      />
      <TrendingSection products={trending} />
      <NewArrivalsSection products={newArrivals} />
      <RecommendationCarousel
        eyebrow="Inspired by your city"
        title="Built for Nairobi streets and late golden-hour plans"
        description="Smart picks shaped by what the city responds to: versatile layers, confident color, and easy daily wear."
        products={cityInspired}
        viewAllLabel="Explore City Picks"
        viewAllHref="/shop?collection=city-inspired"
      />
    </>
  );
}
