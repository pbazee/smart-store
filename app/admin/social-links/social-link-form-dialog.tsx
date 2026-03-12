"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import {
  createAdminSocialLinkAction,
  updateAdminSocialLinkAction,
  type AdminSocialLinkInput,
} from "@/app/admin/social-links/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/use-toast";
import type { SocialLink } from "@/types";

type SocialLinkFormState = {
  id?: string;
  platform: SocialLink["platform"];
  url: string;
  icon: string;
};

function createEmptyFormState(): SocialLinkFormState {
  return {
    platform: "instagram",
    url: "",
    icon: "",
  };
}

function createFormState(link?: SocialLink | null): SocialLinkFormState {
  if (!link) {
    return createEmptyFormState();
  }

  return {
    id: link.id,
    platform: link.platform,
    url: link.url,
    icon: link.icon || "",
  };
}

function toPayload(form: SocialLinkFormState): AdminSocialLinkInput {
  return {
    id: form.id,
    platform: form.platform,
    url: form.url.trim(),
    icon: form.icon.trim(),
  };
}

export function SocialLinkFormDialog({
  open,
  socialLink,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  socialLink: SocialLink | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (socialLink: SocialLink) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<SocialLinkFormState>(() => createFormState(socialLink));

  useEffect(() => {
    setForm(createFormState(socialLink));
  }, [socialLink, open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          const payload = toPayload(form);
          const savedSocialLink = form.id
            ? await updateAdminSocialLinkAction(payload)
            : await createAdminSocialLinkAction(payload);

          onSaved(savedSocialLink);
          onOpenChange(false);
          toast({
            title: form.id ? "Social link updated" : "Social link created",
            description: "Footer icons will refresh automatically.",
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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{socialLink ? "Edit social link" : "Add social link"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Control the storefront social icons from one place.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Platform</span>
              <select
                value={form.platform}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    platform: event.target.value as SocialLink["platform"],
                  }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="facebook">Facebook</option>
                <option value="x">X</option>
                <option value="youtube">YouTube</option>
                <option value="linkedin">LinkedIn</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">URL</span>
              <input
                required
                value={form.url}
                onChange={(event) =>
                  setForm((current) => ({ ...current, url: event.target.value }))
                }
                placeholder="https://instagram.com/..."
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Icon override (optional)</span>
              <input
                value={form.icon}
                onChange={(event) =>
                  setForm((current) => ({ ...current, icon: event.target.value }))
                }
                placeholder="instagram"
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>
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
              {isPending ? "Saving..." : socialLink ? "Save changes" : "Create link"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
