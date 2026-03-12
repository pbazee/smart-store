import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  getBlogExcerpt,
  getBlogReadTime,
} from "@/lib/default-blog-posts";
import { getPublishedBlogPosts } from "@/lib/blog-service";
import { createBlurDataURL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog | Smartest Store KE",
  description: "Style notes, Nairobi trend reports, and quick outfit guides from Smartest Store KE.",
};

export const revalidate = 0;

export default async function BlogPage() {
  noStore();

  const posts = await getPublishedBlogPosts();
  const [featuredPost, ...remainingPosts] = posts;

  return (
    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(249,250,251,1)_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-500">Journal</p>
          <h1 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-6xl">
            Streetwear notes from Nairobi and beyond
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Trend reports, styling tips, and quick reads built around how people are actually
            dressing right now.
          </p>
        </div>

        {!featuredPost ? (
          <div className="mt-12 rounded-[2.5rem] border border-border bg-card p-10 text-center">
            <h2 className="text-2xl font-black">Blog stories are coming soon</h2>
            <p className="mt-3 text-muted-foreground">
              Check back soon for styling guides, trend notes, and editorial picks.
            </p>
          </div>
        ) : (
          <>
            <section className="mt-12 overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
              <div className="grid lg:grid-cols-[1.15fr,0.85fr]">
                <div className="relative min-h-[320px]">
                  <Image
                    src={featuredPost.imageUrl}
                    alt={featuredPost.title}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={createBlurDataURL({
                      from: "#111827",
                      to: "#7c2d12",
                      accent: "#f97316",
                    })}
                  />
                </div>
                <div className="flex flex-col justify-between p-8 sm:p-10">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      <span>
                        {new Date(
                          featuredPost.publishedAt || featuredPost.createdAt
                        ).toLocaleDateString("en-KE", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>{getBlogReadTime(featuredPost.content)}</span>
                    </div>
                    <h2 className="mt-5 font-display text-3xl font-black tracking-tight sm:text-4xl">
                      {featuredPost.title}
                    </h2>
                    <p className="mt-4 text-base text-muted-foreground">
                      {getBlogExcerpt(featuredPost.content, 180)}
                    </p>
                  </div>

                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                  >
                    Read more
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>

            {remainingPosts.length > 0 && (
              <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {remainingPosts.map((post) => (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-[2rem] border border-border bg-card transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="relative h-56">
                      <Image
                        src={post.imageUrl}
                        alt={post.title}
                        fill
                        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL={createBlurDataURL({
                          from: "#111827",
                          to: "#451a03",
                          accent: "#f97316",
                        })}
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        <span>
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-KE", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span>{getBlogReadTime(post.content)}</span>
                      </div>
                      <h2 className="mt-4 text-2xl font-black tracking-tight">{post.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {getBlogExcerpt(post.content, 140)}
                      </p>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
                      >
                        Read more
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
