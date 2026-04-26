import type { Metadata } from "next";
import { MapPin, Shirt, Sparkles, Truck } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Smartest Store KE",
  description: "Learn more about Smartest Store KE and the Nairobi-first streetwear experience behind the store.",
};

export const dynamic = "force-static";

const pillars = [
  {
    title: "Nairobi-first curation",
    description:
      "We build around the pace, climate, and visual language of the city, so the product mix feels useful before it feels trendy.",
    icon: MapPin,
  },
  {
    title: "Streetwear with range",
    description:
      "From easy basics to louder statement pieces, the goal is a catalog that lets customers build full looks instead of isolated buys.",
    icon: Shirt,
  },
  {
    title: "Fast local delivery",
    description:
      "Same-day Nairobi delivery and mobile-friendly checkout are treated as part of the fashion experience, not an afterthought.",
    icon: Truck,
  },
  {
    title: "Constantly refreshed",
    description:
      "New arrivals, trend edits, and styling content keep the storefront feeling current even between major drops.",
    icon: Sparkles,
  },
];

export default function AboutUsPage() {
  return (
    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(249,250,251,1)_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_28%),linear-gradient(180deg,_rgba(10,10,10,1)_0%,_rgba(24,24,27,1)_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-500">About Us</p>
          <h1 className="mt-4 font-display text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-6xl">
            A Nairobi-born fashion storefront built for movement
          </h1>
          <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-300">
            Smartest Store KE blends streetwear, smart curation, and locally relevant delivery into
            one clean shopping experience for customers across Kenya.
          </p>
        </div>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-[2rem] border border-border bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-[0_18px_40px_rgba(0,0,0,0.25)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
                <pillar.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                {pillar.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                {pillar.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-[2.5rem] border border-border bg-zinc-950 p-8 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
            What we care about
          </p>
          <h2 className="mt-4 font-display text-3xl font-black tracking-tight sm:text-4xl">
            Clean navigation, fast checkout, and a stronger editorial point of view
          </h2>
          <p className="mt-5 max-w-3xl text-white/78">
            The best storefronts do more than list products. They guide taste, reduce friction, and
            keep the customer in motion from inspiration to delivery confirmation.
          </p>
        </section>
      </div>
    </div>
  );
}
