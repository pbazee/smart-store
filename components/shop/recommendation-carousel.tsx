"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRoutePrefetch } from "@/hooks/use-route-prefetch";
import type { Product } from "@/types";
import { ProductCard } from "@/components/shop/product-card";

type RecommendationCarouselProps = {
  eyebrow: string;
  title: string;
  description: string;
  products: Product[];
  viewAllLabel?: string;
  viewAllHref?: string;
};

export function RecommendationCarousel({
  eyebrow,
  title,
  description,
  products,
  viewAllLabel,
  viewAllHref,
}: RecommendationCarouselProps) {
  useRoutePrefetch(viewAllHref ? [viewAllHref] : []);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateState = useCallback(() => {
    if (!emblaApi) {
      return;
    }

    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    updateState();
    emblaApi.on("select", updateState);
    emblaApi.on("reInit", updateState);
  }, [emblaApi, updateState]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-500">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {viewAllHref && viewAllLabel ? (
            <Link
              href={viewAllHref}
              className="inline-flex w-fit items-center rounded-full border border-border px-5 py-3 text-sm font-semibold transition-colors hover:border-brand-300 hover:text-brand-600"
            >
              {viewAllLabel}
            </Link>
          ) : null}
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className="rounded-full border border-border p-3 text-muted-foreground transition-colors hover:border-brand-300 hover:text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canScrollNext}
              className="rounded-full border border-border p-3 text-muted-foreground transition-colors hover:border-brand-300 hover:text-foreground disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div ref={emblaRef} className="overflow-hidden">
        <div className="-ml-4 flex">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="min-w-0 flex-[0_0_78%] pl-4 sm:flex-[0_0_42%] lg:flex-[0_0_28%]"
            >
              <ProductCard product={product} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
