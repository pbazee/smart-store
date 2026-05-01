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
  getHomepageBlogPosts,
  getHomepageCategories,
  getHomepageCriticalProductSectionsData,
  getHomepageDeferredProductSectionsData,
  getHomepageHeroSlides,
  getHomepageLatestReviews,
} from "@/lib/homepage-data";

export const revalidate = 120;
export default async function HomePage() {
  const heroSlidesPromise = getHomepageHeroSlides();
  const homepageCategoriesPromise = getHomepageCategories();
  const homepageCriticalProductsPromise = getHomepageCriticalProductSectionsData();
  const homepageDeferredProductsPromise = getHomepageDeferredProductSectionsData();
  const latestReviewsPromise = getHomepageLatestReviews();
  const blogPostsPromise = getHomepageBlogPosts();

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
