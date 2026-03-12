import { DEFAULT_BLOG_POST_SEEDS, createBlogSeed } from "@/lib/default-blog-posts";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { BlogPost } from "@/types";

type BlogQueryOptions = {
  publishedOnly?: boolean;
  take?: number;
  fallbackOnError?: boolean;
};

let demoBlogPostsState: BlogPost[] = DEFAULT_BLOG_POST_SEEDS.map((seed, index) =>
  createBlogSeed(seed, new Date(`2026-01-0${index + 1}T09:00:00.000Z`))
);

function cloneBlogPost(post: BlogPost): BlogPost {
  return {
    ...post,
    publishedAt: post.publishedAt instanceof Date ? new Date(post.publishedAt) : post.publishedAt,
    createdAt: post.createdAt instanceof Date ? new Date(post.createdAt) : post.createdAt,
    updatedAt: post.updatedAt instanceof Date ? new Date(post.updatedAt) : post.updatedAt,
  };
}

function sortBlogPosts(posts: BlogPost[]) {
  return [...posts].sort((left, right) => {
    const leftDate = new Date(left.publishedAt || left.createdAt).getTime();
    const rightDate = new Date(right.publishedAt || right.createdAt).getTime();
    return rightDate - leftDate;
  });
}

export function getDemoBlogPosts(options: BlogQueryOptions = {}) {
  const { publishedOnly = false, take } = options;
  const posts = publishedOnly
    ? demoBlogPostsState.filter((post) => post.isPublished)
    : demoBlogPostsState;
  const sorted = sortBlogPosts(posts).map(cloneBlogPost);

  return typeof take === "number" ? sorted.slice(0, take) : sorted;
}

export function createDemoBlogPost(input: Omit<BlogPost, "createdAt" | "updatedAt">) {
  const now = new Date();
  const nextPost: BlogPost = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  demoBlogPostsState = sortBlogPosts([nextPost, ...demoBlogPostsState]);
  return cloneBlogPost(nextPost);
}

export function updateDemoBlogPost(
  blogId: string,
  input: Omit<BlogPost, "createdAt" | "updatedAt">
) {
  const currentPost = demoBlogPostsState.find((post) => post.id === blogId);
  if (!currentPost) {
    throw new Error("Blog post not found");
  }

  const nextPost: BlogPost = {
    ...input,
    createdAt: currentPost.createdAt,
    updatedAt: new Date(),
  };

  demoBlogPostsState = sortBlogPosts(
    demoBlogPostsState.map((post) => (post.id === blogId ? nextPost : post))
  );

  return cloneBlogPost(nextPost);
}

export function deleteDemoBlogPost(blogId: string) {
  demoBlogPostsState = demoBlogPostsState.filter((post) => post.id !== blogId);
}

export async function getBlogPosts(options: BlogQueryOptions = {}): Promise<BlogPost[]> {
  const { publishedOnly = false, take, fallbackOnError = false } = options;

  if (shouldUseMockData()) {
    return getDemoBlogPosts({ publishedOnly, take });
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
  if (shouldUseMockData()) {
    return getDemoBlogPosts().find((post) => post.slug === slug) ?? null;
  }

  try {
    const post = await prisma.blog.findUnique({
      where: { slug },
    });

    return (post as BlogPost | null) ?? null;
  } catch (error) {
    console.error("Blog lookup by slug failed:", error);
    return DEFAULT_BLOG_POST_SEEDS.map((seed) => createBlogSeed(seed)).find((post) => post.slug === slug) ?? null;
  }
}
