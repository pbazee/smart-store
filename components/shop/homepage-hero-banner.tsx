import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { resolveCatalogListingHref } from "@/lib/catalog-routing";
import { createBlurDataURL } from "@/lib/utils";
import type { HeroSlide } from "@/types";

const heroBlurDataUrl = createBlurDataURL({
  from: "#05060a",
  to: "#f97316",
  accent: "#ffffff",
});

export function HomepageHeroBanner({ slides = [] }: { slides?: HeroSlide[] }) {
  const resolvedSlides = [...slides].sort((left, right) => left.order - right.order);
  const primarySlide = resolvedSlides[0];

  if (!primarySlide) {
    return (
      <section className="relative isolate overflow-hidden bg-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.22),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.16),transparent_32%),linear-gradient(135deg,#05060a_0%,#101828_50%,#140a05_100%)]" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-end px-4 pb-20 pt-24 sm:min-h-[78vh] sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="overlay-readable-text mb-4 inline-flex rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.28em]">
              Smartest edit
            </span>
            <h1 className="overlay-readable-text font-display text-4xl font-black leading-[0.92] sm:text-5xl lg:text-7xl">
              Smart fashion, no fake placeholders
            </h1>
            <p className="overlay-readable-text mt-5 max-w-2xl text-base sm:text-lg">
              We are loading the latest homepage campaign and storefront picks from your live catalog.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const ctaHref = resolveCatalogListingHref(primarySlide.ctaLink);

  return (
    <section className="relative isolate overflow-hidden bg-neutral-950">
      <div className="relative min-h-[70vh] sm:min-h-[78vh]">
        <Image
          src={primarySlide.imageUrl}
          alt={primarySlide.title}
          fill
          priority
          fetchPriority="high"
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
            <div className="max-w-3xl">
              <span className="overlay-readable-text mb-4 inline-flex rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.28em]">
                Smartest edit
              </span>
              <h1 className="overlay-readable-text font-display text-4xl font-black leading-[0.92] sm:text-5xl lg:text-7xl">
                {primarySlide.title}
              </h1>
              <p className="overlay-readable-text mt-5 max-w-2xl text-base sm:text-lg">
                {primarySlide.subtitle}
              </p>
              <div className="overlay-readable-text mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                <MapPin className="h-3.5 w-3.5 text-orange-300" />
                <span>{primarySlide.locationBadge}</span>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={ctaHref}
                  prefetch={!/^https?:\/\//i.test(ctaHref)}
                  className="inline-flex items-center gap-3 rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-[0_16px_40px_rgba(249,115,22,0.28)] transition-all hover:scale-[1.03] hover:bg-orange-600 active:scale-95"
                >
                  {primarySlide.ctaText}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                {primarySlide.moodTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {primarySlide.moodTags.slice(0, 3).map((tag) => (
                      <span
                        key={`${primarySlide.id}-${tag}`}
                        className="overlay-readable-text rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {resolvedSlides.length > 1 ? (
              <div className="overlay-readable-surface hidden rounded-[2rem] border border-white/12 bg-black/60 p-5 lg:block">
                <p className="text-xs font-bold uppercase tracking-[0.28em]">
                  More campaign drops
                </p>
                <div className="mt-6 space-y-4">
                  {resolvedSlides.slice(1, 4).map((slide, index) => (
                    <div key={slide.id} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
                      <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
                        {String(index + 2).padStart(2, "0")}
                      </p>
                      <p className="mt-2 text-sm font-semibold">{slide.title}</p>
                      <p className="mt-1 text-sm text-white/70">{slide.locationBadge}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
