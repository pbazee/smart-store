"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import {
  Eye,
  EyeOff,
  Grip,
  ImagePlus,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  deleteAdminHeroSlideAction,
  saveAdminHeroSlideOrderAction,
  updateAdminHeroSlideAction,
} from "@/app/admin/hero/actions";
import { HeroFormDialog } from "@/app/admin/hero/hero-form-dialog";
import { useToast } from "@/lib/use-toast";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/types";

function getImagePreviewStyle(imageUrl: string) {
  return imageUrl
    ? {
        backgroundImage: `url("${imageUrl}")`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }
    : undefined;
}

function sortSlides(slides: HeroSlide[]) {
  return [...slides].sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
}

function normalizeSlideOrder(slides: HeroSlide[]) {
  return sortSlides(slides).map((slide, index) => ({
    ...slide,
    order: index,
  }));
}

export function HeroSlidesManager({
  initialSlides,
}: {
  initialSlides: HeroSlide[];
}) {
  const { toast } = useToast();
  const [slides, setSlides] = useState(() => sortSlides(initialSlides));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draggingSlideId, setDraggingSlideId] = useState<string | null>(null);
  const [dropTargetSlideId, setDropTargetSlideId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const visibleSlides = useMemo(() => {
    return sortSlides(slides).filter((slide) => {
      const haystack = [
        slide.title,
        slide.subtitle,
        slide.ctaText,
        slide.ctaLink,
        slide.locationBadge,
        slide.moodTags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !deferredSearch.trim() || haystack.includes(deferredSearch.trim().toLowerCase());
      const matchesFilter =
        filter === "all" || (filter === "active" ? slide.isActive : !slide.isActive);

      return matchesSearch && matchesFilter;
    });
  }, [deferredSearch, filter, slides]);

  const activeCount = slides.filter((slide) => slide.isActive).length;

  const upsertSlide = (slide: HeroSlide) => {
    setSlides((current) => {
      const nextSlides = current.some((item) => item.id === slide.id)
        ? current.map((item) => (item.id === slide.id ? slide : item))
        : [...current, slide];

      return sortSlides(nextSlides);
    });
  };

  const handleDelete = (slide: HeroSlide) => {
    const confirmed = window.confirm(`Delete "${slide.title}" from the homepage hero?`);
    if (!confirmed) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await deleteAdminHeroSlideAction(slide.id);
          const remainingSlides = normalizeSlideOrder(
            slides.filter((item) => item.id !== slide.id)
          );
          setSlides(remainingSlides);
          const savedSlides = await saveAdminHeroSlideOrderAction(
            remainingSlides.map((item) => ({
              id: item.id,
              order: item.order,
            }))
          );
          setSlides(sortSlides(savedSlides));
          toast({
            title: "Hero slide deleted",
            description: "The homepage carousel has been updated.",
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

  const handleToggleActive = (slide: HeroSlide) => {
    startTransition(() => {
      void (async () => {
        try {
          const savedSlide = await updateAdminHeroSlideAction({
            id: slide.id,
            title: slide.title,
            subtitle: slide.subtitle,
            imageUrl: slide.imageUrl,
            ctaText: slide.ctaText,
            ctaLink: slide.ctaLink,
            moodTags: slide.moodTags,
            locationBadge: slide.locationBadge,
            isActive: !slide.isActive,
            order: slide.order,
          });
          upsertSlide(savedSlide);
          toast({
            title: savedSlide.isActive ? "Slide activated" : "Slide hidden",
            description: savedSlide.isActive
              ? "The slide is visible in the homepage rotation."
              : "The slide has been removed from the homepage rotation.",
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

  const persistOrder = (nextSlides: HeroSlide[]) => {
    const previousSlides = sortSlides(slides);
    const normalizedSlides = normalizeSlideOrder(nextSlides);
    setSlides(normalizedSlides);

    startTransition(() => {
      void (async () => {
        try {
          const savedSlides = await saveAdminHeroSlideOrderAction(
            normalizedSlides.map((slide) => ({
              id: slide.id,
              order: slide.order,
            }))
          );

          setSlides(sortSlides(savedSlides));
          toast({
            title: "Hero order updated",
            description: "The homepage carousel now follows the new sequence.",
          });
        } catch (error) {
          setSlides(previousSlides);
          toast({
            title: "Reorder failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  const handleDrop = (targetSlideId: string) => {
    if (!draggingSlideId || draggingSlideId === targetSlideId) {
      setDraggingSlideId(null);
      setDropTargetSlideId(null);
      return;
    }

    const orderedSlides = sortSlides(slides);
    const sourceIndex = orderedSlides.findIndex((slide) => slide.id === draggingSlideId);
    const targetIndex = orderedSlides.findIndex((slide) => slide.id === targetSlideId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggingSlideId(null);
      setDropTargetSlideId(null);
      return;
    }

    const nextSlides = [...orderedSlides];
    const [movedSlide] = nextSlides.splice(sourceIndex, 1);
    nextSlides.splice(targetIndex, 0, movedSlide);

    setDraggingSlideId(null);
    setDropTargetSlideId(null);
    persistOrder(nextSlides);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
            Homepage control
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Hero Slides</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Manage the homepage carousel headline, imagery, CTA, and mood cues. Drag slides into
            sequence and publish only the ones that should go live.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingSlide(null);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Add Hero Slide
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total slides</p>
          <p className="mt-2 text-3xl font-black text-white">{slides.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Active on homepage</p>
          <p className="mt-2 text-3xl font-black text-white">{activeCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Visible results</p>
          <p className="mt-2 text-3xl font-black text-white">{visibleSlides.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, CTA, tag, or location"
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

      <div className="grid gap-4">
        {visibleSlides.length === 0 ? (
          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 px-6 py-16 text-center text-zinc-400">
            No hero slides match the current filters.
          </div>
        ) : (
          visibleSlides.map((slide) => (
            <div
              key={slide.id}
              draggable
              onDragStart={() => {
                setDraggingSlideId(slide.id);
                setDropTargetSlideId(slide.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDropTargetSlideId(slide.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(slide.id);
              }}
              onDragEnd={() => {
                setDraggingSlideId(null);
                setDropTargetSlideId(null);
              }}
              className={cn(
                "rounded-[1.75rem] border bg-zinc-900 transition-all",
                draggingSlideId === slide.id
                  ? "border-brand-400/50 shadow-[0_18px_48px_rgba(249,115,22,0.18)]"
                  : "border-zinc-800",
                dropTargetSlideId === slide.id && draggingSlideId !== slide.id
                  ? "ring-2 ring-brand-400/40"
                  : ""
              )}
            >
              <div className="grid gap-5 p-5 xl:grid-cols-[320px,minmax(0,1fr)]">
                <div
                  className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-zinc-950"
                  style={getImagePreviewStyle(slide.imageUrl)}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur">
                      <MapPin className="h-3.5 w-3.5 text-brand-300" />
                      {slide.locationBadge}
                    </div>
                    <h2 className="mt-3 text-2xl font-black text-white">{slide.title}</h2>
                    <p className="mt-2 text-sm text-white/75">{slide.subtitle}</p>
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
                          Position {slide.order + 1}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                            slide.isActive
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-zinc-800 text-zinc-400"
                          )}
                        >
                          {slide.isActive ? "Live" : "Hidden"}
                        </span>
                      </div>
                      <p className="mt-4 max-w-3xl text-sm text-zinc-400">{slide.subtitle}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleActive(slide)}
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-600 disabled:opacity-60"
                      >
                        {slide.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {slide.isActive ? "Hide" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSlide(slide);
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
                        onClick={() => handleDelete(slide)}
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
                      <p className="mt-2 text-sm font-semibold text-white">{slide.ctaText}</p>
                      <p className="mt-1 break-all text-sm text-zinc-400">{slide.ctaLink}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-zinc-800 bg-black/30 p-4 md:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                        Mood tags
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {slide.moodTags.length > 0 ? (
                          slide.moodTags.map((tag) => (
                            <span
                              key={`${slide.id}-${tag}`}
                              className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-200"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-zinc-500">No mood tags configured.</span>
                        )}
                      </div>
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
            <p className="font-semibold text-zinc-100">Hero behavior</p>
            <p>
              The homepage auto-plays the active slides in ascending order. Drag cards into
              position, toggle visibility, and update imagery or CTA copy without redeploying.
            </p>
            <p className="inline-flex items-center gap-2 text-zinc-500">
              <ImagePlus className="h-4 w-4" />
              Uploading a replacement image swaps the slide art stored for the homepage.
            </p>
          </div>
        </div>
      </div>

      <HeroFormDialog
        open={dialogOpen}
        slide={editingSlide}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingSlide(null);
          }
        }}
        onSaved={upsertSlide}
      />
    </div>
  );
}
