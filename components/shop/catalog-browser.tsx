"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Check, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { ShopFilters } from "@/components/shop/shop-filters";
import { resolveCatalogFilterSelections } from "@/lib/catalog-routing";
import { filterProductCatalog } from "@/lib/product-filters";
import { cn } from "@/lib/utils";
import type { Category, FilterState, Product } from "@/types";

type CatalogBrowserProps = {
  heading: string;
  products: Product[];
  categories: Category[];
  lockedCategory?: string;
};

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "new", label: "New Arrivals" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

function getProductPriceBounds(products: Product[]): [number, number] {
  if (products.length === 0) {
    return [0, 0];
  }

  return products.reduce<[number, number]>(
    (bounds, product) => [
      Math.min(bounds[0], product.basePrice),
      Math.max(bounds[1], product.basePrice),
    ],
    [products[0].basePrice, products[0].basePrice]
  );
}

function buildFilterState(
  queryState: {
    category: string | null;
    subcategory: string | null;
    gender: string | null;
    search: string;
  },
  categories: Category[],
  priceBounds: [number, number],
  lockedCategory?: string
): FilterState {
  const selections = resolveCatalogFilterSelections(
    {
      category: queryState.category,
      subcategory: queryState.subcategory,
      gender: queryState.gender,
    },
    categories,
    lockedCategory
  );

  return {
    category: selections.category,
    gender: selections.gender,
    colors: [],
    sizes: [],
    priceRange: priceBounds,
    search: queryState.search,
    sortBy: "featured",
  };
}

export function CatalogBrowser({
  heading,
  products,
  categories,
  lockedCategory,
}: CatalogBrowserProps) {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const priceBounds = useMemo(() => getProductPriceBounds(products), [products]);
  const queryState = useMemo(
    () => ({
      category: searchParams.get("category"),
      subcategory: searchParams.get("subcategory"),
      gender: searchParams.get("gender"),
      search: searchParams.get("search") ?? "",
      tag: searchParams.get("tag"),
      tags: searchParams.get("tags"),
    }),
    [searchParamsKey]
  );
  const filterStateFromUrl = useMemo(
    () => buildFilterState(queryState, categories, priceBounds, lockedCategory),
    [categories, lockedCategory, priceBounds, queryState]
  );
  const [filters, setFilters] = useState<FilterState>(() =>
    buildFilterState(queryState, categories, priceBounds, lockedCategory)
  );
  const deferredFilters = useDeferredValue(filters);
  const tag = queryState.tag ?? queryState.tags;

  useEffect(() => {
    setFilters(filterStateFromUrl);
  }, [filterStateFromUrl]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSortMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredProducts = useMemo(
    () =>
      filterProductCatalog(products, {
        filters: deferredFilters,
        categories,
        tag,
        lockedCategory,
      }),
    [categories, deferredFilters, lockedCategory, products, tag]
  );

  const selectedSortLabel =
    sortOptions.find((option) => option.value === filters.sortBy)?.label || "Featured";
  const hasCatalogProducts = products.length > 0;

  const resetFilters = () =>
    setFilters({
      ...buildFilterState(queryState, categories, priceBounds, lockedCategory),
      sortBy: "featured",
    });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 dark:text-zinc-50">{heading}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{filteredProducts.length} items</p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <div ref={sortMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setSortMenuOpen((current) => !current)}
              className="inline-flex min-w-[12rem] items-center justify-between gap-3 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition hover:border-brand-400 hover:bg-orange-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-brand-400/60 dark:hover:bg-zinc-800"
              aria-haspopup="listbox"
              aria-expanded={sortMenuOpen}
            >
              <span>{selectedSortLabel}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  sortMenuOpen ? "rotate-180" : "rotate-0"
                )}
              />
            </button>

            {sortMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-[14rem] overflow-hidden rounded-3xl border border-zinc-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.16)] dark:border-zinc-800 dark:bg-zinc-950">
                <div className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Sort by
                </div>
                <div role="listbox" aria-label="Sort products">
                  {sortOptions.map((option) => {
                    const active = option.value === filters.sortBy;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setFilters((current) => ({ ...current, sortBy: option.value }));
                          setSortMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition",
                          active
                            ? "bg-brand-500 text-white"
                            : "text-zinc-700 hover:bg-orange-50 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
                        )}
                      >
                        <span>{option.label}</span>
                        {active ? <Check className="h-4 w-4" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition hover:border-brand-400 hover:bg-orange-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-brand-400/60 dark:hover:bg-zinc-800 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        <div className="hidden w-72 flex-shrink-0 lg:block">
          <ShopFilters
            filters={filters}
            onChange={setFilters}
            categories={categories}
            priceBounds={priceBounds}
            lockedCategory={lockedCategory}
          />
        </div>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-3/4 max-w-sm overflow-y-auto border-l border-zinc-300 bg-[#fffaf5] p-5 text-zinc-950 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Filters</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Refine the product list for mobile browsing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-full border border-zinc-200 p-2 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <ShopFilters
                filters={filters}
                onChange={setFilters}
                categories={categories}
                priceBounds={priceBounds}
                lockedCategory={lockedCategory}
                variant="modal"
              />

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex-1 rounded-full border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Clear Filters
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 rounded-full bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="rounded-[2rem] border border-zinc-200 bg-white/80 py-20 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="mb-2 text-xl font-bold text-zinc-950 dark:text-zinc-100">
                {hasCatalogProducts ? "No products match these filters" : "No products found"}
              </p>
              <p className="mx-auto max-w-md text-zinc-600 dark:text-zinc-400">
                {hasCatalogProducts
                  ? "Try adjusting or clearing your current filters to bring products back into view."
                  : "This filter combination has no products yet. You can reset the current filters or browse the full catalog."}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={resetFilters}
                  className="rounded-full bg-brand-500 px-6 py-2.5 font-semibold text-white"
                >
                  Clear Filters
                </button>
                <Link
                  href="/shop"
                  className="rounded-full border border-zinc-300 px-6 py-2.5 font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  Browse All Products
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
