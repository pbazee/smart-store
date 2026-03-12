"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Megaphone, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createAdminAnnouncementAction,
  updateAdminAnnouncementAction,
  type AdminAnnouncementInput,
} from "@/app/admin/announcements/actions";
import { useToast } from "@/lib/use-toast";
import type { AnnouncementMessage } from "@/types";

type AnnouncementFormState = {
  id?: string;
  text: string;
  icon: string;
  link: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  order: string;
};

function createEmptyFormState(): AnnouncementFormState {
  return {
    text: "",
    icon: "\u{1F680}",
    link: "",
    bgColor: "#120804",
    textColor: "#FFF7ED",
    isActive: true,
    order: "0",
  };
}

function createFormState(announcement?: AnnouncementMessage | null): AnnouncementFormState {
  if (!announcement) {
    return createEmptyFormState();
  }

  return {
    id: announcement.id,
    text: announcement.text,
    icon: announcement.icon,
    link: announcement.link || "",
    bgColor: announcement.bgColor || "#120804",
    textColor: announcement.textColor || "#FFF7ED",
    isActive: announcement.isActive,
    order: String(announcement.order),
  };
}

function toPayload(form: AnnouncementFormState): AdminAnnouncementInput {
  return {
    id: form.id,
    text: form.text.trim(),
    icon: form.icon.trim(),
    link: form.link.trim(),
    bgColor: form.bgColor.trim(),
    textColor: form.textColor.trim(),
    isActive: form.isActive,
    order: Number(form.order || 0),
  };
}

export function AnnouncementFormDialog({
  open,
  announcement,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  announcement: AnnouncementMessage | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (announcement: AnnouncementMessage) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<AnnouncementFormState>(() =>
    createFormState(announcement)
  );

  useEffect(() => {
    setForm(createFormState(announcement));
  }, [announcement, open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          const payload = toPayload(form);
          const savedAnnouncement = form.id
            ? await updateAdminAnnouncementAction(payload)
            : await createAdminAnnouncementAction(payload);

          onSaved(savedAnnouncement);
          onOpenChange(false);
          toast({
            title: form.id ? "Announcement updated" : "Announcement created",
            description: "The announcement bar will reflect this change immediately.",
          });
        } catch (error) {
          toast({
            title: "Announcement save failed",
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
          <DialogTitle>{announcement ? "Edit announcement" : "Add new announcement"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Control the storefront announcement bar without leaving admin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-[120px,1fr]">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Icon</span>
              <input
                required
                value={form.icon}
                onChange={(event) =>
                  setForm((current) => ({ ...current, icon: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-center text-xl text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Text</span>
              <textarea
                required
                rows={3}
                value={form.text}
                onChange={(event) =>
                  setForm((current) => ({ ...current, text: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Link (optional)</span>
              <input
                value={form.link}
                onChange={(event) =>
                  setForm((current) => ({ ...current, link: event.target.value }))
                }
                placeholder="/products or https://example.com"
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <div className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Background color</span>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.bgColor}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, bgColor: event.target.value }))
                  }
                  className="h-12 w-12 rounded-xl border border-zinc-800 bg-black p-1"
                />
                <input
                  value={form.bgColor}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, bgColor: event.target.value }))
                  }
                  className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Text color</span>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.textColor}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, textColor: event.target.value }))
                  }
                  className="h-12 w-12 rounded-xl border border-zinc-800 bg-black p-1"
                />
                <input
                  value={form.textColor}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, textColor: event.target.value }))
                  }
                  className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                />
              </div>
            </div>

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

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300 md:self-end">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Active on storefront
            </label>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-black/50 p-5">
            <p className="text-sm font-medium text-zinc-300">Preview</p>
            <div
              className="mt-3 flex min-h-12 items-center justify-center rounded-full px-4 text-center text-sm font-semibold"
              style={{
                backgroundColor: form.bgColor || "#120804",
                color: form.textColor || "#FFF7ED",
              }}
            >
              <div className="flex min-w-0 items-center gap-2 truncate">
                <Megaphone className="h-4 w-4 flex-shrink-0" />
                <span>{form.icon}</span>
                <span className="truncate">{form.text || "Announcement preview"}</span>
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
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isPending ? "Saving..." : announcement ? "Save changes" : "Create announcement"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
