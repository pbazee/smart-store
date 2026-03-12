"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { Loader2, Megaphone, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AnnouncementFormDialog } from "@/app/admin/announcements/announcement-form-dialog";
import { deleteAdminAnnouncementAction } from "@/app/admin/announcements/actions";
import { useToast } from "@/lib/use-toast";
import type { AnnouncementMessage } from "@/types";

export function AnnouncementsManager({
  initialAnnouncements,
}: {
  initialAnnouncements: AnnouncementMessage[];
}) {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementMessage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const visibleAnnouncements = useMemo(() => {
    return [...announcements]
      .filter((announcement) => {
        const matchesSearch =
          !deferredSearch.trim() ||
          [announcement.text, announcement.icon, announcement.link || ""]
            .join(" ")
            .toLowerCase()
            .includes(deferredSearch.trim().toLowerCase());

        const matchesFilter =
          filter === "all" ||
          (filter === "active" ? announcement.isActive : !announcement.isActive);

        return matchesSearch && matchesFilter;
      })
      .sort((left, right) => left.order - right.order || left.text.localeCompare(right.text));
  }, [announcements, deferredSearch, filter]);

  const activeCount = announcements.filter((announcement) => announcement.isActive).length;

  const handleSavedAnnouncement = (announcement: AnnouncementMessage) => {
    setAnnouncements((current) => {
      const exists = current.some((item) => item.id === announcement.id);
      if (exists) {
        return current.map((item) => (item.id === announcement.id ? announcement : item));
      }

      return [announcement, ...current];
    });
  };

  const handleDelete = async (announcement: AnnouncementMessage) => {
    const confirmed = window.confirm(
      `Delete "${announcement.text}" from the announcement bar?`
    );

    if (!confirmed) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await deleteAdminAnnouncementAction(announcement.id);
          setAnnouncements((current) =>
            current.filter((item) => item.id !== announcement.id)
          );
          toast({
            title: "Announcement deleted",
            description: "The announcement was removed successfully.",
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
            Announcement control
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Admin Announcements</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Rotate homepage messages, campaign notes, and trust signals from one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingAnnouncement(null);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Add New Announcement
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total messages</p>
          <p className="mt-2 text-3xl font-black text-white">{announcements.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Active on storefront</p>
          <p className="mt-2 text-3xl font-black text-white">{activeCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Visible results</p>
          <p className="mt-2 text-3xl font-black text-white">{visibleAnnouncements.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by message text, icon, or link"
            className="h-12 w-full rounded-full border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "active", "inactive"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                filter === value
                  ? "bg-brand-500 text-white"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-zinc-800 bg-zinc-950/70">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Icon
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Text
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Active?
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Order
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleAnnouncements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-zinc-400">
                    No announcements match the current filters.
                  </td>
                </tr>
              ) : (
                visibleAnnouncements.map((announcement) => (
                  <tr
                    key={announcement.id}
                    className="border-b border-zinc-800/70 transition-colors hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-4 align-middle">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 text-xl"
                        style={{
                          backgroundColor: announcement.bgColor || "#120804",
                          color: announcement.textColor || "#FFF7ED",
                        }}
                      >
                        {announcement.icon}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="max-w-xl">
                        <p className="font-semibold text-zinc-100">{announcement.text}</p>
                        {announcement.link && (
                          <p className="mt-1 text-xs text-zinc-500">{announcement.link}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          announcement.isActive
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {announcement.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm font-semibold text-zinc-200">
                      {announcement.order}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAnnouncement(announcement);
                            setDialogOpen(true);
                          }}
                          className="rounded-xl border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-brand-400 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => void handleDelete(announcement)}
                          className="rounded-xl border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-50"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-500/15 p-3 text-brand-300">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-zinc-100">Homepage behavior</p>
            <p className="text-sm text-zinc-400">
              Multiple active messages rotate every 5 seconds, one active message stays static,
              and zero active messages hide the bar entirely.
            </p>
          </div>
        </div>
      </div>

      <AnnouncementFormDialog
        open={dialogOpen}
        announcement={editingAnnouncement}
        onOpenChange={setDialogOpen}
        onSaved={handleSavedAnnouncement}
      />
    </div>
  );
}
