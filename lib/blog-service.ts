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
