"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/types";
import { ProductCard } from "@/components/shop/product-card";

export function FeaturedGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section id="home-shop" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-500">
            Popular picks
          </p>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">
            Popular Products
          </h2>
          <p className="mt-2 text-muted-foreground">
            Premium streetwear, clean sneakers, and city-ready layers loved by our community.
          </p>
        </div>
        <Link
          href="/shop?collection=popular"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold transition-colors hover:border-brand-300 hover:text-brand-600"
        >
          View Popular Products
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {products.slice(0, 8).map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}
