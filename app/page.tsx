import { Suspense } from "react";
import { PromoCards } from "@/components/shop/promo-cards";
import { TrustBar } from "@/components/shop/trust-bar";
import {
  HomepageCategorySection,
  HomepageCategorySkeleton,
  HomepageHeroSection,
  HomepageHeroSkeleton,
  HomepageStorefrontSections,
  HomepageStorefrontSectionsSkeleton,
} from "@/components/shop/homepage-sections";

export const revalidate = 3600;

export default function HomePage() {
  return (
    <div>
      <Suspense fallback={<HomepageHeroSkeleton />}>
        <HomepageHeroSection />
      </Suspense>
      <PromoCards />
      <TrustBar />
      <Suspense fallback={<HomepageCategorySkeleton />}>
        <HomepageCategorySection />
      </Suspense>
      <Suspense fallback={<HomepageStorefrontSectionsSkeleton />}>
        <HomepageStorefrontSections />
      </Suspense>
    </div>
  );
}
