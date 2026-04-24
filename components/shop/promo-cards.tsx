import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getActivePromoBanners } from "@/lib/promo-banner-service";
import { createBlurDataURL } from "@/lib/utils";

function createPromoBannerBlur(backgroundColor?: string | null) {
  const base = backgroundColor || "#111827";
  return createBlurDataURL({
    from: base,
    to: "#0f172a",
    accent: "#f97316",
  });
}

export async function PromoCards() {
  const promos = await getActivePromoBanners();

  if (promos.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-2">
        {promos.map((promo) => (
          <article
            key={promo.id}
            className="group relative isolate overflow-hidden rounded-[2rem] bg-neutral-950 shadow-[0_28px_70px_rgba(15,23,42,0.14)]"
            style={{ backgroundColor: promo.backgroundColor || "#111827" }}
          >
            <div className="relative min-h-[320px] sm:min-h-[360px]">
              {promo.backgroundImageUrl ? (
                <Image
                  src={promo.backgroundImageUrl}
                  alt={`${promo.title} promotional banner`}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={80}
                  placeholder="blur"
                  blurDataURL={createPromoBannerBlur(promo.backgroundColor)}
                  className="object-cover object-center transition duration-700 group-hover:scale-105 group-hover:brightness-110"
                />
              ) : null}
              <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.52)_48%,rgba(0,0,0,0.2)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_28%)] opacity-90" />

              <div className="relative z-10 flex h-full items-end p-7 sm:p-9">
                <div className="max-w-sm">
                  <p className="overlay-readable-text text-xs font-bold uppercase tracking-[0.28em]">
                    {promo.badgeText || "Curated edit"}
                  </p>
                  <h3 className="overlay-readable-text mt-4 font-display text-3xl font-black tracking-tight sm:text-4xl">
                    {promo.title}
                  </h3>
                  <p className="overlay-readable-text mt-3 text-sm sm:text-base">
                    {promo.subtitle}
                  </p>
                  {promo.ctaText && promo.ctaLink ? (
                    <Link
                      href={promo.ctaLink}
                      className="mt-7 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-[0_16px_35px_rgba(249,115,22,0.28)] transition-all hover:gap-3 hover:bg-orange-600"
                    >
                      {promo.ctaText}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
