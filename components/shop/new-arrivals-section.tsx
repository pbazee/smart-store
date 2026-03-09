"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Product } from "@/types";
import { ProductCard } from "./product-card";
import { Sparkles } from "lucide-react";

export function NewArrivalsSection({ products }: { products: Product[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <span className="text-brand-500 font-bold text-sm uppercase tracking-widest">Just Dropped</span>
          </div>
          <h2 className="text-3xl font-black">New Arrivals</h2>
        </div>
        <Link href="/shop?tags=new-arrival" className="text-brand-500 font-semibold hover:underline text-sm">
          View All →
        </Link>
      </motion.div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.slice(0, 8).map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>
    </section>
  );
}
