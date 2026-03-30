"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import { BlogTeaserSection } from "@/components/shop/blog-teaser-section";
import { HomeProductSections } from "@/components/shop/home-product-sections";
import { LatestReviews } from "@/components/shop/latest-reviews";
import { TestimonialsSection } from "@/components/shop/testimonials-section";
import type { HomepageProductSectionsData } from "@/lib/homepage-data";
import type { BlogPost } from "@/types";

type ReviewWithProduct = {
  id: string;
  authorName: string;
  authorCity?: string | null;
  rating: number;
  title?: string | null;
  content: string;
  createdAt: string | Date;
  product: {
    name: string;
    slug: string;
  };
};

type HomepageStorefrontSectionsData = {
  productSections: HomepageProductSectionsData;
  latestReviews: ReviewWithProduct[];
  blogPosts: BlogPost[];
};

function hasProductSections(data: HomepageProductSectionsData) {
  return (
    data.featured.length > 0 ||
    data.trending.length > 0 ||
    data.newArrivals.length > 0 ||
    data.alsoBought.length > 0 ||
    data.cityInspired.length > 0
  );
}

function shouldRefreshStorefrontSections(data: HomepageStorefrontSectionsData) {
  return (
    !hasProductSections(data.productSections) ||
    data.latestReviews.length === 0 ||
    data.blogPosts.length === 0
  );
}

function HomepageCollectionsFallback() {
  const sections = [
    {
      eyebrow: "Popular products",
      title: "Community favorites worth a second look",
      description:
        "Fast-moving staples, polished sneakers, and easy wardrobe wins curated for quick discovery.",
      href: "/shop?collection=popular",
      icon: Sparkles,
      className:
        "bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_45%),linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)]",
    },
    {
      eyebrow: "Recommended products",
      title: "Smart picks matched to how customers really shop",
      description:
        "Complementary silhouettes, strong price matches, and the combinations people keep coming back for.",
      href: "/shop?collection=recommended",
      icon: ShoppingBag,
      className:
        "bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_42%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]",
    },
    {
      eyebrow: "Trending now",
      title: "The pieces moving fastest across Nairobi right now",
      description:
        "Street-ready layers, confident color, and the looks currently leading the conversation.",
      href: "/shop?collection=trending",
      icon: TrendingUp,
      className:
        "bg-[radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.18),transparent_42%),linear-gradient(180deg,#f0fdf4_0%,#ffffff_100%)]",
    },
    {
      eyebrow: "New arrivals",
      title: "Fresh drops with first-look energy",
      description:
        "New bombers, cargos, dresses, and sneakers that still feel early before the rest of the city catches on.",
      href: "/shop?collection=new-arrivals",
      icon: ArrowUpRight,
      className:
        "bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.15),transparent_45%),linear-gradient(180deg,#fff1f2_0%,#ffffff_100%)]",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-500">
          Storefront highlights
        </p>
        <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">
          The landing page sections are loading their live picks
        </h2>
        <p className="mt-3 text-muted-foreground">
          Explore the signature collections while the homepage refreshes the full product grids.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className={`group rounded-[2rem] border border-border/70 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-1 ${section.className}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-500">
                  {section.eyebrow}
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-foreground">
                  {section.title}
                </h3>
              </div>
              <span className="rounded-full bg-white/90 p-3 text-brand-500 shadow-sm">
                <section.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {section.description}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition-transform group-hover:translate-x-1">
              Explore now
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HomepageJournalFallback() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-border bg-card px-6 py-12 text-center shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-500">Journal</p>
        <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">
          Style notes and trend reports are on the way
        </h2>
        <p className="mt-3 text-muted-foreground">
          Browse the full journal while the homepage refreshes the latest editorial stories.
        </p>
        <Link
          href="/blog"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Visit the blog
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export function HomepageStorefrontSectionsClient({
  initialData,
}: {
  initialData: HomepageStorefrontSectionsData;
}) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(() => shouldRefreshStorefrontSections(initialData));
  const hasAttemptedRefreshRef = useRef(false);

  const needsRuntimeRefresh = useMemo(() => shouldRefreshStorefrontSections(data), [data]);

  useEffect(() => {
    if (!needsRuntimeRefresh) {
      setIsRefreshing(false);
      return;
    }

    if (hasAttemptedRefreshRef.current) {
      setIsRefreshing(false);
      return;
    }

    let cancelled = false;
    hasAttemptedRefreshRef.current = true;

    const refreshSections = async () => {
      setIsRefreshing(true);

      try {
        const response = await fetch("/api/homepage/sections", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Homepage sections request failed: ${response.status}`);
        }

        const payload = (await response.json().catch(() => null)) as
          | { data?: HomepageStorefrontSectionsData }
          | null;

        if (!cancelled && payload?.data) {
          setData(payload.data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[Homepage] Failed to refresh storefront sections:", error);
        }
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    };

    void refreshSections();

    return () => {
      cancelled = true;
    };
  }, [needsRuntimeRefresh]);

  return (
    <>
      {hasProductSections(data.productSections) ? (
        <HomeProductSections data={data.productSections} />
      ) : (
        <HomepageCollectionsFallback />
      )}

      {data.latestReviews.length > 0 ? (
        <LatestReviews reviews={data.latestReviews} />
      ) : (
        <TestimonialsSection />
      )}

      {data.blogPosts.length > 0 ? (
        <BlogTeaserSection posts={data.blogPosts} />
      ) : (
        <HomepageJournalFallback />
      )}

      {isRefreshing && !hasProductSections(data.productSections) ? (
        <div className="pb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Refreshing live storefront picks...
        </div>
      ) : null}
    </>
  );
}
