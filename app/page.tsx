import { HeroCarousel } from "@/components/shop/hero-carousel";
import { TrustBar } from "@/components/shop/trust-bar";
import { FeaturedGrid } from "@/components/shop/featured-grid";
import { TrendingSection } from "@/components/shop/trending-section";
import { NewArrivalsSection } from "@/components/shop/new-arrivals-section";
import {
  getFeaturedProducts,
  getTrendingProducts,
  getNewArrivals,
} from "@/lib/mock-data";

export default function HomePage() {
  const featured = getFeaturedProducts();
  const trending = getTrendingProducts();
  const newArrivals = getNewArrivals();

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
