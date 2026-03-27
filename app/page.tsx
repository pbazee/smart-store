import { HomepageCategoryGrid } from "@/components/shop/homepage-category-grid";
import { BlogTeaserSection } from "@/components/shop/blog-teaser-section";
import { HeroCarousel } from "@/components/shop/hero-carousel";
import { HomeProductSections } from "@/components/shop/home-product-sections";
import { PromoCards } from "@/components/shop/promo-cards";
import { TrustBar } from "@/components/shop/trust-bar";
import { LatestReviews } from "@/components/shop/latest-reviews";
import { getHomepagePageData } from "@/lib/homepage-data";

export const revalidate = 300;

export default async function HomePage() {
  const homepageData = await getHomepagePageData();

  return (
    <div>
      <HeroCarousel slides={homepageData.heroSlides} />
      <PromoCards />
      <TrustBar />
      <HomepageCategoryGrid categories={homepageData.categories} />
      <HomeProductSections data={homepageData.productSections} />
      <LatestReviews reviews={homepageData.latestReviews} />
      <BlogTeaserSection posts={homepageData.blogPosts} />
    </div>
  );
}
