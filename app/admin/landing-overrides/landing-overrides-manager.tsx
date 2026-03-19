"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Reorder } from "framer-motion";
import {
  Calendar,
  Grip,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  deleteLandingOverrideAction,
  fetchLandingOverridesAction,
  reorderLandingOverridesAction,
  searchProductsAction,
  upsertLandingOverrideAction,
} from "@/app/admin/landing-overrides/actions";
import { LANDING_SECTIONS } from "@/lib/landing-section-overrides";
import { cn } from "@/lib/utils";
import type { LandingSection, LandingSectionOverride, Product } from "@/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SECTION_LABELS: Record<LandingSection, string> = {
  popular: "Popular Products",
  trending: "Trending Products",
  new_arrivals: "New Arrivals",
  recommended: "Recommended Products",
};

type OverridesBySection = Record<LandingSection, LandingSectionOverride[]>;

type FormState = {
  id?: number;
  productId: string;
  priority: number;
  activeFrom?: string;
  activeUntil?: string;
};

function groupOverrides(list: LandingSectionOverride[]): OverridesBySection {
  return LANDING_SECTIONS.reduce<OverridesBySection>((acc, section) => {
    acc[section] = list
      .filter((item) => item.section === section)
      .sort((a, b) => a.priority - b.priority || a.id - b.id);
    return acc;
  }, {
    popular: [],
    trending: [],
    new_arrivals: [],
    recommended: [],
  } as OverridesBySection);
}

function formatDisplayDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateInput(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function getProductThumb(product: Product) {
  const src = product.images?.[0] ?? "/og-image.jpg";
  return (
    <Image
      src={src}
      alt={product.name}
      width={64}
      height={64}
      className="h-12 w-12 rounded-md object-cover border border-border/70 bg-muted"
    />
  );
}

export function LandingOverridesManager({
  initialOverrides,
  products,
}: {
  initialOverrides: LandingSectionOverride[];
  products: Product[];
}) {
  const [overridesBySection, setOverridesBySection] = useState<OverridesBySection>(
    () => groupOverrides(initialOverrides)
  );
  const [activeSection, setActiveSection] = useState<LandingSection>("popular");
  const [availableProducts, setAvailableProducts] = useState<Product[]>(products);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>({
    productId: products[0]?.id ?? "",
    priority: 0,
  });

  const activeOverrides = overridesBySection[activeSection];

  const sortedProducts = useMemo(
    () =>
      availableProducts
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [availableProducts]
  );

  const activeProduct = sortedProducts.find((p) => p.id === form.productId);

  async function refreshOverrides() {
    const next = await fetchLandingOverridesAction();
    setOverridesBySection(groupOverrides(next));
  }

  function resetForm(section: LandingSection) {
    setForm({
      id: undefined,
      productId: sortedProducts[0]?.id ?? "",
      priority: overridesBySection[section]?.length ?? 0,
      activeFrom: "",
      activeUntil: "",
    });
  }

  function onAddClick() {
    resetForm(activeSection);
    setIsDialogOpen(true);
  }

  function onEdit(override: LandingSectionOverride) {
    setForm({
      id: override.id,
      productId: override.productId,
      priority: override.priority,
      activeFrom: formatDateInput(override.activeFrom),
      activeUntil: formatDateInput(override.activeUntil),
    });
    setIsDialogOpen(true);
  }

  function updateLocalSection(section: LandingSection, next: LandingSectionOverride[]) {
    setOverridesBySection((current) => ({
      ...current,
      [section]: next,
    }));
  }

  const handleReorder = (nextOrder: LandingSectionOverride[]) => {
    updateLocalSection(activeSection, nextOrder);
    startTransition(async () => {
      await reorderLandingOverridesAction({
        section: activeSection,
        orderedIds: nextOrder.map((item) => item.id),
      });
      await refreshOverrides();
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      await deleteLandingOverrideAction(id);
      await refreshOverrides();
    });
  };

  const handleSearch = (query: string) => {
    startTransition(async () => {
      const results = await searchProductsAction(query);
      setAvailableProducts(results);
    });
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const override = await upsertLandingOverrideAction({
        id: form.id,
        section: activeSection,
        productId: form.productId,
        priority: Number.isFinite(form.priority) ? form.priority : 0,
        activeFrom: form.activeFrom || null,
        activeUntil: form.activeUntil || null,
      });

      setIsDialogOpen(false);
      updateLocalSection(activeSection, [
        ...overridesBySection[activeSection].filter((item) => item.id !== override.id),
        override,
      ].sort((a, b) => a.priority - b.priority || a.id - b.id));
      await refreshOverrides();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-amber-400">
            <MapPin className="h-4 w-4" />
            Landing page overrides
          </div>
          <h1 className="mt-1 text-3xl font-black text-white">Pin products per section</h1>
          <p className="text-sm text-zinc-400">
            Overrides always appear first; auto-logic fills the rest.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refreshOverrides()}
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
            disabled={isPending}
          >
            <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition hover:scale-[1.02] hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            Add Override
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {LANDING_SECTIONS.map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition",
              activeSection === section
                ? "border-brand-500 bg-brand-500/10 text-brand-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
            )}
          >
            {SECTION_LABELS[section]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
        {activeOverrides.length === 0 ? (
          <div className="flex items-center justify-between rounded-xl border border-dashed border-zinc-800 p-6 text-zinc-400">
            <div>
              <p className="text-base font-semibold">No overrides for this section.</p>
              <p className="text-sm text-zinc-500">
                Use "Add Override" to map a product to the top of this section.
              </p>
            </div>
            <button
              onClick={onAddClick}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              Add Override
            </button>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={activeOverrides}
            onReorder={handleReorder}
            className="space-y-3"
          >
            {activeOverrides.map((override) => (
              <Reorder.Item
                key={override.id}
                value={override}
                className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
              >
                <Grip className="h-5 w-5 text-zinc-500" />
                {getProductThumb(override.product)}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{override.product.name}</p>
                  <p className="text-xs text-zinc-500">{override.product.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1 font-semibold">
                      Priority {override.priority}
                    </span>
                    <span className="inline-flex items-center gap-1 text-zinc-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDisplayDate(override.activeFrom)} → {formatDisplayDate(override.activeUntil)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(override)}
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(override.id)}
                    className="rounded-lg border border-red-700/60 px-3 py-2 text-xs font-semibold text-red-200 transition hover:border-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-xl border border-zinc-800 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit override" : "Add override"}</DialogTitle>
            <DialogDescription>
              Select a product, set its priority, and optionally define active dates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                onChange={(event) => handleSearch(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-200">Product</label>
              <select
                value={form.productId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, productId: event.target.value }))
                }
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
              >
                {sortedProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200">Priority</label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, priority: Number(event.target.value) }))
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200">Active From</label>
                <input
                  type="datetime-local"
                  value={form.activeFrom ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, activeFrom: event.target.value || "" }))
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200">Active Until</label>
                <input
                  type="datetime-local"
                  value={form.activeUntil ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, activeUntil: event.target.value || "" }))
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {activeProduct && (
              <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                {getProductThumb(activeProduct)}
                <div>
                  <p className="text-sm font-semibold text-white">{activeProduct.name}</p>
                  <p className="text-xs text-zinc-500">{activeProduct.slug}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <DialogClose asChild>
              <button className="rounded-lg border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition hover:scale-[1.02] hover:bg-brand-600"
              disabled={isPending}
            >
              Save override
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
