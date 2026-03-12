"use client";

import { useEffect, useState, useTransition } from "react";
import { ImagePlus, Loader2, Save } from "lucide-react";
import {
  cleanupPopupImageAction,
  createAdminPopupAction,
  updateAdminPopupAction,
  uploadPopupImageAction,
  type AdminPopupInput,
} from "@/app/admin/popups/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/use-toast";
import type { Popup } from "@/types";

type PopupFormState = {
  id?: string;
  title: string;
  message: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  showOn: Popup["showOn"];
  delaySeconds: string;
  expiresAt: string;
  isActive: boolean;
};

function formatDateForInput(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function createEmptyFormState(): PopupFormState {
  return {
    title: "",
    message: "",
    imageUrl: "",
    ctaText: "Shop now",
    ctaLink: "/products",
    showOn: "homepage",
    delaySeconds: "4",
    expiresAt: "",
    isActive: true,
  };
}

function createFormState(popup?: Popup | null): PopupFormState {
  if (!popup) {
    return createEmptyFormState();
  }

  return {
    id: popup.id,
    title: popup.title,
    message: popup.message,
    imageUrl: popup.imageUrl || "",
    ctaText: popup.ctaText,
    ctaLink: popup.ctaLink,
    showOn: popup.showOn,
    delaySeconds: String(popup.delaySeconds),
    expiresAt: formatDateForInput(popup.expiresAt),
    isActive: popup.isActive,
  };
}

function toPayload(form: PopupFormState, imageUrl: string): AdminPopupInput {
  return {
    id: form.id,
    title: form.title.trim(),
    message: form.message.trim(),
    imageUrl,
    ctaText: form.ctaText.trim(),
    ctaLink: form.ctaLink.trim(),
    showOn: form.showOn,
    delaySeconds: Number(form.delaySeconds || 0),
    expiresAt: form.expiresAt,
    isActive: form.isActive,
  };
}

export function PopupFormDialog({
  open,
  popup,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  popup: Popup | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (popup: Popup) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<PopupFormState>(() => createFormState(popup));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(form.imageUrl);

  useEffect(() => {
    const nextForm = createFormState(popup);
    setForm(nextForm);
    setSelectedFile(null);
    setPreviewUrl(nextForm.imageUrl);
  }, [open, popup]);

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
            const uploadResult = await uploadPopupImageAction(uploadFormData);
            uploadedImageUrl = uploadResult.imageUrl;
            imageUrl = uploadedImageUrl;
          }

          const payload = toPayload(form, imageUrl);
          const savedPopup = form.id
            ? await updateAdminPopupAction(payload)
            : await createAdminPopupAction(payload);

          onSaved(savedPopup);
          onOpenChange(false);
          toast({
            title: form.id ? "Popup updated" : "Popup created",
            description: "The storefront popup targeting has been refreshed.",
          });
        } catch (error) {
          if (uploadedImageUrl) {
            try {
              await cleanupPopupImageAction(uploadedImageUrl);
            } catch (cleanupError) {
              console.error("Popup image cleanup failed:", cleanupError);
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
          <DialogTitle>{popup ? "Edit popup" : "Create popup"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Publish promotional popups with a controlled delay and CTA.
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
              <span className="font-medium text-zinc-300">Message</span>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
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
              <span className="font-medium text-zinc-300">CTA link</span>
              <input
                required
                value={form.ctaLink}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ctaLink: event.target.value }))
                }
                placeholder="/products"
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Show on</span>
              <select
                value={form.showOn}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    showOn: event.target.value as Popup["showOn"],
                  }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              >
                <option value="homepage">Homepage only</option>
                <option value="all">All pages</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Delay (seconds)</span>
              <input
                min="0"
                max="30"
                required
                type="number"
                value={form.delaySeconds}
                onChange={(event) =>
                  setForm((current) => ({ ...current, delaySeconds: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Expires at (optional)</span>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, expiresAt: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <div className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Popup image (optional)</span>
              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-zinc-700 bg-black/60 px-4 py-5 text-sm text-zinc-300 transition-colors hover:border-brand-400 hover:text-white">
                <ImagePlus className="h-4 w-4" />
                <span>{selectedFile ? selectedFile.name : "Choose popup image"}</span>
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

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300 md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Popup is active
            </label>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-black/50 p-5">
            <p className="text-sm font-medium text-zinc-300">Preview</p>
            <div className="mt-4 overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-zinc-950">
              {previewUrl ? (
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url("${previewUrl}")` }}
                />
              ) : null}
              <div className="space-y-3 p-5">
                <p className="text-xl font-black text-white">{form.title || "Popup title"}</p>
                <p className="text-sm text-zinc-400">
                  {form.message || "Popup message preview"}
                </p>
                <button
                  type="button"
                  className="inline-flex rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  {form.ctaText || "CTA"}
                </button>
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
              {isPending ? "Saving..." : popup ? "Save changes" : "Create popup"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
