"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Category } from "@/types";

export function CategoryGridClient({
  categories,
}: {
  categories: Category[];
}) {
  const topLevel = categories.filter((c) => !c.parentId && c.isActive !== false);
  const byParent = new Map<string | null, Category[]>();

  categories
    .filter((c) => c.isActive !== false)
    .forEach((c) => {
      const key = c.parentId ?? null;
      byParent.set(key, [...(byParent.get(key) || []), c]);
    });

  byParent.forEach((list, key) => {
    byParent.set(
      key,
      list.sort((a, b) =>
        (a.order ?? 0) === (b.order ?? 0) ? a.name.localeCompare(b.name) : (a.order ?? 0) - (b.order ?? 0)
      )
    );
  });

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
          Explore curated collections with subcategories ready for deep dives.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topLevel.map((category, index) => {
          const children = byParent.get(category.id) || [];
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
            >
              <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-5 shadow-[0_18px_38px_rgba(15,23,42,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(249,115,22,0.18)]">
                <Link
                  href={`/shop?category=${category.id}`}
                  aria-label={`Browse ${category.name}`}
                  className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="sr-only">Browse {category.name}</span>
                </Link>

                <div className="relative flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                      {category.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="rounded-full bg-zinc-800/70 px-3 py-1 text-xs font-semibold text-zinc-200">
                      {children.length > 0 ? `${children.length} sub` : "Top level"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{category.name}</h3>
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {category.description || "Fresh picks curated for Kenyan shoppers."}
                    </p>
                  </div>

                  {children.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {children.slice(0, 6).map((child) => (
                        <span
                          key={child.id}
                          className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-200"
                        >
                          {child.name}
                        </span>
                      ))}
                      {children.length > 6 && (
                        <span className="text-xs text-zinc-400">
                          +{children.length - 6} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <Link
                      href={`/shop?category=${category.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition-all hover:translate-x-[1px] hover:brightness-110"
                    >
                      Shop {category.name}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <span className="text-[11px] text-zinc-500 uppercase tracking-[0.22em]">
                      {category.slug}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
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
