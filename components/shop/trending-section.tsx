"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Product } from "@/types";
import { ProductCard } from "./product-card";
import { TrendingUp } from "lucide-react";

export function TrendingSection({ products }: { products: Product[] }) {
  return (
    <section className="bg-zinc-950 dark:bg-zinc-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              <span className="text-brand-500 font-bold text-sm uppercase tracking-widest">Trending</span>
            </div>
            <h2 className="text-3xl font-black text-white">What&apos;s Hot in Nairobi</h2>
          </div>
          <Link href="/shop?tags=trending" className="text-brand-400 font-semibold hover:underline text-sm">
            View All →
          </Link>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 4).map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
