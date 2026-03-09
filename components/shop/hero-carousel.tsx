"use client";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    id: 1,
    headline: "Street-Ready.\nNairobi-Born.",
    sub: "New season drops every week. Fresh kicks, fire fits.",
    cta: "Shop Shoes",
    href: "/shop?category=shoes",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400",
    accent: "#f97316",
    bg: "from-zinc-950 to-zinc-800",
  },
  {
    id: 2,
    headline: "Dress Like\nYou Mean It.",
    sub: "Premium women's fashion. Ankara prints, linen sets, boss blazers.",
    cta: "Shop Women",
    href: "/shop?gender=women",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1400",
    accent: "#a855f7",
    bg: "from-purple-950 to-slate-900",
  },
  {
    id: 3,
    headline: "Streetwear\nfor the Culture.",
    sub: "Bombers, cargos, vintage tees. Represent your city.",
    cta: "Shop Streetwear",
    href: "/shop?tags=streetwear",
    image: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=1400",
    accent: "#22c55e",
    bg: "from-green-950 to-zinc-900",
  },
];

export function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000 }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => setSelectedIndex(emblaApi.selectedScrollSnap()));
  }, [emblaApi]);

  return (
    <section className="relative overflow-hidden h-[85vh] min-h-[500px] max-h-[800px]">
      <div ref={emblaRef} className="overflow-hidden h-full">
        <div className="flex h-full">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`flex-none w-full h-full relative bg-gradient-to-r ${slide.bg}`}
            >
              {/* Background image */}
              <Image
                src={slide.image}
                alt={slide.headline}
                fill
                priority={i === 0}
                className="object-cover opacity-40"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={selectedIndex === i ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-xl"
                  >
                    <p className="text-sm font-bold tracking-[0.2em] uppercase mb-4" style={{ color: slide.accent }}>
                      🇰🇪 Smartest Store KE
                    </p>
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-none whitespace-pre-line mb-6">
                      {slide.headline}
                    </h1>
                    <p className="text-lg text-white/80 mb-8 max-w-sm">{slide.sub}</p>
                    <Link
                      href={slide.href}
                      className="inline-flex items-center gap-2 px-8 py-4 font-bold text-black rounded-xl text-lg transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: slide.accent }}
                    >
                      {slide.cta}
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-white"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-white"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              selectedIndex === i ? "w-8 bg-white" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
