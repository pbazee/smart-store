"use client";

import { useMemo, useState } from "react";
import type { Category, FilterState } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  categories: Category[];
  lockedCategory?: string;
}

const genders = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "children", label: "Children" },
  { value: "unisex", label: "Unisex" },
];

const colors = [
  { name: "Black", hex: "#111827" },
  { name: "White", hex: "#f9fafb" },
  { name: "Orange", hex: "#f97316" },
  { name: "Green", hex: "#006B3C" },
  { name: "Blue", hex: "#0ea5e9" },
  { name: "Brown", hex: "#92400e" },
  { name: "Grey", hex: "#6b7280" },
  { name: "Red", hex: "#dc2626" },
];

const sizes = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "28",
  "30",
  "32",
  "34",
];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-4 rounded-[1.5rem] border border-zinc-200/80 bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-100"
      >
        {title}
        {open ? (
          <ChevronUp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        )}
      </button>
      {open ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function ShopFilters({ filters, onChange, categories, lockedCategory }: Props) {
  const byParent = useMemo(() => {
    const map = new Map<string | null, Category[]>();
    categories
      .filter((category) => category.isActive !== false)
      .forEach((category) => {
        const key = category.parentId ?? null;
        map.set(key, [...(map.get(key) || []), category]);
      });

    map.forEach((list, key) =>
      map.set(
        key,
        list.sort((left, right) =>
          (left.order ?? 0) === (right.order ?? 0)
            ? left.name.localeCompare(right.name)
            : (left.order ?? 0) - (right.order ?? 0)
        )
      )
    );

    return map;
  }, [categories]);

  const topLevelCategories = byParent.get(null) || [];

  const toggle = (key: "category" | "gender" | "colors" | "sizes", value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  return (
    <div className="rounded-[2rem] border border-zinc-200 bg-white/85 p-4 text-zinc-900 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 dark:text-zinc-100 dark:shadow-none">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-800 dark:text-zinc-100">
          Filters
        </h3>
        <button
          type="button"
          onClick={() =>
            onChange({
              category: lockedCategory ? [lockedCategory] : [],
              gender: [],
              colors: [],
              sizes: [],
              priceRange: [1000, 20000],
              search: "",
              sortBy: filters.sortBy,
            })
          }
          className="text-xs font-semibold text-brand-500 transition hover:text-brand-600"
        >
          Clear All
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>

      {!lockedCategory && (
        <FilterSection title="Category">
          <div className="space-y-3">
            {topLevelCategories.map((category) => {
              const children = byParent.get(category.id) || [];

              return (
                <div
                  key={category.id}
                  className="rounded-[1.25rem] border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    <input
                      type="checkbox"
                      checked={filters.category.includes(category.id)}
                      onChange={() => toggle("category", category.id)}
                      className="h-4 w-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500 dark:border-zinc-600"
                    />
                    {category.name}
                  </label>
                  {children.length > 0 ? (
                    <div className="mt-2 space-y-1 pl-5">
                      {children.map((child) => (
                        <label
                          key={child.id}
                          className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                        >
                          <input
                            type="checkbox"
                            checked={filters.category.includes(child.id)}
                            onChange={() => toggle("category", child.id)}
                            className="h-4 w-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500 dark:border-zinc-600"
                          />
                          {child.name}
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Gender">
        <div className="flex flex-wrap gap-2">
          {genders.map((gender) => (
            <button
              key={gender.value}
              type="button"
              onClick={() => toggle("gender", gender.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                filters.gender.includes(gender.value)
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-zinc-300 bg-white text-zinc-800 hover:border-brand-300 hover:bg-orange-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
              )}
            >
              {gender.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Colors">
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() => toggle("colors", color.name)}
              title={color.name}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                filters.colors.includes(color.name)
                  ? "scale-110 border-brand-500 shadow-[0_0_0_4px_rgba(249,115,22,0.12)]"
                  : "border-zinc-300 dark:border-zinc-600"
              )}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Size">
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggle("sizes", size)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                filters.sizes.includes(size)
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price (KES)">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span>KSh {filters.priceRange[0].toLocaleString()}</span>
            <span>KSh {filters.priceRange[1].toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={1000}
            max={20000}
            step={500}
            value={filters.priceRange[1]}
            onChange={(event) =>
              onChange({
                ...filters,
                priceRange: [filters.priceRange[0], parseInt(event.target.value, 10)],
              })
            }
            className="w-full accent-brand-500"
          />
        </div>
      </FilterSection>
    </div>
  );
}
