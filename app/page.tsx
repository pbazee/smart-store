import { HomepageCategoryGrid } from "@/components/shop/homepage-category-grid";
import { BlogTeaserSection } from "@/components/shop/blog-teaser-section";
import { HeroCarousel } from "@/components/shop/hero-carousel";
import { HomeProductSections } from "@/components/shop/home-product-sections";
import { PromoCards } from "@/components/shop/promo-cards";
import { TestimonialsSection } from "@/components/shop/testimonials-section";
import { TrustBar } from "@/components/shop/trust-bar";
import { getHomepagePageData } from "@/lib/homepage-data";

export default async function HomePage() {
  const homepageData = await getHomepagePageData();

  return (
    <div>
      <HeroCarousel slides={homepageData.heroSlides} />
      <PromoCards />
      <TrustBar />
      <HomepageCategoryGrid categories={homepageData.categories} />
      <HomeProductSections data={homepageData.productSections} />
      <TestimonialsSection />
      <BlogTeaserSection posts={homepageData.blogPosts} />
    </div>
  );
}
