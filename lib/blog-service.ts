import { DEFAULT_BLOG_POST_SEEDS, createBlogSeed } from "@/lib/default-blog-posts";
import { prisma } from "@/lib/prisma";
import type { BlogPost } from "@/types";

type BlogQueryOptions = {
  publishedOnly?: boolean;
  take?: number;
  fallbackOnError?: boolean;
};

import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";

export async function getBlogPosts(options: BlogQueryOptions = {}): Promise<BlogPost[]> {
  const { publishedOnly = false, take, fallbackOnError = false } = options;

  if (shouldSkipLiveDataDuringBuild()) {
    return DEFAULT_BLOG_POST_SEEDS.map((seed) => createBlogSeed(seed));
  }

  try {
    const posts = await prisma.blog.findMany({
      where: publishedOnly ? { isPublished: true } : undefined,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take,
    });

    return posts as BlogPost[];
  } catch (error) {
    console.error("Blog lookup failed:", error);

    if (fallbackOnError) {
      return DEFAULT_BLOG_POST_SEEDS.map((seed) => createBlogSeed(seed));
    }

    return [];
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
    const post = await prisma.blog.findUnique({
      where: { slug },
    });

    return (post as BlogPost | null) ?? null;
  } catch (error) {
    console.error("Blog lookup by slug failed:", error);
    return null;
  }
}
