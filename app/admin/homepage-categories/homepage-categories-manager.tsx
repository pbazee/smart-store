"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { ImagePlus, LayoutGrid, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { deleteAdminHomepageCategoryAction } from "@/app/admin/homepage-categories/actions";
import { HomepageCategoryFormDialog } from "@/app/admin/homepage-categories/homepage-category-form-dialog";
import { useToast } from "@/lib/use-toast";
import type { HomepageCategory } from "@/types";

function getImagePreviewStyle(imageUrl: string) {
  return imageUrl
    ? {
        backgroundImage: `url("${imageUrl}")`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }
    : undefined;
}

export function HomepageCategoriesManager({
  initialCategories,
}: {
  initialCategories: HomepageCategory[];
}) {
  const { toast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingCategory, setEditingCategory] = useState<HomepageCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const visibleCategories = useMemo(() => {
    return [...categories]
      .filter((category) => {
        const matchesSearch =
          !deferredSearch.trim() ||
          [category.title, category.subtitle || "", category.link]
            .join(" ")
            .toLowerCase()
            .includes(deferredSearch.trim().toLowerCase());

        const matchesFilter =
          filter === "all" || (filter === "active" ? category.isActive : !category.isActive);

        return matchesSearch && matchesFilter;
      })
      .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
  }, [categories, deferredSearch, filter]);

  const handleSavedCategory = (category: HomepageCategory) => {
    setCategories((current) => {
      const exists = current.some((item) => item.id === category.id);
      if (exists) {
        return current.map((item) => (item.id === category.id ? category : item));
      }

      return [category, ...current];
    });
  };

  const handleDelete = async (category: HomepageCategory) => {
    const confirmed = window.confirm(`Delete "${category.title}" from the homepage grid?`);

    if (!confirmed) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await deleteAdminHomepageCategoryAction(category.id);
          setCategories((current) => current.filter((item) => item.id !== category.id));
          toast({
            title: "Homepage category deleted",
            description: "The homepage grid was updated successfully.",
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

  const activeCount = categories.filter((category) => category.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
            Homepage control
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Homepage Categories</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage the category cards, links, and imagery that appear on the landing page.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCategory(null);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Add New Category
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total categories</p>
          <p className="mt-2 text-3xl font-black text-white">{categories.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Active on homepage</p>
          <p className="mt-2 text-3xl font-black text-white">{activeCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Visible results</p>
          <p className="mt-2 text-3xl font-black text-white">{visibleCategories.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, subtitle, or link"
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
                  Image
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Title
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Link
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
              {visibleCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-400">
                    No homepage categories match the current filters.
                  </td>
                </tr>
              ) : (
                visibleCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-zinc-800/70 transition-colors hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-4 align-middle">
                      <div
                        className="h-16 w-12 rounded-2xl bg-zinc-800"
                        style={getImagePreviewStyle(category.imageUrl)}
                      />
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="max-w-sm">
                        <p className="font-semibold text-zinc-100">{category.title}</p>
                        {category.subtitle && (
                          <p className="mt-1 text-xs text-zinc-500">{category.subtitle}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <p className="max-w-xs break-all text-sm text-zinc-300">{category.link}</p>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          category.isActive
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm font-semibold text-zinc-200">
                      {category.order}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(category);
                            setDialogOpen(true);
                          }}
                          className="rounded-xl border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-brand-400 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => void handleDelete(category)}
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
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-brand-500/15 p-3 text-brand-300">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-sm text-zinc-400">
            <p className="font-semibold text-zinc-100">Homepage behavior</p>
            <p>
              Cards render in ascending order, inactive rows stay out of the landing page, and the
              grid refreshes after every create, edit, and delete.
            </p>
            <p className="inline-flex items-center gap-2 text-zinc-500">
              <ImagePlus className="h-4 w-4" />
              Uploading a new image replaces the saved artwork for that card.
            </p>
          </div>
        </div>
      </div>

      <HomepageCategoryFormDialog
        open={dialogOpen}
        category={editingCategory}
        onOpenChange={setDialogOpen}
        onSaved={handleSavedCategory}
      />
    </div>
  );
}
