"use client";

import { useEffect, useState, useTransition } from "react";
import { ImagePlus, Loader2, Plus, Save, X } from "lucide-react";
import {
  cleanupHeroSlideImageAction,
  createAdminHeroSlideAction,
  updateAdminHeroSlideAction,
  uploadHeroSlideImageAction,
  type AdminHeroSlideInput,
} from "@/app/admin/hero/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/use-toast";
import type { HeroSlide } from "@/types";

type HeroSlideFormState = {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  moodTags: string[];
  locationBadge: string;
  isActive: boolean;
  order: string;
};

function createEmptyFormState(): HeroSlideFormState {
  return {
    title: "",
    subtitle: "",
    imageUrl: "",
    ctaText: "Shop the Edit",
    ctaLink: "/products?filter=new",
    moodTags: [],
    locationBadge: "",
    isActive: true,
    order: "0",
  };
}

function createFormState(slide?: HeroSlide | null): HeroSlideFormState {
  if (!slide) {
    return createEmptyFormState();
  }

  return {
    id: slide.id,
    title: slide.title,
    subtitle: slide.subtitle,
    imageUrl: slide.imageUrl,
    ctaText: slide.ctaText,
    ctaLink: slide.ctaLink,
    moodTags: slide.moodTags,
    locationBadge: slide.locationBadge,
    isActive: slide.isActive,
    order: String(slide.order),
  };
}

function toPayload(form: HeroSlideFormState, imageUrl: string): AdminHeroSlideInput {
  return {
    id: form.id,
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    imageUrl,
    ctaText: form.ctaText.trim(),
    ctaLink: form.ctaLink.trim(),
    moodTags: form.moodTags,
    locationBadge: form.locationBadge.trim(),
    isActive: form.isActive,
    order: Number(form.order || 0),
  };
}

export function HeroFormDialog({
  open,
  slide,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  slide: HeroSlide | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (slide: HeroSlide) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<HeroSlideFormState>(() => createFormState(slide));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(form.imageUrl);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    const nextForm = createFormState(slide);
    setForm(nextForm);
    setSelectedFile(null);
    setPreviewUrl(nextForm.imageUrl);
    setTagInput("");
  }, [slide, open]);

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

  const addMoodTag = () => {
    const normalized = tagInput.trim();
    if (!normalized || form.moodTags.includes(normalized)) {
      setTagInput("");
      return;
    }

    setForm((current) => ({ ...current, moodTags: [...current.moodTags, normalized] }));
    setTagInput("");
  };

  const removeMoodTag = (tagToRemove: string) => {
    setForm((current) => ({
      ...current,
      moodTags: current.moodTags.filter((tag) => tag !== tagToRemove),
    }));
  };

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
            const uploadResult = await uploadHeroSlideImageAction(uploadFormData);
            uploadedImageUrl = uploadResult.imageUrl;
            imageUrl = uploadedImageUrl;
          }

          if (!imageUrl) {
            throw new Error("Please upload an image before saving.");
          }

          const payload = toPayload(form, imageUrl);
          const savedSlide = form.id
            ? await updateAdminHeroSlideAction(payload)
            : await createAdminHeroSlideAction(payload);

          onSaved(savedSlide);
          onOpenChange(false);
          toast({
            title: form.id ? "Hero slide updated" : "Hero slide created",
            description: "The homepage hero will refresh with this change immediately.",
          });
        } catch (error) {
          if (uploadedImageUrl) {
            try {
              await cleanupHeroSlideImageAction(uploadedImageUrl);
            } catch (cleanupError) {
              console.error("Hero slide image cleanup failed:", cleanupError);
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
      <DialogContent className="max-h-[92vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{slide ? "Edit hero slide" : "Add new hero slide"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Manage the homepage hero headline, image, CTA, and mood cues without changing code.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Title</span>
              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Subtitle</span>
              <textarea
                required
                rows={4}
                value={form.subtitle}
                onChange={(event) =>
                  setForm((current) => ({ ...current, subtitle: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">CTA text</span>
              <input
                required
                value={form.ctaText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ctaText: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

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
              <span className="font-medium text-zinc-300">CTA link</span>
              <input
                required
                value={form.ctaLink}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ctaLink: event.target.value }))
                }
                placeholder="/products?filter=new"
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Location badge</span>
              <input
                required
                value={form.locationBadge}
                onChange={(event) =>
                  setForm((current) => ({ ...current, locationBadge: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <div className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Mood tags</span>
              <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-zinc-800 bg-black/60 p-3">
                {form.moodTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeMoodTag(tag)}
                      className="text-zinc-500 transition-colors hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="flex min-w-[220px] flex-1 items-center gap-2">
                  <input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addMoodTag();
                      }
                    }}
                    placeholder="Add a mood tag"
                    className="h-10 flex-1 rounded-full border border-zinc-800 bg-black px-4 text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={addMoodTag}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-700 px-4 text-xs font-semibold text-zinc-200 transition-colors hover:border-brand-400 hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Image upload</span>
              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-zinc-700 bg-black/60 px-4 py-5 text-sm text-zinc-300 transition-colors hover:border-brand-400 hover:text-white">
                <ImagePlus className="h-4 w-4" />
                <span>{selectedFile ? selectedFile.name : "Choose hero image"}</span>
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
                JPG, PNG, WebP, or AVIF up to 5MB. Hero images are stored for the homepage carousel.
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
            <div className="mt-4 grid gap-4 lg:grid-cols-[240px,1fr]">
              <div
                className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-zinc-900"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-2xl font-black text-white">
                    {form.title || "Hero title"}
                  </p>
                  <p className="mt-2 text-sm text-white/75">
                    {form.subtitle || "Hero subtitle preview appears here."}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-zinc-400">
                <div>
                  <p className="font-medium text-zinc-300">CTA</p>
                  <p className="mt-1">
                    {form.ctaText || "Shop the Edit"} -&gt; {form.ctaLink || "/products"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-zinc-300">Location badge</p>
                  <p className="mt-1">{form.locationBadge || "Set a location badge"}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-300">Mood tags</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.moodTags.length > 0 ? (
                      form.moodTags.map((tag) => (
                        <span
                          key={`preview-${tag}`}
                          className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-200"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-500">Add tags for the right-side hero panel.</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-zinc-300">Visibility</p>
                  <p className="mt-1">
                    {form.isActive ? "Visible on the homepage" : "Hidden from the homepage"}
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
              {isPending ? "Saving..." : slide ? "Save changes" : "Create slide"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
