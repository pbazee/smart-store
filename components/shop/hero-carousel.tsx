"use client";

import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { heroSlides } from "@/lib/site-content";
import { createBlurDataURL } from "@/lib/utils";

export function HeroCarousel() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
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

  return (
    <section className="relative isolate overflow-hidden bg-neutral-950">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {heroSlides.map((slide, index) => (
            <div key={slide.id} className="min-w-0 flex-[0_0_100%]">
              <div className="relative min-h-[70vh] sm:min-h-[78vh]">
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL={createBlurDataURL({
                    from: slide.gradientFrom,
                    to: slide.gradientTo,
                    accent: "#ffffff",
                  })}
                  className="object-cover object-center"
                />

                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.42)_44%,rgba(0,0,0,0.18)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_30%)]" />

                <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-7xl items-end px-4 pb-20 pt-24 sm:px-6 lg:min-h-[78vh] lg:px-8">
                  <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: selectedIndex === index ? 1 : 0.7,
                        y: selectedIndex === index ? 0 : 14,
                      }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="max-w-2xl"
                    >
                      <span className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.28em] text-orange-300 backdrop-blur">
                        {slide.eyebrow}
                      </span>
                      <h1 className="font-display text-4xl font-black leading-[0.92] text-white sm:text-5xl lg:text-7xl">
                        {slide.title}
                        <br />
                        <span className="text-orange-400">{slide.highlight}</span>
                      </h1>
                      <p className="mt-5 max-w-xl text-base text-white/78 sm:text-lg">
                        {slide.description}
                      </p>
                      <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 backdrop-blur">
                        <MapPin className="h-3.5 w-3.5 text-orange-300" />
                        {slide.location}
                      </div>
                      <div className="mt-8">
                        <Link
                          href={slide.href}
                          className="inline-flex items-center gap-3 rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-[0_16px_40px_rgba(249,115,22,0.28)] transition-all hover:scale-[1.03] hover:bg-orange-600 active:scale-95"
                        >
                          Explore Product
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={false}
                      animate={{
                        opacity: selectedIndex === index ? 1 : 0.55,
                        y: selectedIndex === index ? 0 : 18,
                      }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="hidden rounded-[2rem] border border-white/12 bg-white/8 p-5 text-white backdrop-blur-lg lg:block"
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/45">
                        Summer Focus
                      </p>
                      <div className="mt-6 space-y-5">
                        <div>
                          <p className="text-3xl font-black">{String(index + 1).padStart(2, "0")}</p>
                          <p className="mt-1 text-sm text-white/60">Current slide</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Mood</p>
                          <p className="mt-1 text-sm text-white/65">{slide.accent} palette with clean streetwear layering</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Best for</p>
                          <p className="mt-1 text-sm text-white/65">
                            Warm afternoons, city movement, and late golden-hour plans.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-4 pb-6 sm:px-6 lg:px-8">
          <div className="pointer-events-auto flex items-center gap-2">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  selectedIndex === index ? "w-10 bg-orange-500" : "w-2.5 bg-white/45 hover:bg-white/70"
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
