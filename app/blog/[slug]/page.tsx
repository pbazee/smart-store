import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { getBlogExcerpt, getBlogReadTime } from "@/lib/default-blog-posts";
import { getAppUrl } from "@/lib/app-url";
import { getBlogPostBySlug, getRelatedBlogPosts } from "@/lib/blog-service";
import { ShareButton } from "@/components/shared/share-button";
import { BlogNewsletterForm } from "@/components/blog/blog-newsletter-form";
import { sanitizeRichHtml } from "@/lib/rich-text";
import { createBlurDataURL } from "@/lib/utils";

export const revalidate = 60;

function buildAbsoluteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, getAppUrl()).toString();
}

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
      description: "Stories, style ideas, and updates from Smartest Store KE.",
    };
  }

  const postUrl = buildAbsoluteUrl(`/blog/${post.slug}`);
  const imageUrl = buildAbsoluteUrl(post.ogImage || post.imageUrl || "/og-image.jpg");
  const description = post.metaDescription || getBlogExcerpt(post.content, 160);
  const publishedTime = new Date(post.publishedAt || post.createdAt).toISOString();

  return {
    title: post.metaTitle || `${post.title} | Smartest Store KE`,
    description,
    alternates: {
      canonical: post.canonicalUrl || postUrl,
    },
    openGraph: {
      title: post.metaTitle || post.title,
      description,
      url: postUrl,
      siteName: "Smartest Store KE",
      type: "article",
      locale: "en_KE",
      publishedTime,
      images: [
        {
          url: imageUrl,
          alt: post.title,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || !post.isPublished) {
    notFound();
  }

  const postUrl = buildAbsoluteUrl(`/blog/${post.slug}`);
  const safeContent = sanitizeRichHtml(post.content);
  const relatedPosts = await getRelatedBlogPosts(post, 3);
  const publishedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-KE", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
            {post.category ? <span>{post.category}</span> : null}
            <span>{publishedDate}</span>
            <span>{getBlogReadTime(post.content)}</span>
            {(post.tags || []).slice(0, 3).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3">
            {post.authorAvatarUrl ? (
              <span className="relative h-12 w-12 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <Image src={post.authorAvatarUrl} alt="" fill sizes="48px" className="object-cover" />
              </span>
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-sm font-black text-white">
                {(post.authorName || "SS").slice(0, 2).toUpperCase()}
              </span>
            )}
            <div>
              <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                {post.authorName || "Smartest Store KE"}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Published {publishedDate} - {getBlogReadTime(post.content)}
              </p>
            </div>
          </div>
          <h1 className="mt-5 font-display text-4xl font-black tracking-tight text-zinc-950 sm:text-6xl dark:text-zinc-50">
            {post.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700 dark:text-zinc-400">
            {post.metaDescription || getBlogExcerpt(post.content, 220)}
          </p>
          <div className="mt-6">
            <ShareButton
              title={post.title}
              text={post.metaDescription || getBlogExcerpt(post.content, 160)}
              url={postUrl}
              label="Share article"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-brand-400 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
            />
          </div>
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

        <section className="mt-12 rounded-[2rem] border border-zinc-200 bg-white/95 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-none">
          <div
            className="rich-content max-w-none"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />
        </section>

        <section className="mt-10 rounded-[2rem] border border-orange-200 bg-orange-50 p-8 text-center dark:border-orange-500/20 dark:bg-orange-500/10">
          <h2 className="text-3xl font-black text-zinc-950 dark:text-white">Explore our collection</h2>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-700 dark:text-zinc-300">
            Find fresh pieces, easy layers, and standout accessories ready for your next look.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-brand-500 px-8 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(249,115,22,0.24)] transition hover:bg-brand-600"
          >
            Shop Now
          </Link>
        </section>

        {relatedPosts.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-2xl font-black text-zinc-950 dark:text-zinc-50">You might also like</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="relative block h-40">
                    <Image
                      src={relatedPost.imageUrl}
                      alt={relatedPost.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover"
                    />
                  </span>
                  <span className="block p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand-500">
                      {relatedPost.category || "Journal"}
                    </span>
                    <span className="mt-2 block text-base font-black text-zinc-950 dark:text-zinc-50">
                      {relatedPost.title}
                    </span>
                    <span className="mt-2 block text-sm text-zinc-600 dark:text-zinc-400">
                      {getBlogReadTime(relatedPost.content)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10 rounded-[2rem] border border-zinc-200 bg-zinc-950 p-6 text-white dark:border-zinc-800">
          <div className="grid gap-5 md:grid-cols-[1fr,auto] md:items-center">
            <div>
              <div className="flex items-center gap-2 text-orange-300">
                <Mail className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-[0.2em]">Style updates</p>
              </div>
              <h2 className="mt-3 text-2xl font-black">Get style updates in your inbox</h2>
            </div>
            <BlogNewsletterForm />
          </div>
        </section>
      </div>
    </article>
  );
}
