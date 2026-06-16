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

// Force dynamic rendering so every request gets a fresh server render.
// Data caching is handled at the data layer via unstable_cache (3600s TTL).
// This avoids the ISR pitfall where Vercel can cache a build-time-empty page
// (skeleton fallbacks only) and serve it to the first visitor after deployment.
export const dynamic = "force-dynamic";

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
