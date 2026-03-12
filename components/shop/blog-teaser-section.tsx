import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getBlogExcerpt, getBlogReadTime } from "@/lib/default-blog-posts";
import { getPublishedBlogPosts } from "@/lib/blog-service";
import { createBlurDataURL } from "@/lib/utils";

export async function BlogTeaserSection() {
  noStore();

  const posts = await getPublishedBlogPosts(4);

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-500">
            Journal
          </p>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">
            Latest from the Blog
          </h2>
          <p className="mt-3 text-muted-foreground">
            Style notes, trend alerts, and smarter outfit ideas pulled straight from the latest edit.
          </p>
        </div>

        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
        >
          View all posts
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="group overflow-hidden rounded-[2rem] border border-border bg-card transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="relative h-56 overflow-hidden">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
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
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>{getBlogReadTime(post.content)}</span>
              </div>
              <h3 className="mt-4 text-2xl font-black tracking-tight">{post.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {getBlogExcerpt(post.content, 100)}
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
      </div>
    </section>
  );
}
