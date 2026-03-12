import { Suspense } from "react";
import { CategoryGrid } from "@/components/shop/category-grid";
import { CategoryGridSkeleton } from "@/components/shop/category-grid-skeleton";
import { BlogTeaserSection } from "@/components/shop/blog-teaser-section";
import { BlogTeaserSkeleton } from "@/components/shop/blog-teaser-skeleton";
import { HeroCarousel } from "@/components/shop/hero-carousel";
import { HomeProductSections } from "@/components/shop/home-product-sections";
import { PromoCards } from "@/components/shop/promo-cards";
import { TestimonialsSection } from "@/components/shop/testimonials-section";
import { TrustBar } from "@/components/shop/trust-bar";

export const revalidate = 0;

export default function HomePage() {
  return (
    <div>
      <HeroCarousel />
      <PromoCards />
      <TrustBar />
      <Suspense fallback={<CategoryGridSkeleton />}>
        <CategoryGrid />
      </Suspense>
      <Suspense fallback={null}>
        <HomeProductSections />
      </Suspense>
      <TestimonialsSection />
      <Suspense fallback={<BlogTeaserSkeleton />}>
        <BlogTeaserSection />
      </Suspense>
    </div>
  );
}
