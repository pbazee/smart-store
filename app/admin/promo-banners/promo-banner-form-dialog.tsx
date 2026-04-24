"use client";

import { useEffect, useState, useTransition } from "react";
import { ImagePlus, Loader2, Save } from "lucide-react";
import {
  createAdminPromoBannerAction,
  updateAdminPromoBannerAction,
  uploadPromoBannerImageAction,
  type AdminPromoBannerInput,
} from "@/app/admin/promo-banners/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/use-toast";
import type { PromoBanner } from "@/types";

type PromoBannerFormState = {
  id?: string;
  badgeText: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImageUrl: string;
  backgroundColor: string;
  isActive: boolean;
  position: string;
};

function createEmptyFormState(): PromoBannerFormState {
  return {
    badgeText: "Curated edit",
    title: "",
    subtitle: "",
    ctaText: "Shop Now",
    ctaLink: "/shop",
    backgroundImageUrl: "",
    backgroundColor: "#111827",
    isActive: true,
    position: "0",
  };
}

function createFormState(banner?: PromoBanner | null): PromoBannerFormState {
  if (!banner) {
    return createEmptyFormState();
  }

  return {
    id: banner.id,
    badgeText: banner.badgeText || "",
    title: banner.title,
    subtitle: banner.subtitle || "",
    ctaText: banner.ctaText || "",
    ctaLink: banner.ctaLink || "",
    backgroundImageUrl: banner.backgroundImageUrl || "",
    backgroundColor: banner.backgroundColor || "#111827",
    isActive: banner.isActive,
    position: String(banner.position),
  };
}

function toPayload(form: PromoBannerFormState, backgroundImageUrl: string): AdminPromoBannerInput {
  return {
    id: form.id,
    badgeText: form.badgeText.trim(),
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    ctaText: form.ctaText.trim(),
    ctaLink: form.ctaLink.trim(),
    backgroundImageUrl,
    backgroundColor: form.backgroundColor.trim(),
    isActive: form.isActive,
    position: Number(form.position || 0),
  };
}

export function PromoBannerFormDialog({
  open,
  banner,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  banner: PromoBanner | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (banner: PromoBanner) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<PromoBannerFormState>(() => createFormState(banner));
  const [previewUrl, setPreviewUrl] = useState(form.backgroundImageUrl);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    const nextForm = createFormState(banner);
    setForm(nextForm);
    setPreviewUrl(nextForm.backgroundImageUrl);
  }, [banner, open]);

  const handleImageSelect = async (file: File | null) => {
    if (!file) {
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const uploadResult = await uploadPromoBannerImageAction(uploadFormData);
      setForm((current) => ({ ...current, backgroundImageUrl: uploadResult.imageUrl }));
      setPreviewUrl(uploadResult.imageUrl);
      toast({
        title: "Banner image uploaded",
        description: "The banner now uses the stored image URL from Supabase Storage.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "The background image could not be uploaded.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          const payload = toPayload(form, form.backgroundImageUrl.trim());
          const savedBanner = form.id
            ? await updateAdminPromoBannerAction(payload)
            : await createAdminPromoBannerAction(payload);

          onSaved(savedBanner);
          onOpenChange(false);
          toast({
            title: form.id ? "Promotional banner updated" : "Promotional banner created",
            description: "The storefront promo section will refresh with this banner.",
          });
        } catch (error) {
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
          <DialogTitle>{banner ? "Edit promotional banner" : "Add promotional banner"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Control the homepage cards shown below the hero without editing code.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Badge text</span>
              <input
                value={form.badgeText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, badgeText: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Position</span>
              <input
                min="0"
                type="number"
                value={form.position}
                onChange={(event) =>
                  setForm((current) => ({ ...current, position: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

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
                rows={3}
                value={form.subtitle}
                onChange={(event) =>
                  setForm((current) => ({ ...current, subtitle: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">CTA button text</span>
              <input
                value={form.ctaText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ctaText: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">CTA link</span>
              <input
                value={form.ctaLink}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ctaLink: event.target.value }))
                }
                placeholder="/shop?gender=men"
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Background color</span>
              <input
                value={form.backgroundColor}
                onChange={(event) =>
                  setForm((current) => ({ ...current, backgroundColor: event.target.value }))
                }
                placeholder="#111827"
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <div className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Background image upload</span>
              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-zinc-700 bg-black/60 px-4 py-5 text-sm text-zinc-300 transition-colors hover:border-brand-400 hover:text-white">
                {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                <span>{isUploadingImage ? "Uploading image..." : "Choose banner image"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="hidden"
                  onChange={(event) => {
                    void handleImageSelect(event.target.files?.[0] || null);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
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
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Banner preview"
                className="mt-4 h-32 w-full rounded-lg object-cover"
              />
            ) : null}
            <div
              className="mt-4 overflow-hidden rounded-[1.75rem] border border-zinc-800"
              style={{ backgroundColor: form.backgroundColor || "#111827" }}
            >
              <div
                className="relative min-h-[260px] p-7"
                style={
                  previewUrl
                    ? {
                        backgroundImage: `linear-gradient(100deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.54) 48%, rgba(0,0,0,0.22) 100%), url("${previewUrl}")`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }
                    : undefined
                }
              >
                <div className="max-w-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/90">
                    {form.badgeText || "Curated edit"}
                  </p>
                  <h3 className="mt-4 font-sans text-3xl font-black tracking-tight text-white">
                    {form.title || "Banner title"}
                  </h3>
                  <p className="mt-3 text-sm text-white/80">
                    {form.subtitle || "Banner subtitle preview appears here."}
                  </p>
                  {form.ctaText ? (
                    <div className="mt-6 inline-flex rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-white">
                      {form.ctaText}
                    </div>
                  ) : null}
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
              {isPending ? "Saving..." : banner ? "Save changes" : "Create banner"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
