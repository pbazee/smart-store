"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import {
  createDemoBlogPost,
  deleteDemoBlogPost,
  getBlogPosts,
  updateDemoBlogPost,
} from "@/lib/blog-service";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import { deleteBlogImage, uploadBlogImage } from "@/lib/supabase-storage";
import { slugify } from "@/lib/utils";
import type { BlogPost } from "@/types";

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "Image is required")
  .refine(
    (value) => {
      if (value.startsWith("data:image/") || value.startsWith("/")) {
        return true;
      }

      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Image must be a valid URL or uploaded image." }
  );

const adminBlogSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Title is required").max(160, "Keep it under 160 characters"),
  slug: z.string().trim().min(2, "Slug is required").max(180, "Keep it under 180 characters"),
  content: z.string().trim().min(40, "Content is too short"),
  imageUrl: imageUrlSchema,
  isPublished: z.boolean().default(false),
});

export type AdminBlogInput = z.infer<typeof adminBlogSchema>;

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function normalizeBlogInput(input: AdminBlogInput) {
  const data = adminBlogSchema.parse(input);

  return {
    id: data.id,
    title: data.title.trim(),
    slug: slugify(data.slug || data.title),
    content: data.content.trim(),
    imageUrl: data.imageUrl.trim(),
    isPublished: data.isPublished,
  };
}

function revalidateBlogPaths(slugs: string[] = []) {
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin");
  revalidatePath("/admin/blogs");

  for (const slug of slugs.filter(Boolean)) {
    revalidatePath(`/blog/${slug}`);
  }
}

export async function fetchAdminBlogs() {
  await ensureAdmin();
  return getBlogPosts();
}

export async function uploadBlogImageAction(formData: FormData) {
  await ensureAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Please choose an image to upload.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported.");
  }

  const imageUrl = await uploadBlogImage(file);
  return { imageUrl };
}

export async function cleanupBlogImageAction(imageUrl: string) {
  await ensureAdmin();
  const normalizedImageUrl = z.string().trim().min(1).parse(imageUrl);

  await deleteBlogImage(normalizedImageUrl);
  return { cleaned: true };
}

export async function createAdminBlogAction(input: AdminBlogInput) {
  await ensureAdmin();
  const data = normalizeBlogInput(input);
  const publishedAt = data.isPublished ? new Date() : null;

  if (shouldUseMockData()) {
    const post = createDemoBlogPost({
      id: crypto.randomUUID(),
      title: data.title,
      slug: data.slug,
      content: data.content,
      imageUrl: data.imageUrl,
      isPublished: data.isPublished,
      publishedAt,
    });
    revalidateBlogPaths([data.slug]);
    return post;
  }

  const post = await prisma.blog.create({
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content,
      imageUrl: data.imageUrl,
      isPublished: data.isPublished,
      publishedAt,
    },
  });

  revalidateBlogPaths([data.slug]);
  return post as BlogPost;
}

export async function updateAdminBlogAction(input: AdminBlogInput) {
  await ensureAdmin();
  const data = adminBlogSchema.extend({ id: z.string().min(1) }).parse(input);
  const normalized = normalizeBlogInput(data);

  if (shouldUseMockData()) {
    const currentPost = getBlogPosts().then((posts) => posts.find((post) => post.id === data.id));
    const existingPost = await currentPost;
    const publishedAt =
      normalized.isPublished
        ? existingPost?.publishedAt
          ? new Date(existingPost.publishedAt)
          : new Date()
        : null;

    const post = updateDemoBlogPost(data.id, {
      id: data.id,
      title: normalized.title,
      slug: normalized.slug,
      content: normalized.content,
      imageUrl: normalized.imageUrl,
      isPublished: normalized.isPublished,
      publishedAt,
    });
    revalidateBlogPaths([existingPost?.slug || "", normalized.slug]);
    return post;
  }

  const existingPost = await prisma.blog.findUnique({
    where: { id: data.id },
  });
  if (!existingPost) {
    throw new Error("Blog post not found.");
  }

  const post = await prisma.blog.update({
    where: { id: data.id },
    data: {
      title: normalized.title,
      slug: normalized.slug,
      content: normalized.content,
      imageUrl: normalized.imageUrl,
      isPublished: normalized.isPublished,
      publishedAt: normalized.isPublished
        ? existingPost.publishedAt ?? new Date()
        : null,
    },
  });

  if (existingPost.imageUrl !== normalized.imageUrl) {
    await deleteBlogImage(existingPost.imageUrl);
  }

  revalidateBlogPaths([existingPost.slug, normalized.slug]);
  return post as BlogPost;
}

export async function deleteAdminBlogAction(blogId: string) {
  await ensureAdmin();
  const id = z.string().min(1).parse(blogId);

  if (shouldUseMockData()) {
    deleteDemoBlogPost(id);
    revalidateBlogPaths();
    return { deletedId: id };
  }

  const existingPost = await prisma.blog.findUnique({
    where: { id },
  });

  await prisma.blog.delete({
    where: { id },
  });

  if (existingPost?.imageUrl) {
    await deleteBlogImage(existingPost.imageUrl);
  }

  revalidateBlogPaths(existingPost?.slug ? [existingPost.slug] : []);
  return { deletedId: id };
}
