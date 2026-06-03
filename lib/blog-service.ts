import { DEFAULT_BLOG_POST_SEEDS, createBlogSeed } from "@/lib/default-blog-posts";
import { isProductionRuntime } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { BlogPost } from "@/types";

type BlogQueryOptions = {
  publishedOnly?: boolean;
  take?: number;
  fallbackOnError?: boolean;
};

import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";

const defaultBlogPostFallback = DEFAULT_BLOG_POST_SEEDS.map((seed) => createBlogSeed(seed));
let lastKnownBlogPosts: BlogPost[] = defaultBlogPostFallback;

// Explicit select to avoid P2022 on columns added in schema but not yet in DB.
// Once the migration runs (see SQL below), remove this select and let Prisma infer all columns.
// SQL to run in Supabase → SQL Editor:
//   ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "authorName" TEXT NOT NULL DEFAULT 'Smartest Store KE';
//   ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "authorAvatarUrl" TEXT;
//   ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
//   ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
//   ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "ogImage" TEXT;
//   ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "focusKeyword" TEXT;
//   ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT;
const BLOG_SELECT = {
  id: true,
  title: true,
  slug: true,
  content: true,
  imageUrl: true,
  isPublished: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

function rememberBlogPosts(posts: BlogPost[]) {
  if (posts.length > 0) {
    lastKnownBlogPosts = posts;
  }

  return posts;
}

function getBlogPostFallbackBySlug(slug: string) {
  return (
    lastKnownBlogPosts.find((post) => post.slug === slug) ??
    defaultBlogPostFallback.find((post) => post.slug === slug) ??
    null
  );
}

export async function getBlogPosts(options: BlogQueryOptions = {}): Promise<BlogPost[]> {
  const { publishedOnly = false, take, fallbackOnError = false } = options;

  if (shouldSkipLiveDataDuringBuild()) {
    return rememberBlogPosts(defaultBlogPostFallback);
  }

  try {
    const posts = await prisma.blog.findMany({
      select: BLOG_SELECT,
      where: publishedOnly ? { isPublished: true } : undefined,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take,
    });

    return rememberBlogPosts(posts as BlogPost[]);
  } catch (error) {
    console.error("Blog lookup failed:", error);

    if (isProductionRuntime()) {
      return lastKnownBlogPosts;
    }

    if (fallbackOnError) {
      return rememberBlogPosts(lastKnownBlogPosts.length > 0 ? lastKnownBlogPosts : defaultBlogPostFallback);
    }

    return lastKnownBlogPosts;
  }
}

export async function getPublishedBlogPosts(take?: number) {
  return getBlogPosts({
    publishedOnly: true,
    take,
    fallbackOnError: true,
  });
}

export async function getBlogPostBySlug(slug: string) {
  try {
    if (shouldSkipLiveDataDuringBuild()) {
      return getBlogPostFallbackBySlug(slug);
    }

    const post = await prisma.blog.findUnique({
      select: BLOG_SELECT,
      where: { slug },
    });

    const resolvedPost = (post as BlogPost | null) ?? getBlogPostFallbackBySlug(slug);
    if (resolvedPost) {
      rememberBlogPosts(
        Array.from(
          new Map([...lastKnownBlogPosts, resolvedPost].map((entry) => [entry.slug, entry])).values()
        )
      );
    }

    return resolvedPost;
  } catch (error) {
    console.error("Blog lookup by slug failed:", error);
    return isProductionRuntime() ? null : getBlogPostFallbackBySlug(slug);
  }
}

export async function getRelatedBlogPosts(post: BlogPost, take = 3) {
  const relatedTags = [post.category, ...(post.tags ?? [])].filter(Boolean) as string[];

  try {
    if (shouldSkipLiveDataDuringBuild()) {
      return defaultBlogPostFallback
        .filter((candidate) => candidate.slug !== post.slug)
        .slice(0, take);
    }

    const posts = await prisma.blog.findMany({
      select: BLOG_SELECT,
      where: {
        isPublished: true,
        slug: { not: post.slug },
        ...(relatedTags.length > 0
          ? {
              OR: [
                { category: { in: relatedTags, mode: "insensitive" } },
                { tags: { hasSome: relatedTags } },
              ],
            }
          : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take,
    });

    if (posts.length >= take || relatedTags.length === 0) {
      return posts as BlogPost[];
    }

    const recent = await prisma.blog.findMany({
      select: BLOG_SELECT,
      where: {
        isPublished: true,
        slug: { notIn: [post.slug, ...posts.map((candidate) => candidate.slug)] },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: take - posts.length,
    });

    return [...posts, ...recent] as BlogPost[];
  } catch (error) {
    console.error("Related blog lookup failed:", error);
    return lastKnownBlogPosts.filter((candidate) => candidate.slug !== post.slug).slice(0, take);
  }
}
