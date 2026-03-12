"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { testimonials } from "@/lib/site-content";

export function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-500">
          Customer Love
        </p>
        <h2 className="mt-4 font-display text-3xl font-black tracking-tight sm:text-5xl">
          Five-star energy from around Kenya
        </h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Realistic customer-style notes on fit, delivery, and how the pieces land once they hit
          the street.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {testimonials.map((review, index) => (
          <motion.article
            key={`${review.name}-${review.date}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            className="group rounded-[2rem] border border-border bg-card p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-300 text-sm font-black text-white">
                  {review.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{review.name}</p>
                  <p className="text-sm text-muted-foreground">{review.city}</p>
                </div>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {review.date}
              </p>
            </div>

            <div className="mt-5 flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <Star key={starIndex} className="h-4 w-4 fill-current" />
              ))}
            </div>

            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              &ldquo;{review.quote}&rdquo;
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
