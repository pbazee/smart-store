import dynamic from "next/dynamic";

import { FeaturedGrid } from "@/components/shop/featured-grid";
import { NewArrivalsSection } from "@/components/shop/new-arrivals-section";
import { TrendingSection } from "@/components/shop/trending-section";
import type { HomepageProductSectionsData } from "@/lib/homepage-data";

const RecommendationCarousel = dynamic(
  () =>
    import("@/components/shop/recommendation-carousel").then(
      (module) => module.RecommendationCarousel
    ),
  {
    loading: () => <RecommendationCarouselSkeleton />,
  }
);

function RecommendationCarouselSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3">
        <div className="h-4 w-36 rounded-full bg-muted/50" />
        <div className="h-10 w-80 rounded-full bg-muted/60" />
        <div className="h-5 w-full max-w-2xl rounded-full bg-muted/40" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="aspect-[3/4] rounded-2xl bg-muted/40" />
            <div className="h-4 w-4/5 rounded-full bg-muted/50" />
            <div className="h-4 w-1/2 rounded-full bg-muted/40" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeProductSections({
  data,
}: {
  data: HomepageProductSectionsData;
}) {
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
