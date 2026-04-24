"use client";

import { useMemo, useState, useTransition } from "react";
import { Clock3, Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteAdminPopupAction } from "@/app/admin/popups/actions";
import { PopupFormDialog } from "@/app/admin/popups/popup-form-dialog";
import { useToast } from "@/lib/use-toast";
import type { Popup } from "@/types";

export function PopupsManager({
  initialPopups,
}: {
  initialPopups: Popup[];
}) {
  const { toast } = useToast();
  const [popups, setPopups] = useState(initialPopups);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeCount = useMemo(
    () => popups.filter((popup) => popup.isActive).length,
    [popups]
  );

  const getTargetLabel = (showOn: Popup["showOn"]) => {
    switch (showOn) {
      case "all":
        return "All pages";
      case "shop":
        return "Shop All / Products Page";
      case "product":
        return "Individual Product Pages";
      default:
        return "Homepage";
    }
  };

  const handleSavedPopup = (popup: Popup) => {
    setPopups((current) => {
      const exists = current.some((item) => item.id === popup.id);
      if (exists) {
        return current.map((item) => (item.id === popup.id ? popup : item));
      }

      return [popup, ...current];
    });
  };

  const handleDelete = async (popup: Popup) => {
    const confirmed = window.confirm(`Delete popup "${popup.title}"?`);
    if (!confirmed) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await deleteAdminPopupAction(popup.id);
          setPopups((current) => current.filter((item) => item.id !== popup.id));
          toast({
            title: "Popup deleted",
            description: "The marketing popup was removed successfully.",
          });
        } catch (error) {
          toast({
            title: "Delete failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
            Campaign control
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Website Popups</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Publish timed promotions and once-only modal campaigns across the storefront.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingPopup(null);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Create Popup
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total popups</p>
          <p className="mt-2 text-3xl font-black text-white">{popups.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Active</p>
          <p className="mt-2 text-3xl font-black text-white">{activeCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Homepage targeted</p>
          <p className="mt-2 text-3xl font-black text-white">
            {popups.filter((popup) => popup.showOn === "homepage").length}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {popups.length === 0 ? (
          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-8 text-sm text-zinc-400 lg:col-span-2">
            No popups yet. Create one to launch a homepage or site-wide promotion.
          </div>
        ) : (
          popups.map((popup) => (
            <article
              key={popup.id}
              className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        popup.isActive
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {popup.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
                      {getTargetLabel(popup.showOn)}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-black text-white">{popup.title}</h2>
                  <p className="mt-2 text-sm text-zinc-400">{popup.message}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPopup(popup);
                      setDialogOpen(true);
                    }}
                    className="rounded-xl border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-brand-400 hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => void handleDelete(popup)}
                    className="rounded-xl border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-sm text-zinc-300">
                <span className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-3 py-2">
                  <Clock3 className="h-4 w-4 text-brand-300" />
                  {popup.delaySeconds}s delay
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-3 py-2">
                  <ImageIcon className="h-4 w-4 text-brand-300" />
                  {popup.imageUrl ? "Image included" : "No image"}
                </span>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  CTA
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {popup.ctaText} → {popup.ctaLink}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {popup.expiresAt
                    ? `Expires ${new Date(popup.expiresAt).toLocaleString("en-KE", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}`
                    : "No expiry date set"}
                </p>
              </div>
            </article>
          ))
        )}
      </div>

      <PopupFormDialog
        open={dialogOpen}
        popup={editingPopup}
        onOpenChange={setDialogOpen}
        onSaved={handleSavedPopup}
      />
    </div>
  );
}
