import { blogPosts as staticBlogPosts } from "@/lib/site-content";
import type { BlogPost } from "@/types";

export type BlogSeed = Omit<BlogPost, "createdAt" | "updatedAt">;

function createSeedContent(content: Array<{ heading: string; paragraphs: string[] }>) {
  return content
    .map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n"))
    .join("\n\n");
}

export const DEFAULT_BLOG_POST_SEEDS: BlogSeed[] = staticBlogPosts.map((post) => ({
  id: `seed-blog-${post.slug}`,
  title: post.title,
  slug: post.slug,
  content: createSeedContent(post.content),
  imageUrl: post.image,
  isPublished: true,
  publishedAt: new Date(post.publishedAt),
}));

export function createBlogSeed(
  seed: BlogSeed,
  timestamp = new Date("2026-01-01T00:00:00.000Z")
): BlogPost {
  return {
    ...seed,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function getBlogExcerpt(content: string, maxLength = 100) {
  const plainText = content
    .replace(/^##\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function getBlogReadTime(content: string) {
  const wordCount = content
    .replace(/^##\s+/gm, "")
    .split(/\s+/)
    .filter(Boolean).length;

  return `${Math.max(1, Math.ceil(wordCount / 180))} min read`;
}

export function getBlogContentBlocks(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) =>
      block.startsWith("## ")
        ? { type: "heading" as const, text: block.replace(/^##\s+/, "").trim() }
        : { type: "paragraph" as const, text: block.trim() }
    );
}
