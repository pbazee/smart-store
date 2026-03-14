"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { ShopFilters } from "@/components/shop/shop-filters";
import { getProductListFilterConfig } from "@/lib/catalog-config";
import { filterProductCatalog } from "@/lib/product-filters";
import type { Category, FilterState, Product } from "@/types";

type CatalogBrowserProps = {
  heading: string;
  products: Product[];
  categories: Category[];
  lockedCategory?: string;
};

const defaultPriceRange: [number, number] = [1000, 20000];

function buildFilterState(
  searchParams: Pick<URLSearchParams, "get">,
  lockedCategory?: string
): FilterState {
  return {
    category: lockedCategory
      ? [lockedCategory]
      : searchParams.get("category")
        ? [searchParams.get("category")!]
        : [],
    gender: searchParams.get("gender") ? [searchParams.get("gender")!] : [],
    colors: [],
    sizes: [],
    priceRange: defaultPriceRange,
    search: searchParams.get("search") ?? "",
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() =>
    buildFilterState(searchParams, lockedCategory)
  );
  const tag = searchParams.get("tags");
  const filterKey = searchParams.get("filter");
  const filterConfig = getProductListFilterConfig(filterKey);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      ...buildFilterState(searchParams, lockedCategory),
      colors: current.colors,
      sizes: current.sizes,
      priceRange: current.priceRange,
      sortBy: current.sortBy,
    }));
  }, [lockedCategory, searchParams]);

  const filteredProducts = useMemo(
    () =>
      filterProductCatalog(products, {
        filters,
        categories,
        tag,
        filterKey,
        lockedCategory,
      }),
    [categories, filterKey, filters, lockedCategory, products, tag]
  );
  const displayHeading = heading === "All Products" && filterConfig ? filterConfig.heading : heading;

  const resetFilters = () =>
    setFilters({
      ...buildFilterState(searchParams, lockedCategory),
      sortBy: "featured",
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">{displayHeading}</h1>
          <p className="text-muted-foreground text-sm">{filteredProducts.length} items</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filters.sortBy}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                sortBy: event.target.value,
              }))
            }
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="featured">Featured</option>
            <option value="new">New Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        <div className="hidden lg:block w-64 flex-shrink-0">
          <ShopFilters
            filters={filters}
            onChange={setFilters}
            categories={categories}
            lockedCategory={lockedCategory}
          />
        </div>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-80 bg-background overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={() => setMobileFiltersOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ShopFilters
                filters={filters}
                onChange={setFilters}
                categories={categories}
                lockedCategory={lockedCategory}
              />
            </div>
          </div>
        )}

        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl font-bold mb-2">No products found</p>
              <p className="text-muted-foreground">Try adjusting your filters</p>
              <button
                onClick={resetFilters}
                className="mt-4 px-6 py-2.5 bg-brand-500 text-white rounded-lg font-semibold"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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
