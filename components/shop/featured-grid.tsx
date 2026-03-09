"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Product } from "@/types";
import { ProductCard } from "./product-card";

export function FeaturedGrid({ products }: { products: Product[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 className="text-3xl font-black">Featured Picks 🔥</h2>
          <p className="text-muted-foreground mt-1">Handpicked by our Nairobi stylists</p>
        </div>
        <Link href="/shop" className="text-brand-500 font-semibold hover:underline text-sm">
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
