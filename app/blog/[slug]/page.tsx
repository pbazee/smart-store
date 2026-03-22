import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getBlogContentBlocks,
  getBlogExcerpt,
  getBlogReadTime,
} from "@/lib/default-blog-posts";
import { getBlogPostBySlug } from "@/lib/blog-service";
import { createBlurDataURL } from "@/lib/utils";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || !post.isPublished) {
    return {
      title: "Blog | Smartest Store KE",
    };
  }

  return {
    title: `${post.title} | Smartest Store KE`,
    description: getBlogExcerpt(post.content, 160),
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  noStore();

  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || !post.isPublished) {
    notFound();
  }

  const blocks = getBlogContentBlocks(post.content);

  return (
    <article className="bg-[linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(248,250,252,1)_100%)] dark:bg-[linear-gradient(180deg,_rgba(9,9,11,1)_0%,_rgba(15,23,42,1)_100%)]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
            <span>
              {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-KE", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>{getBlogReadTime(post.content)}</span>
          </div>
          <h1 className="mt-5 font-display text-4xl font-black tracking-tight text-zinc-950 sm:text-6xl dark:text-zinc-50">
            {post.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700 dark:text-zinc-400">
            {getBlogExcerpt(post.content, 220)}
          </p>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <div className="relative h-[320px] sm:h-[460px]">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              sizes="100vw"
              className="object-cover"
              placeholder="blur"
              blurDataURL={createBlurDataURL({
                from: "#111827",
                to: "#7c2d12",
                accent: "#f97316",
              })}
            />
          </div>
        </div>

        <div className="mt-12 space-y-6">
          {blocks.map((block, index) =>
            block.type === "heading" ? (
              <section
                key={`${block.type}-${index}`}
                className="rounded-[2rem] border border-zinc-200 bg-white/95 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-none"
              >
                <h2 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">{block.text}</h2>
              </section>
            ) : (
              <section
                key={`${block.type}-${index}`}
                className="rounded-[2rem] border border-zinc-200 bg-white/95 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-none"
              >
                <p className="text-base leading-8 text-zinc-700 dark:text-zinc-400">{block.text}</p>
              </section>
            )
          )}
        </div>
      </div>
    </article>
  );
}
