"use client";

import { useEffect, useState, useTransition } from "react";
import { ImagePlus, Loader2, Save } from "lucide-react";
import {
  cleanupBlogImageAction,
  createAdminBlogAction,
  updateAdminBlogAction,
  uploadBlogImageAction,
  type AdminBlogInput,
} from "@/app/admin/blogs/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/use-toast";
import { slugify } from "@/lib/utils";
import type { BlogPost } from "@/types";

type BlogFormState = {
  id?: string;
  title: string;
  slug: string;
  content: string;
  imageUrl: string;
  isPublished: boolean;
};

function createEmptyFormState(): BlogFormState {
  return {
    title: "",
    slug: "",
    content: "",
    imageUrl: "",
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
    content: post.content,
    imageUrl: post.imageUrl,
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
    isPublished: form.isPublished,
  };
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
            title: form.id ? "Blog post updated" : "Blog post created",
            description: "The blog landing page and homepage teaser will refresh automatically.",
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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{post ? "Edit blog post" : "Create new blog post"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Publish style notes and trend pieces without leaving admin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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
                    slug: slugTouched ? current.slug : slugify(title),
                  }));
                }}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Slug</span>
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

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Content</span>
              <textarea
                required
                rows={12}
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({ ...current, content: event.target.value }))
                }
                placeholder="Use plain text or simple markdown. Prefix headings with ## for section titles."
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300 md:col-span-2">
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

          <div className="rounded-[1.75rem] border border-zinc-800 bg-black/50 p-5">
            <p className="text-sm font-medium text-zinc-300">Preview</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[220px,1fr]">
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
                  <p className="font-medium text-zinc-300">Slug</p>
                  <p className="mt-1 break-all">{form.slug || "post-slug"}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-300">Excerpt preview</p>
                  <p className="mt-1">
                    {(form.content || "Start writing your post to preview the teaser.")
                      .replace(/^##\s+/gm, "")
                      .replace(/\s+/g, " ")
                      .trim()
                      .slice(0, 140)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isPending ? "Saving..." : post ? "Save changes" : "Create post"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
