import { blogPosts as staticBlogPosts } from "@/lib/site-content";
import { convertLegacyRichTextToHtml, getExcerptFromRichText, stripHtml } from "@/lib/rich-text";
import type { BlogPost } from "@/types";

export type BlogSeed = Omit<BlogPost, "createdAt" | "updatedAt">;

function createSeedContent(content: Array<{ heading: string; paragraphs: string[] }>) {
  return content
    .map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n"))
    .join("\n\n");
}

export const DEFAULT_BLOG_POST_SEEDS: BlogSeed[] = staticBlogPosts.map((post) => {
  const legacyContent = createSeedContent(post.content);

  return {
    id: `seed-blog-${post.slug}`,
    title: post.title,
    slug: post.slug,
    content: convertLegacyRichTextToHtml(legacyContent),
    imageUrl: post.image,
    metaTitle: post.title,
    metaDescription: getExcerptFromRichText(legacyContent, 160),
    ogImage: post.image,
    focusKeyword: post.title,
    canonicalUrl: "",
    isPublished: true,
    publishedAt: new Date(post.publishedAt),
  };
});

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
  return getExcerptFromRichText(content, maxLength);
}

export function getBlogReadTime(content: string) {
  const wordCount = stripHtml(convertLegacyRichTextToHtml(content))
    .split(/\s+/)
    .filter(Boolean).length;

  return `${Math.max(1, Math.ceil(wordCount / 180))} min read`;
}

export function getBlogContentBlocks(content: string) {
  return convertLegacyRichTextToHtml(content);
}
