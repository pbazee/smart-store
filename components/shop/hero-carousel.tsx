"use client";

import { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
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
    [Autoplay({ delay: 6500, stopOnInteraction: false })]
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
    return (
      <section className="relative isolate overflow-hidden bg-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.22),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.16),transparent_32%),linear-gradient(135deg,#05060a_0%,#101828_50%,#140a05_100%)]" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-end px-4 pb-20 pt-24 sm:min-h-[78vh] sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="overlay-readable-text mb-4 inline-flex rounded-full border border-white/15 bg-black/30 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.28em] backdrop-blur">
              Smartest edit
            </span>
            <h1 className="overlay-readable-text font-display text-4xl font-black leading-[0.92] sm:text-5xl lg:text-7xl">
              Smart fashion, no fake placeholders
            </h1>
            <p className="overlay-readable-text mt-5 max-w-2xl text-base sm:text-lg">
              We are loading the latest homepage campaign and storefront picks from your live catalog.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-3 rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-[0_16px_40px_rgba(249,115,22,0.28)] transition-all hover:scale-[1.03] hover:bg-orange-600 active:scale-95"
              >
                Shop Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
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
                    quality={72}
                    placeholder="blur"
                    blurDataURL={heroBlurDataUrl}
                    className="object-cover object-center"
                  />

                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.48)_46%,rgba(0,0,0,0.22)_100%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.24),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.15),transparent_30%)]" />

                  <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-7xl items-end px-4 pb-20 pt-24 sm:px-6 lg:min-h-[78vh] lg:px-8">
                    <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
                      <div
                        className={cn(
                          "max-w-3xl transition-[opacity,transform] duration-500 ease-out",
                          selectedIndex === index
                            ? "translate-y-0 opacity-100"
                            : "translate-y-3.5 opacity-70"
                        )}
                      >
                        <span className="overlay-readable-text mb-4 inline-flex rounded-full border border-white/15 bg-black/30 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.28em] backdrop-blur">
                          Smartest edit
                        </span>
                        <h1 className="overlay-readable-text font-display text-4xl font-black leading-[0.92] sm:text-5xl lg:text-7xl">
                          {slide.title}
                        </h1>
                        <p className="overlay-readable-text mt-5 max-w-2xl text-base sm:text-lg">
                          {slide.subtitle}
                        </p>
                        <div className="overlay-readable-text mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                          <MapPin className="h-3.5 w-3.5 text-orange-300" />
                          <span>{slide.locationBadge}</span>
                        </div>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                          <Link
                            href={ctaHref}
                            prefetch={!/^https?:\/\//i.test(ctaHref)}
                            className="inline-flex items-center gap-3 rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-[0_16px_40px_rgba(249,115,22,0.28)] transition-all hover:scale-[1.03] hover:bg-orange-600 active:scale-95"
                          >
                            {slide.ctaText}
                            <ArrowRight className="h-5 w-5" />
                          </Link>
                          {slide.moodTags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {slide.moodTags.slice(0, 3).map((tag) => (
                                <span
                                  key={`${slide.id}-${tag}`}
                                  className="overlay-readable-text rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className={cn(
                          "overlay-readable-surface hidden rounded-[2rem] border border-white/12 bg-black/30 p-5 backdrop-blur-lg transition-[opacity,transform] duration-500 ease-out lg:block",
                          selectedIndex === index
                            ? "translate-y-0 opacity-100"
                            : "translate-y-[18px] opacity-[0.55]"
                        )}
                      >
                        <p className="text-xs font-bold uppercase tracking-[0.28em]">
                          Hero details
                        </p>
                        <div className="mt-6 space-y-5">
                          <div>
                            <p className="text-3xl font-black">{String(index + 1).padStart(2, "0")}</p>
                            <p className="mt-1 text-sm">Current slide</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">CTA destination</p>
                            <p className="mt-1 text-sm">{ctaHref}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Mood tags</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {slide.moodTags.length > 0 ? (
                                slide.moodTags.map((tag) => (
                                  <span
                                    key={`${slide.id}-panel-${tag}`}
                                    className="rounded-full border border-white/12 bg-black/35 px-3 py-1 text-xs font-semibold"
                                  >
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm">No tags configured</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Location badge</p>
                            <p className="mt-1 text-sm">{slide.locationBadge}</p>
                          </div>
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
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white backdrop-blur transition-colors hover:bg-black/45"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next slide"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white backdrop-blur transition-colors hover:bg-black/45"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
