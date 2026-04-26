import { Suspense } from "react";
import { CatalogBrowser } from "@/components/shop/catalog-browser";
import { getActiveCategories } from "@/lib/category-service";
import { getProducts } from "@/lib/data-service";
import { popularBrands } from "@/lib/site-content";

export const revalidate = 300;

export default async function BrandsPage() {
  const [products, categories] = await Promise.all([getProducts(), getActiveCategories()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-500">
          Brand Directory
        </p>
        <h1 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-5xl">
          City-led labels and curated house favorites
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Explore the storefront through brand worlds with different moods, styling cues, and
          customer energy.
        </p>
      </div>

      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {popularBrands.map((brand) => (
          <article
            key={brand.anchor}
            id={brand.anchor}
            className="rounded-[2rem] border border-border bg-card p-6 shadow-[0_18px_36px_rgba(15,23,42,0.04)]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-500">Brand</p>
            <h2 className="mt-4 text-2xl font-black tracking-tight">{brand.name}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{brand.description}</p>
          </article>
        ))}
      </section>

      <div className="mt-12">
        <Suspense>
          <CatalogBrowser heading="Brands" products={products} categories={categories} />
        </Suspense>
      </div>
    </div>
  );
}
