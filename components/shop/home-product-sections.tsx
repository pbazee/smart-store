import { FeaturedGrid } from "@/components/shop/featured-grid";
import { NewArrivalsSection } from "@/components/shop/new-arrivals-section";
import { RecommendationCarousel } from "@/components/shop/recommendation-carousel";
import { TrendingSection } from "@/components/shop/trending-section";
import {
  getFeaturedProducts,
  getNewArrivals,
  getProducts,
  getTrendingProducts,
} from "@/lib/data-service";
import {
  getCityInspiredProducts,
  getCustomersAlsoBought,
} from "@/lib/recommendations";

export async function HomeProductSections() {
  const [featured, trending, newArrivals, allProducts] = await Promise.all([
    getFeaturedProducts(8),
    getTrendingProducts(8),
    getNewArrivals(8),
    getProducts(),
  ]);

  const referenceProduct = featured[0] ?? allProducts[0] ?? null;
  const alsoBought = referenceProduct
    ? getCustomersAlsoBought(allProducts, referenceProduct, 8)
    : [];
  const cityInspired = getCityInspiredProducts(allProducts, "Nairobi", 8);

  return (
    <>
      <FeaturedGrid products={featured} />
      <RecommendationCarousel
        eyebrow="Smart recommendations"
        title="Customers who bought this also bought"
        description="A fast-moving mix of compatible silhouettes, matching price bands, and category logic that feels personal without slowing down the storefront."
        products={alsoBought}
        viewAllLabel="Explore Recommended"
        viewAllHref="/products?filter=recommended"
      />
      <TrendingSection products={trending} />
      <NewArrivalsSection products={newArrivals} />
      <RecommendationCarousel
        eyebrow="Inspired by your city"
        title="Built for Nairobi streets and late golden-hour plans"
        description="Smart picks shaped by what the city responds to: versatile layers, confident color, and easy daily wear."
        products={cityInspired}
        viewAllLabel="Explore Recommended"
        viewAllHref="/products?filter=recommended"
      />
    </>
  );
}
