"use client";

import { useEffect, useState, useTransition } from "react";
import { ImagePlus, Loader2, Save } from "lucide-react";
import {
  cleanupHomepageCategoryImageAction,
  createAdminHomepageCategoryAction,
  updateAdminHomepageCategoryAction,
  uploadHomepageCategoryImageAction,
  type AdminHomepageCategoryInput,
} from "@/app/admin/homepage-categories/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/use-toast";
import type { Category, HomepageCategory } from "@/types";

type HomepageCategoryFormState = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  isActive: boolean;
  order: string;
};

function createEmptyFormState(categories: Category[]): HomepageCategoryFormState {
  const firstCategory = categories[0];
  return {
    id: firstCategory?.id || "",
    title: firstCategory?.name || "",
    subtitle: "",
    imageUrl: "",
    isActive: true,
    order: "0",
  };
}

function createFormState(
  category: HomepageCategory | null | undefined,
  categories: Category[]
): HomepageCategoryFormState {
  if (!category) {
    return createEmptyFormState(categories);
  }

  return {
    id: category.id,
    title: category.title,
    subtitle: category.subtitle || "",
    imageUrl: category.imageUrl,
    isActive: category.isActive,
    order: String(category.order),
  };
}

function toPayload(form: HomepageCategoryFormState, imageUrl: string): AdminHomepageCategoryInput {
  return {
    id: form.id,
    subtitle: form.subtitle.trim(),
    imageUrl,
    isActive: form.isActive,
    order: Number(form.order || 0),
  };
}

export function HomepageCategoryFormDialog({
  open,
  category,
  topLevelCategories,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  category: HomepageCategory | null;
  topLevelCategories: Category[];
  onOpenChange: (open: boolean) => void;
  onSaved: (category: HomepageCategory) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<HomepageCategoryFormState>(() =>
    createFormState(category, topLevelCategories)
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(form.imageUrl);

  useEffect(() => {
    const nextForm = createFormState(category, topLevelCategories);
    setForm(nextForm);
    setSelectedFile(null);
    setPreviewUrl(nextForm.imageUrl);
  }, [category, open, topLevelCategories]);

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
            const uploadResult = await uploadHomepageCategoryImageAction(uploadFormData);
            uploadedImageUrl = uploadResult.imageUrl;
            imageUrl = uploadedImageUrl;
          }

          if (!imageUrl) {
            throw new Error("Please upload an image before saving.");
          }

          const payload = toPayload(form, imageUrl);
          const savedCategory = form.id
            ? await updateAdminHomepageCategoryAction(payload)
            : await createAdminHomepageCategoryAction(payload);

          onSaved(savedCategory);
          onOpenChange(false);
          toast({
            title: form.id ? "Homepage category updated" : "Homepage category created",
            description: "The landing page grid will refresh with this change immediately.",
          });
        } catch (error) {
          if (uploadedImageUrl) {
            try {
              await cleanupHomepageCategoryImageAction(uploadedImageUrl);
            } catch (cleanupError) {
              console.error("Homepage category image cleanup failed:", cleanupError);
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
          <DialogTitle>{category ? "Edit homepage category" : "Add homepage category"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Choose an existing shop category, then control how it appears on the homepage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {!category ? (
              <label className="space-y-2 text-sm">
                <span className="font-medium text-zinc-300">Category</span>
                <select
                  required
                  value={form.id}
                  onChange={(event) => {
                    const selected = topLevelCategories.find((item) => item.id === event.target.value);
                    setForm((current) => ({
                      ...current,
                      id: selected?.id || "",
                      title: selected?.name || "",
                      subtitle: selected?.homepageSubtitle || selected?.description || "",
                      imageUrl: selected?.homepageImageUrl || "",
                      isActive: selected?.isHomepageVisible ?? true,
                      order: String(selected?.homepageOrder ?? selected?.order ?? 0),
                    }));
                    setPreviewUrl(selected?.homepageImageUrl || "");
                  }}
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                >
                  <option value="">Select a master category</option>
                  {topLevelCategories.map((topLevelCategory) => (
                    <option key={topLevelCategory.id} value={topLevelCategory.id}>
                      {topLevelCategory.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="space-y-2 text-sm">
                <span className="font-medium text-zinc-300">Category</span>
                <input
                  value={form.title}
                  readOnly
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100"
                />
              </label>
            )}

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Order</span>
              <input
                required
                min="0"
                type="number"
                value={form.order}
                onChange={(event) =>
                  setForm((current) => ({ ...current, order: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Subtitle (optional)</span>
              <input
                value={form.subtitle}
                onChange={(event) =>
                  setForm((current) => ({ ...current, subtitle: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <div className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Image upload</span>
              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-zinc-700 bg-black/60 px-4 py-5 text-sm text-zinc-300 transition-colors hover:border-brand-400 hover:text-white">
                <ImagePlus className="h-4 w-4" />
                <span>{selectedFile ? selectedFile.name : "Choose category image"}</span>
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
              <p className="text-xs text-zinc-500">
                JPG, PNG, WebP, or AVIF up to 5MB. Uploaded images are reused on the homepage cards.
              </p>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300 md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Active on homepage
            </label>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-black/50 p-5">
            <p className="text-sm font-medium text-zinc-300">Preview</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[220px,1fr]">
              <div
                className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-900"
                style={
                  previewUrl
                    ? {
                        backgroundImage: `url("${previewUrl}")`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }
                    : undefined
                }
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-neutral-900 shadow-sm backdrop-blur-sm">
                    {form.title || "Category title"}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-sm text-zinc-400">
                <div>
                  <p className="font-medium text-zinc-300">Master category</p>
                  <p className="mt-1">{form.title || "Choose a category"}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-300">Subtitle</p>
                  <p className="mt-1">{form.subtitle || "Optional support copy for future use."}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-300">Visibility</p>
                  <p className="mt-1">{form.isActive ? "Visible on the homepage" : "Hidden from the homepage"}</p>
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
              {isPending ? "Saving..." : category ? "Save changes" : "Create category"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
