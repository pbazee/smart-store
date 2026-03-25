"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import type { Product } from "@/types";
import { ProductCard } from "@/components/shop/product-card";

export function TrendingSection({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_28%),linear-gradient(180deg,_rgba(9,9,11,1)_0%,_rgba(15,23,42,1)_100%)] py-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-2xl">
            <div className="overlay-readable-text flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.24em]">
                Trending in Nairobi
              </span>
            </div>
            <h2 className="overlay-readable-text mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">
              The pieces moving fastest this week
            </h2>
            <p className="overlay-readable-text mt-2 text-sm sm:text-base">
              What the city is wearing now: clean silhouettes, statement color, and easy daily
              rotation energy.
            </p>
          </div>
          <Link
            href="/shop?collection=trending"
            className="overlay-readable-text inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition-colors hover:border-brand-300"
          >
            View Trending
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.slice(0, 8).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
