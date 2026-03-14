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

const sizes = ["XS", "S", "M", "L", "XL", "36", "37", "38", "39", "40", "41", "42", "43", "28", "30", "32", "34"];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border pb-4 mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold mb-3"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && children}
    </div>
  );
}

export function ShopFilters({ filters, onChange, categories, lockedCategory }: Props) {
  const byParent = useMemo(() => {
    const map = new Map<string | null, Category[]>();
    categories
      .filter((c) => c.isActive !== false)
      .forEach((c) => {
        const key = c.parentId ?? null;
        map.set(key, [...(map.get(key) || []), c]);
      });
    map.forEach((list, key) =>
      map.set(
        key,
        list.sort((a, b) =>
          (a.order ?? 0) === (b.order ?? 0)
            ? a.name.localeCompare(b.name)
            : (a.order ?? 0) - (b.order ?? 0)
        )
      )
    );
    return map;
  }, [categories]);

  const topLevelCategories = byParent.get(null) || [];

  const toggle = (key: "category" | "gender" | "colors" | "sizes", value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm uppercase tracking-wider">Filters</h3>
        <button
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
          className="text-xs text-brand-500 hover:underline"
        >
          Clear All
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {!lockedCategory && (
        <FilterSection title="Category">
          <div className="space-y-3">
            {topLevelCategories.map((cat) => {
              const children = byParent.get(cat.id) || [];
              return (
                <div key={cat.id} className="rounded-lg border border-border/60 p-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={filters.category.includes(cat.id)}
                      onChange={() => toggle("category", cat.id)}
                      className="w-4 h-4 rounded border-border text-brand-500 focus:ring-brand-500"
                    />
                    {cat.name}
                  </label>
                  {children.length > 0 && (
                    <div className="mt-2 space-y-1 pl-5">
                      {children.map((child) => (
                        <label key={child.id} className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={filters.category.includes(child.id)}
                            onChange={() => toggle("category", child.id)}
                            className="w-4 h-4 rounded border-border text-brand-500 focus:ring-brand-500"
                          />
                          {child.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Gender">
        <div className="flex gap-2 flex-wrap">
          {genders.map((g) => (
            <button
              key={g.value}
              onClick={() => toggle("gender", g.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                filters.gender.includes(g.value)
                  ? "bg-brand-500 text-white border-brand-500"
                  : "border-border hover:bg-muted"
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Colors">
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => toggle("colors", color.name)}
              title={color.name}
              className={cn(
                "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                filters.colors.includes(color.name)
                  ? "border-brand-500 scale-110"
                  : "border-border"
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
              onClick={() => toggle("sizes", size)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium border transition-colors",
                filters.sizes.includes(size)
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:bg-muted"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price (KES)">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>KSh {filters.priceRange[0].toLocaleString()}</span>
            <span>KSh {filters.priceRange[1].toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={1000}
            max={20000}
            step={500}
            value={filters.priceRange[1]}
            onChange={(e) => onChange({ ...filters, priceRange: [filters.priceRange[0], parseInt(e.target.value)] })}
            className="w-full accent-brand-500"
          />
        </div>
      </FilterSection>
    </div>
  );
}
