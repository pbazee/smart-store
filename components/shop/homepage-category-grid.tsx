import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { resolveCatalogListingHref } from "@/lib/catalog-routing";
import { createBlurDataURL } from "@/lib/utils";
import type { HomepageCategory } from "@/types";

const categoryBlurDataUrl = createBlurDataURL({
  from: "#0f172a",
  to: "#f97316",
  accent: "#f8fafc",
});

export function HomepageCategoryGrid({
  categories,
}: {
  categories: HomepageCategory[];
}) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="font-display text-4xl font-black tracking-tight sm:text-5xl">
          Shop by Category
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
          Hand-picked collections designed for the modern Kenyan lifestyle.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const href = resolveCatalogListingHref(category.link);

          return (
            <article
              key={category.id}
              className="group relative isolate aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-neutral-900 shadow-[0_32px_80px_rgba(0,0,0,0.22)]"
            >
              <Image
                src={category.imageUrl}
                alt={category.title}
                fill
                loading="lazy"
                placeholder="blur"
                blurDataURL={categoryBlurDataUrl}
                className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={80}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity group-hover:opacity-90" />

              <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-10">
                <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                  <h3 className="font-display text-3xl font-black text-white sm:text-4xl">
                    {category.title}
                  </h3>
                  {category.subtitle && (
                    <p className="mt-2 text-sm font-medium text-zinc-300 sm:text-base">
                      {category.subtitle}
                    </p>
                  )}
                  <div className="mt-6 flex items-center gap-2 overflow-hidden">
                    <Link
                      href={href}
                      className="group-link flex items-center gap-2 text-sm font-black uppercase tracking-[0.15em] text-white"
                    >
                      Explore Now
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)] transition-transform group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-3 rounded-full border border-border bg-background px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-foreground transition-all hover:border-orange-500/50 hover:bg-orange-500/5 hover:text-orange-600"
        >
          View More Products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
