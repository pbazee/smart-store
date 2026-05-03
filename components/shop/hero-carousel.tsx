"use client";

import { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { resolveCatalogListingHref } from "@/lib/catalog-routing";
import { cn, createBlurDataURL } from "@/lib/utils";
import type { HeroSlide } from "@/types";

const heroBlurDataUrl = createBlurDataURL({
  from: "#05060a",
  to: "#f97316",
  accent: "#ffffff",
});

export function HeroCarousel({ slides = [] }: { slides?: HeroSlide[] }) {
  const resolvedSlides = useMemo(
    () => [...slides].sort((left, right) => left.order - right.order),
    [slides]
  );
  const ctaHrefs = useMemo(
    () => resolvedSlides.map((slide) => resolveCatalogListingHref(slide.ctaLink)),
    [resolvedSlides]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: resolvedSlides.length > 1,
      align: "start",
      watchDrag: (_api, evt) => {
        const target = evt.target as Element;
        if (target.closest("a, button")) return false;
        return true;
      },
    },
    [Autoplay({ delay: 4800, stopOnInteraction: false })]
  );

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const updateSelectedIndex = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    updateSelectedIndex();
    emblaApi.on("select", updateSelectedIndex);
    emblaApi.on("reInit", updateSelectedIndex);

    return () => {
      emblaApi.off("select", updateSelectedIndex);
      emblaApi.off("reInit", updateSelectedIndex);
    };
  }, [emblaApi]);

  if (resolvedSlides.length === 0) {
    return null;
  }

  return (
    <section className="relative isolate overflow-hidden bg-neutral-950">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {resolvedSlides.map((slide, index) => {
            const ctaHref = ctaHrefs[index];

            return (
              <div key={slide.id} className="min-w-0 flex-[0_0_100%]">
                <div className="relative min-h-[70vh] sm:min-h-[78vh]">
                  <Image
                    src={slide.imageUrl}
                    alt={slide.title}
                    fill
                    priority={index === 0}
                    loading={index === 0 ? undefined : "lazy"}
                    sizes="100vw"
                    quality={index === 0 ? 68 : 62}
                    placeholder="blur"
                    blurDataURL={heroBlurDataUrl}
                    className="object-cover object-center"
                  />

                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.48)_46%,rgba(0,0,0,0.22)_100%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.24),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.15),transparent_30%)]" />

                  <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-7xl items-end px-4 pb-20 pt-24 sm:px-6 lg:min-h-[78vh] lg:px-8">
                    <div className="w-full">
                      <div
                        className={cn(
                          "max-w-3xl transition-[opacity,transform] duration-500 ease-out",
                          selectedIndex === index
                            ? "translate-y-0 opacity-100"
                            : "translate-y-3.5 opacity-70"
                        )}
                      >
                        <span className="overlay-readable-text mb-4 inline-flex rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.28em]">
                          Smartest edit
                        </span>
                        <h1 className="overlay-readable-text font-display text-4xl font-black leading-[0.92] sm:text-5xl lg:text-7xl">
                          {slide.title}
                        </h1>
                        <p className="overlay-readable-text mt-5 max-w-2xl text-base sm:text-lg">
                          {slide.subtitle}
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                          <Link
                            href={ctaHref}
                            prefetch={!/^https?:\/\//i.test(ctaHref)}
                            className="inline-flex items-center gap-3 rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-[0_16px_40px_rgba(249,115,22,0.28)] transition-all hover:scale-[1.03] hover:bg-orange-600 active:scale-95"
                          >
                            {slide.ctaText}
                            <ArrowRight className="h-5 w-5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-4 pb-6 sm:px-6 lg:px-8">
          <div className="pointer-events-auto flex items-center gap-2">
            {resolvedSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${selectedIndex === index
                    ? "w-10 bg-orange-500"
                    : "w-2.5 bg-white/45 hover:bg-white/70"
                  }`}
              />
            ))}
          </div>

          <div className="pointer-events-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous slide"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white transition-colors hover:bg-black/70"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next slide"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white transition-colors hover:bg-black/70"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
