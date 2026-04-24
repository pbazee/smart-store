import Link from "next/link";
import { HomepageProductCard } from "@/components/shop/homepage-product-card";
import type { Product } from "@/types";

export function HomepageRecommendationSection({
  eyebrow,
  title,
  description,
  products,
  viewAllLabel,
  viewAllHref,
}: {
  eyebrow: string;
  title: string;
  description: string;
  products: Product[];
  viewAllLabel?: string;
  viewAllHref?: string;
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-500">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
        {viewAllHref && viewAllLabel ? (
          <Link
            href={viewAllHref}
            className="inline-flex w-fit items-center rounded-full border border-border px-5 py-3 text-sm font-semibold transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            {viewAllLabel}
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.slice(0, 4).map((product, index) => (
          <HomepageProductCard
            key={product.id}
            product={product}
            priority={index === 0}
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ))}
      </div>
    </section>
  );
}
