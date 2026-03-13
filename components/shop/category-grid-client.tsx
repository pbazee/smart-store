"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { createBlurDataURL } from "@/lib/utils";
import type { HomepageCategory } from "@/types";

const CATEGORY_BLUR_PALETTES: Record<
  string,
  { from: string; to: string; accent: string }
> = {
  shoes: { from: "#7f1d1d", to: "#111827", accent: "#fb7185" },
  dresses: { from: "#7c2d12", to: "#f97316", accent: "#fed7aa" },
  jeans: { from: "#1e3a8a", to: "#1f2937", accent: "#93c5fd" },
  jackets: { from: "#0f172a", to: "#334155", accent: "#94a3b8" },
};

function getBlurDataUrl(category: HomepageCategory) {
  const palette =
    CATEGORY_BLUR_PALETTES[category.title.trim().toLowerCase()] ??
    CATEGORY_BLUR_PALETTES.jackets;

  return createBlurDataURL(palette);
}

export function CategoryGridClient({
  categories,
}: {
  categories: HomepageCategory[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-8 text-center"
      >
        <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
          Browse by Category
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
          Explore our curated collections across trending categories
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
          >
            <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(249,115,22,0.18)]">
              <Link
                href={category.link}
                aria-label={`Browse ${category.title}`}
                className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="sr-only">Browse {category.title}</span>
              </Link>

              <div className="relative h-full">
                <Image
                  src={category.imageUrl}
                  alt={
                    category.subtitle?.trim()
                      ? `${category.title} - ${category.subtitle}`
                      : `${category.title} collection`
                  }
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  placeholder="blur"
                  blurDataURL={getBlurDataUrl(category)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <Link
                    href={category.link}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition-all duration-200 hover:scale-[1.05] hover:brightness-110 hover:shadow-[0_20px_40px_rgba(249,115,22,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:w-auto"
                  >
                    {category.title}
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-6 flex justify-center sm:justify-end"
      >
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition-all hover:scale-[1.03] hover:bg-brand-600 hover:brightness-105 hover:shadow-[0_18px_36px_rgba(249,115,22,0.34)]"
        >
          View More Categories
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
}
