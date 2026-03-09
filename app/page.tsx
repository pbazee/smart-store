import { HeroCarousel } from "@/components/shop/hero-carousel";
import { TrustBar } from "@/components/shop/trust-bar";
import { FeaturedGrid } from "@/components/shop/featured-grid";
import { TrendingSection } from "@/components/shop/trending-section";
import { NewArrivalsSection } from "@/components/shop/new-arrivals-section";
import {
  getFeaturedProducts,
  getTrendingProducts,
  getNewArrivals,
} from "@/lib/data-service";

export default async function HomePage() {
  const featured = await getFeaturedProducts();
  const trending = await getTrendingProducts();
  const newArrivals = await getNewArrivals();

  return (
    <div>
      <HeroCarousel />
      <TrustBar />
      <FeaturedGrid products={featured} />
      <TrendingSection products={trending} />
      <NewArrivalsSection products={newArrivals} />
    </div>
  );
}
