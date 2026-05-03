import { Suspense } from "react";
import { BlogTeaserSection } from "@/components/shop/blog-teaser-section";
import { FeaturedGrid } from "@/components/shop/featured-grid";
import { HeroCarousel } from "@/components/shop/hero-carousel";
import { HomepageRecommendationSection } from "@/components/shop/homepage-recommendation-section";
import { HomepageCategoryGrid } from "@/components/shop/homepage-category-grid";
import { LatestReviews } from "@/components/shop/latest-reviews";
import { NewArrivalsSection } from "@/components/shop/new-arrivals-section";
import { TrendingSection } from "@/components/shop/trending-section";
import { buildCatalogHref } from "@/lib/catalog-routing";
import {
  getHomepageBlogPosts,
  getHomepageCategories,
  getHomepageCriticalProductSectionsData,
  getHomepageDeferredProductSectionsData,
  getHomepageHeroSlides,
  getHomepageLatestReviews,
  type HomepageCriticalProductSectionsData,
  type HomepageDeferredProductSectionsData,
} from "@/lib/homepage-data";

export async function HomepageHeroSection({
  slidesPromise,
}: {
  slidesPromise: Promise<Awaited<ReturnType<typeof getHomepageHeroSlides>>>;
}) {
  const heroSlides = await slidesPromise;

  return <HeroCarousel slides={heroSlides} />;
}

export async function HomepageCategorySection({
  categoriesPromise,
}: {
  categoriesPromise: Promise<Awaited<ReturnType<typeof getHomepageCategories>>>;
}) {
  const categories = await categoriesPromise;

  return <HomepageCategoryGrid categories={categories} />;
}

export async function HomepageProductSections({
  criticalProductsPromise,
  deferredProductsPromise,
}: {
  criticalProductsPromise: Promise<HomepageCriticalProductSectionsData>;
  deferredProductsPromise: Promise<HomepageDeferredProductSectionsData>;
}) {
  const productSections = await criticalProductsPromise;

  return (
    <>
      <FeaturedGrid products={productSections.featured} />
      <TrendingSection products={productSections.trending} />
      <Suspense fallback={<HomepageDeferredProductSectionsSkeleton />}>
        <DeferredHomepageProductSections deferredProductsPromise={deferredProductsPromise} />
      </Suspense>
    </>
  );
}

async function DeferredHomepageProductSections({
  deferredProductsPromise,
}: {
  deferredProductsPromise: Promise<HomepageDeferredProductSectionsData>;
}) {
  const productSections = await deferredProductsPromise;

  return (
    <>
      <HomepageRecommendationSection
        eyebrow="Smart recommendations"
        title="Customers who bought this also bought"
        description="A fast-moving mix of compatible silhouettes, matching price bands, and category logic that feels personal without slowing down the storefront."
        products={productSections.alsoBought}
        viewAllLabel="Explore Recommended"
        viewAllHref={buildCatalogHref({ collection: "recommended" })}
      />
      <NewArrivalsSection products={productSections.newArrivals} />
      <HomepageRecommendationSection
        eyebrow="Inspired by your city"
        title="Built for Nairobi streets and late golden-hour plans"
        description="Smart picks shaped by what the city responds to: versatile layers, confident color, and easy daily wear."
        products={productSections.cityInspired}
        viewAllLabel="Explore City Picks"
        viewAllHref={buildCatalogHref({ collection: "city-inspired" })}
      />
    </>
  );
}

export async function HomepageReviewsSection({
  latestReviewsPromise,
}: {
  latestReviewsPromise: Promise<Awaited<ReturnType<typeof getHomepageLatestReviews>>>;
}) {
  const latestReviews = await latestReviewsPromise;

  return <LatestReviews reviews={latestReviews} />;
}

export async function HomepageBlogSection({
  blogPostsPromise,
}: {
  blogPostsPromise: Promise<Awaited<ReturnType<typeof getHomepageBlogPosts>>>;
}) {
  const blogPosts = await blogPostsPromise;

  return <BlogTeaserSection posts={blogPosts} />;
}

export function HomepageHeroSkeleton() {
  return (
    <section className="relative isolate overflow-hidden bg-neutral-950">
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-end px-4 pb-20 pt-24 sm:min-h-[78vh] sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl space-y-5">
          <div className="h-7 w-32 rounded-full bg-white/10" />
          <div className="h-16 w-5/6 rounded-[2rem] bg-white/10 sm:h-20" />
          <div className="h-16 w-2/3 rounded-[2rem] bg-white/10 sm:h-20" />
          <div className="h-5 w-full max-w-2xl rounded-full bg-white/10" />
          <div className="h-5 w-4/5 max-w-xl rounded-full bg-white/10" />
          <div className="h-11 w-52 rounded-full bg-orange-500/40" />
        </div>
      </div>
    </section>
  );
}

export function HomepageCategorySkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-64 rounded-full bg-muted/60" />
        <div className="h-5 w-full max-w-lg rounded-full bg-muted/40" />
        <div className="h-5 w-4/5 max-w-md rounded-full bg-muted/40" />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/5] rounded-[2.5rem] bg-muted/40"
          />
        ))}
      </div>
    </section>
  );
}

export function HomepageProductSectionsSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3">
        <div className="h-4 w-28 rounded-full bg-muted/50" />
        <div className="h-10 w-72 rounded-full bg-muted/60" />
        <div className="h-5 w-full max-w-2xl rounded-full bg-muted/40" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
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

function HomepageDeferredProductSectionsSkeleton() {
  return (
    <>
      <HomepageProductSectionsSkeleton />
      <HomepageProductSectionsSkeleton />
      <HomepageProductSectionsSkeleton />
    </>
  );
}

export function HomepageStorefrontSectionsSkeleton() {
  return (
    <>
      <HomepageProductSectionsSkeleton />
      <HomepageLatestReviewsSkeleton />
      <HomepageBlogSkeleton />
    </>
  );
}

export function HomepageLatestReviewsSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mb-12 space-y-4">
        <div className="h-4 w-28 rounded-full bg-muted/50" />
        <div className="h-10 w-72 rounded-full bg-muted/60" />
        <div className="h-5 w-full max-w-lg rounded-full bg-muted/40" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-border/60 bg-card p-6">
            <div className="h-4 w-24 rounded-full bg-muted/50" />
            <div className="mt-4 h-5 w-2/3 rounded-full bg-muted/60" />
            <div className="mt-4 h-4 w-full rounded-full bg-muted/40" />
            <div className="mt-2 h-4 w-5/6 rounded-full bg-muted/40" />
            <div className="mt-6 h-10 w-40 rounded-full bg-muted/50" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomepageBlogSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <div className="h-4 w-24 rounded-full bg-muted/50" />
        <div className="h-10 w-72 rounded-full bg-muted/60" />
        <div className="h-5 w-full max-w-xl rounded-full bg-muted/40" />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[2rem] border border-border/60 bg-card"
          >
            <div className="h-56 bg-muted/40" />
            <div className="space-y-3 p-6">
              <div className="h-4 w-28 rounded-full bg-muted/50" />
              <div className="h-7 w-5/6 rounded-full bg-muted/60" />
              <div className="h-4 w-full rounded-full bg-muted/40" />
              <div className="h-4 w-4/5 rounded-full bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
