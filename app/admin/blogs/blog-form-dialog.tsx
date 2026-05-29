"use client";

import { useEffect, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";
import {
  cleanupBlogImageAction,
  createAdminBlogAction,
  updateAdminBlogAction,
  uploadBlogImageAction,
  type AdminBlogInput,
} from "@/app/admin/blogs/actions";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { convertLegacyRichTextToHtml } from "@/lib/rich-text";
import { useToast } from "@/lib/use-toast";
import { slugify } from "@/lib/utils";
import type { BlogPost } from "@/types";

const BLOG_SHARE_BASE_URL = "https://smart-store-iota.vercel.app";

type BlogFormState = {
  id?: string;
  title: string;
  slug: string;
  content: string;
  imageUrl: string;
  authorName: string;
  authorAvatarUrl: string;
  category: string;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  focusKeyword: string;
  canonicalUrl: string;
  isPublished: boolean;
};

function createEmptyFormState(): BlogFormState {
  return {
    title: "",
    slug: "",
    content: "<p></p>",
    imageUrl: "",
    authorName: "Smartest Store KE",
    authorAvatarUrl: "",
    category: "",
    tags: "",
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
    focusKeyword: "",
    canonicalUrl: "",
    isPublished: false,
  };
}

function createFormState(post?: BlogPost | null): BlogFormState {
  if (!post) {
    return createEmptyFormState();
  }

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: convertLegacyRichTextToHtml(post.content),
    imageUrl: post.imageUrl,
    authorName: post.authorName || "Smartest Store KE",
    authorAvatarUrl: post.authorAvatarUrl || "",
    category: post.category || "",
    tags: (post.tags || []).join(", "),
    metaTitle: post.metaTitle || "",
    metaDescription: post.metaDescription || "",
    ogImage: post.ogImage || "",
    focusKeyword: post.focusKeyword || "",
    canonicalUrl: post.canonicalUrl || "",
    isPublished: post.isPublished,
  };
}

function toPayload(form: BlogFormState, imageUrl: string): AdminBlogInput {
  return {
    id: form.id,
    title: form.title.trim(),
    slug: slugify(form.slug || form.title),
    content: form.content.trim(),
    imageUrl,
    authorName: form.authorName.trim() || "Smartest Store KE",
    authorAvatarUrl: form.authorAvatarUrl.trim(),
    category: form.category.trim(),
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    metaTitle: form.metaTitle.trim(),
    metaDescription: form.metaDescription.trim(),
    ogImage: form.ogImage.trim(),
    focusKeyword: form.focusKeyword.trim(),
    canonicalUrl: form.canonicalUrl.trim(),
    isPublished: form.isPublished,
  };
}

function CharacterCount({
  current,
  limit,
}: {
  current: number;
  limit: number;
}) {
  const over = current > limit;

  return (
    <span className={`text-xs ${over ? "text-red-400" : "text-zinc-500"}`}>
      {current}/{limit}
    </span>
  );
}

export function BlogFormDialog({
  open,
  post,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  post: BlogPost | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (post: BlogPost) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<BlogFormState>(() => createFormState(post));
  const [previewUrl, setPreviewUrl] = useState(form.imageUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    const nextForm = createFormState(post);
    setForm(nextForm);
    setPreviewUrl(nextForm.imageUrl);
    setSelectedFile(null);
    setSlugTouched(Boolean(post));
  }, [open, post]);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        let uploadedImageUrl: string | null = null;

        try {
          let imageUrl = form.imageUrl.trim();

          if (selectedFile) {
            const uploadFormData = new FormData();
            uploadFormData.append("file", selectedFile);
            const uploadResult = await uploadBlogImageAction(uploadFormData);
            uploadedImageUrl = uploadResult.imageUrl;
            imageUrl = uploadedImageUrl;
          }

          if (!imageUrl) {
            throw new Error("Please upload a featured image before saving.");
          }

          const payload = toPayload(form, imageUrl);
          const savedPost = form.id
            ? await updateAdminBlogAction(payload)
            : await createAdminBlogAction(payload);

          onSaved(savedPost);
          onOpenChange(false);
          toast({
            title: "Saved successfully",
            description: "The blog content and metadata are now updated.",
          });
        } catch (error) {
          if (uploadedImageUrl) {
            try {
              await cleanupBlogImageAction(uploadedImageUrl);
            } catch (cleanupError) {
              console.error("Blog image cleanup failed:", cleanupError);
            }
          }

          toast({
            title: "Save failed",
            description:
              error instanceof Error ? error.message : "Please review the form and try again.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{post ? "Edit blog post" : "Create new blog post"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Publish styled editorial content with search and social metadata in one place.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),320px]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="font-medium text-zinc-300">Title</span>
                  <input
                    required
                    value={form.title}
                    onChange={(event) => {
                      const title = event.target.value;
                      setForm((current) => ({
                        ...current,
                        title,
                        metaTitle: current.metaTitle || title,
                        slug: slugTouched ? current.slug : slugify(title),
                      }));
                    }}
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                  />
                </label>

                <label className="space-y-2 text-sm md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-zinc-300">Slug</span>
                    <span className="text-xs text-zinc-500">
                      {BLOG_SHARE_BASE_URL}/blog/{form.slug || "post-slug"}
                    </span>
                  </div>
                  <input
                    required
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setForm((current) => ({ ...current, slug: slugify(event.target.value) }));
                    }}
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-zinc-300">Author name</span>
                  <input
                    required
                    value={form.authorName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, authorName: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-zinc-300">Author avatar URL</span>
                  <input
                    value={form.authorAvatarUrl}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, authorAvatarUrl: event.target.value }))
                    }
                    placeholder="Optional image URL"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-600"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-zinc-300">Category</span>
                  <input
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, category: event.target.value }))
                    }
                    placeholder="Style Guide"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-600"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-zinc-300">Tags</span>
                  <input
                    value={form.tags}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, tags: event.target.value }))
                    }
                    placeholder="streetwear, shoes, nairobi"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-600"
                  />
                </label>

                <div className="space-y-2 text-sm md:col-span-2">
                  <span className="font-medium text-zinc-300">Featured image</span>
                  <label className="flex cursor-pointer items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-zinc-700 bg-black/60 px-4 py-5 text-sm text-zinc-300 transition-colors hover:border-brand-400 hover:text-white">
                    <ImagePlus className="h-4 w-4" />
                    <span>{selectedFile ? selectedFile.name : "Choose blog cover image"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setSelectedFile(file);
                      }}
                    />
                  </label>
                </div>

                <label className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-300">Meta title</span>
                    <CharacterCount current={form.metaTitle.length} limit={60} />
                  </div>
                  <input
                    value={form.metaTitle}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, metaTitle: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-zinc-300">Focus keyword</span>
                  <input
                    value={form.focusKeyword}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, focusKeyword: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                  />
                </label>

                <label className="space-y-2 text-sm md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-300">Meta description</span>
                    <CharacterCount current={form.metaDescription.length} limit={160} />
                  </div>
                  <textarea
                    rows={3}
                    value={form.metaDescription}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, metaDescription: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-zinc-300">OG image URL</span>
                  <input
                    value={form.ogImage}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, ogImage: event.target.value }))
                    }
                    placeholder="Defaults to featured image if empty"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-zinc-300">Canonical URL</span>
                  <input
                    value={form.canonicalUrl}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, canonicalUrl: event.target.value }))
                    }
                    placeholder="Optional"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                  />
                </label>
              </div>

              <div className="space-y-2 text-sm">
                <span className="font-medium text-zinc-300">Content</span>
                <RichTextEditor value={form.content} onChange={(content) => setForm((current) => ({ ...current, content }))} />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, isPublished: event.target.checked }))
                  }
                />
                Publish this post
              </label>
            </div>

            <aside className="space-y-5 rounded-[1.75rem] border border-zinc-800 bg-black/40 p-5">
              <p className="text-sm font-medium text-zinc-300">Preview</p>
              <div
                className="relative min-h-[220px] overflow-hidden rounded-2xl bg-zinc-900"
                style={
                  previewUrl
                    ? {
                        backgroundImage: `url("${previewUrl}")`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }
                    : undefined
                }
              />
              <div className="space-y-3 text-sm text-zinc-400">
                <div>
                  <p className="font-medium text-zinc-300">Headline</p>
                  <p className="mt-1 text-base text-zinc-100">{form.title || "Post title"}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-300">Byline</p>
                  <p className="mt-1 text-zinc-200">
                    {form.authorName || "Smartest Store KE"}
                    {form.category ? ` - ${form.category}` : ""}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-zinc-300">Meta title</p>
                  <p className="mt-1 text-zinc-200">{form.metaTitle || form.title || "Meta title"}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-300">Meta description</p>
                  <p className="mt-1">{form.metaDescription || "Add a concise search preview description."}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-300">Share URL</p>
                  <p className="mt-1 break-all">{BLOG_SHARE_BASE_URL}/blog/{form.slug || "post-slug"}</p>
                </div>
              </div>
            </aside>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              isLoading={isPending}
              loadingText="Saving..."
              className="rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600"
            >
              {post ? "Save changes" : "Create post"}
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
