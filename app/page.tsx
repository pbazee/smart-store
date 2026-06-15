import { Suspense } from "react";
import { PromoCards } from "@/components/shop/promo-cards";
import { TrustBar } from "@/components/shop/trust-bar";
import {
  HomepageBlogSection,
  HomepageCategorySection,
  HomepageCategorySkeleton,
  HomepageHeroSection,
  HomepageHeroSkeleton,
  HomepageBlogSkeleton,
  HomepageLatestReviewsSkeleton,
  HomepageProductSections,
  HomepageProductSectionsSkeleton,
  HomepageReviewsSection,
} from "@/components/shop/homepage-sections";
import {
  getHomepagePageData,
} from "@/lib/homepage-data";

// ISR: serve cached HTML instantly, rebuild in background every 1 hour.
// User-specific data (cart, wishlist) is client-fetched separately after hydration.
export const revalidate = 3600;

export default async function HomePage() {
  const homepageDataPromise = getHomepagePageData();
  const heroSlidesPromise = homepageDataPromise.then((data) => data.heroSlides);
  const homepageCategoriesPromise = homepageDataPromise.then((data) => data.categories);
  const homepageCriticalProductsPromise = homepageDataPromise.then((data) => data.criticalProducts);
  const homepageDeferredProductsPromise = homepageDataPromise.then((data) => data.deferredProducts);
  const latestReviewsPromise = homepageDataPromise.then((data) => data.latestReviews);
  const blogPostsPromise = homepageDataPromise.then((data) => data.blogPosts);

  return (
    <div>
      <Suspense fallback={<HomepageHeroSkeleton />}>
        <HomepageHeroSection slidesPromise={heroSlidesPromise} />
      </Suspense>
      <PromoCards />
      <TrustBar />
      <Suspense fallback={<HomepageCategorySkeleton />}>
        <HomepageCategorySection categoriesPromise={homepageCategoriesPromise} />
      </Suspense>
      <Suspense fallback={<HomepageProductSectionsSkeleton />}>
        <HomepageProductSections
          criticalProductsPromise={homepageCriticalProductsPromise}
          deferredProductsPromise={homepageDeferredProductsPromise}
        />
      </Suspense>
      <Suspense fallback={<HomepageLatestReviewsSkeleton />}>
        <HomepageReviewsSection latestReviewsPromise={latestReviewsPromise} />
      </Suspense>
      <Suspense fallback={<HomepageBlogSkeleton />}>
        <HomepageBlogSection blogPostsPromise={blogPostsPromise} />
      </Suspense>
    </div>
  );
}
