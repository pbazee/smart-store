"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { Eye, EyeOff, Grip, ImagePlus, Loader2, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import {
  deleteAdminPromoBannerAction,
  saveAdminPromoBannerOrderAction,
  updateAdminPromoBannerAction,
} from "@/app/admin/promo-banners/actions";
import { PromoBannerFormDialog } from "@/app/admin/promo-banners/promo-banner-form-dialog";
import { useToast } from "@/lib/use-toast";
import { cn } from "@/lib/utils";
import type { PromoBanner } from "@/types";

function sortBanners(banners: PromoBanner[]) {
  return [...banners].sort(
    (left, right) =>
      left.position - right.position || left.title.localeCompare(right.title)
  );
}

function normalizeBannerOrder(banners: PromoBanner[]) {
  return sortBanners(banners).map((banner, index) => ({
    ...banner,
    position: index,
  }));
}

export function PromoBannersManager({
  initialBanners,
}: {
  initialBanners: PromoBanner[];
}) {
  const { toast } = useToast();
  const [banners, setBanners] = useState(() => sortBanners(initialBanners));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draggingBannerId, setDraggingBannerId] = useState<string | null>(null);
  const [dropTargetBannerId, setDropTargetBannerId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const visibleBanners = useMemo(() => {
    return sortBanners(banners).filter((banner) => {
      const haystack = [
        banner.badgeText,
        banner.title,
        banner.subtitle,
        banner.ctaText,
        banner.ctaLink,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !deferredSearch.trim() || haystack.includes(deferredSearch.trim().toLowerCase());
      const matchesFilter =
        filter === "all" || (filter === "active" ? banner.isActive : !banner.isActive);

      return matchesSearch && matchesFilter;
    });
  }, [banners, deferredSearch, filter]);

  const upsertBanner = (banner: PromoBanner) => {
    setBanners((current) => {
      const next = current.some((item) => item.id === banner.id)
        ? current.map((item) => (item.id === banner.id ? banner : item))
        : [...current, banner];
      return sortBanners(next);
    });
  };

  const persistOrder = (nextBanners: PromoBanner[]) => {
    const previousBanners = sortBanners(banners);
    const normalizedBanners = normalizeBannerOrder(nextBanners);
    setBanners(normalizedBanners);

    startTransition(() => {
      void (async () => {
        try {
          const savedBanners = await saveAdminPromoBannerOrderAction(
            normalizedBanners.map((banner) => ({
              id: banner.id,
              position: banner.position,
            }))
          );
          setBanners(sortBanners(savedBanners));
          toast({
            title: "Banner order updated",
            description: "The homepage promo cards now follow the new sequence.",
          });
        } catch (error) {
          setBanners(previousBanners);
          toast({
            title: "Reorder failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  const handleDrop = (targetBannerId: string) => {
    if (!draggingBannerId || draggingBannerId === targetBannerId) {
      setDraggingBannerId(null);
      setDropTargetBannerId(null);
      return;
    }

    const orderedBanners = sortBanners(banners);
    const sourceIndex = orderedBanners.findIndex((banner) => banner.id === draggingBannerId);
    const targetIndex = orderedBanners.findIndex((banner) => banner.id === targetBannerId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggingBannerId(null);
      setDropTargetBannerId(null);
      return;
    }

    const nextBanners = [...orderedBanners];
    const [movedBanner] = nextBanners.splice(sourceIndex, 1);
    nextBanners.splice(targetIndex, 0, movedBanner);

    setDraggingBannerId(null);
    setDropTargetBannerId(null);
    persistOrder(nextBanners);
  };

  const handleToggleActive = (banner: PromoBanner) => {
    startTransition(() => {
      void (async () => {
        try {
          const savedBanner = await updateAdminPromoBannerAction({
            id: banner.id,
            badgeText: banner.badgeText || "",
            title: banner.title,
            subtitle: banner.subtitle || "",
            ctaText: banner.ctaText || "",
            ctaLink: banner.ctaLink || "",
            backgroundImageUrl: banner.backgroundImageUrl || "",
            backgroundColor: banner.backgroundColor || "",
            isActive: !banner.isActive,
            position: banner.position,
          });
          upsertBanner(savedBanner);
          toast({
            title: savedBanner.isActive ? "Banner activated" : "Banner hidden",
            description: savedBanner.isActive
              ? "The banner is visible below the homepage hero."
              : "The banner has been removed from the homepage promo row.",
          });
        } catch (error) {
          toast({
            title: "Update failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  const handleDelete = (banner: PromoBanner) => {
    const confirmed = window.confirm(`Delete "${banner.title}" from the homepage promo section?`);
    if (!confirmed) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await deleteAdminPromoBannerAction(banner.id);
          const remaining = normalizeBannerOrder(
            banners.filter((item) => item.id !== banner.id)
          );
          setBanners(remaining);
          const savedBanners = await saveAdminPromoBannerOrderAction(
            remaining.map((item) => ({ id: item.id, position: item.position }))
          );
          setBanners(sortBanners(savedBanners));
          toast({
            title: "Promotional banner deleted",
            description: "The homepage promo cards have been updated.",
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
            Homepage control
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Promotional Banners</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Manage the promotional cards below the hero. Upload visuals, reorder cards, and toggle
            which campaigns are live without touching the homepage code.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingBanner(null);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Add Banner
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total banners</p>
          <p className="mt-2 text-3xl font-black text-white">{banners.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Active on homepage</p>
          <p className="mt-2 text-3xl font-black text-white">
            {banners.filter((banner) => banner.isActive).length}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Visible results</p>
          <p className="mt-2 text-3xl font-black text-white">{visibleBanners.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by badge, title, CTA, or link"
            className="h-12 w-full rounded-full border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "active", "inactive"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                filter === value
                  ? "bg-brand-500 text-white"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
              )}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {visibleBanners.length === 0 ? (
          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 px-6 py-16 text-center text-zinc-400">
            No promotional banners match the current filters.
          </div>
        ) : (
          visibleBanners.map((banner) => (
            <div
              key={banner.id}
              draggable
              onDragStart={() => {
                setDraggingBannerId(banner.id);
                setDropTargetBannerId(banner.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDropTargetBannerId(banner.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(banner.id);
              }}
              onDragEnd={() => {
                setDraggingBannerId(null);
                setDropTargetBannerId(null);
              }}
              className={cn(
                "rounded-[1.75rem] border bg-zinc-900 transition-all",
                draggingBannerId === banner.id
                  ? "border-brand-400/50 shadow-[0_18px_48px_rgba(249,115,22,0.18)]"
                  : "border-zinc-800",
                dropTargetBannerId === banner.id && draggingBannerId !== banner.id
                  ? "ring-2 ring-brand-400/40"
                  : ""
              )}
            >
              <div className="grid gap-5 p-5 xl:grid-cols-[320px,minmax(0,1fr)]">
                <div
                  className="relative overflow-hidden rounded-[1.5rem] border border-zinc-800 p-5"
                  style={{
                    minHeight: 240,
                    backgroundColor: banner.backgroundColor || "#111827",
                    ...(banner.backgroundImageUrl
                      ? {
                          backgroundImage: `linear-gradient(100deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.52) 48%, rgba(0,0,0,0.2) 100%), url("${banner.backgroundImageUrl}")`,
                          backgroundPosition: "center",
                          backgroundSize: "cover",
                        }
                      : {}),
                  }}
                >
                  <div className="flex h-full flex-col justify-end">
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/85">
                      {banner.badgeText || "Curated edit"}
                    </p>
                    <h2 className="mt-4 text-2xl font-black text-white">{banner.title}</h2>
                    <p className="mt-2 text-sm text-white/75">{banner.subtitle || "No subtitle set"}</p>
                    {banner.ctaText ? (
                      <div className="mt-5 inline-flex w-fit rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white">
                        {banner.ctaText}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex min-w-0 flex-col justify-between gap-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                          <Grip className="h-3.5 w-3.5" />
                          Drag to reorder
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                          Position {banner.position + 1}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                            banner.isActive
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-zinc-800 text-zinc-400"
                          )}
                        >
                          {banner.isActive ? "Live" : "Hidden"}
                        </span>
                      </div>
                      <p className="mt-4 max-w-3xl text-sm text-zinc-400">
                        {banner.subtitle || "No subtitle configured for this promotional card yet."}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleActive(banner)}
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-600 disabled:opacity-60"
                      >
                        {banner.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {banner.isActive ? "Hide" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBanner(banner);
                          setDialogOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-brand-400"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(banner)}
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-red-400 hover:text-red-300 disabled:opacity-60"
                      >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-zinc-800 bg-black/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                        CTA
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">{banner.ctaText || "No CTA text"}</p>
                      <p className="mt-1 break-all text-sm text-zinc-400">{banner.ctaLink || "No CTA link"}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-zinc-800 bg-black/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                        Badge
                      </p>
                      <p className="mt-2 text-sm text-zinc-100">{banner.badgeText || "No badge text"}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-zinc-800 bg-black/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                        Background
                      </p>
                      <p className="mt-2 text-sm text-zinc-100">{banner.backgroundColor || "Image-led"}</p>
                      {banner.backgroundImageUrl ? (
                        <img
                          src={banner.backgroundImageUrl}
                          alt={`${banner.title} preview`}
                          className="mt-3 h-24 w-full rounded-lg object-cover"
                        />
                      ) : (
                        <p className="mt-1 text-xs text-zinc-500">No uploaded image</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-brand-500/15 p-3 text-brand-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-sm text-zinc-400">
            <p className="font-semibold text-zinc-100">Promo banner behavior</p>
            <p>
              The storefront displays only active banners ordered by ascending position. Reorder the
              cards here and the homepage updates without a hard refresh.
            </p>
            <p className="inline-flex items-center gap-2 text-zinc-500">
              <ImagePlus className="h-4 w-4" />
              Uploading a replacement image swaps the banner art stored for the homepage card.
            </p>
          </div>
        </div>
      </div>

      <PromoBannerFormDialog
        open={dialogOpen}
        banner={editingBanner}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingBanner(null);
          }
        }}
        onSaved={upsertBanner}
      />
    </div>
  );
}
