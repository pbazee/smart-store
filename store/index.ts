import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product, FilterState } from "@/types";

// ─── Cart Store ──────────────────────────────────────────────────────────────
interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        const existing = get().items.find((i) => i.variantId === newItem.variantId);
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.variantId === newItem.variantId
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            ),
          }));
        } else {
          set((s) => ({ items: [...s.items, newItem] }));
        }
      },

      removeItem: (variantId) =>
        set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set((s) => ({
          items: s.items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
        }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "ske-cart" }
  )
);

// ─── Demo/Mock Store ──────────────────────────────────────────────────────────
interface DemoStore {
  useMockData: boolean;
  toggleMockData: () => void;
}

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false",
      toggleMockData: () => set((s) => ({ useMockData: !s.useMockData })),
    }),
    { name: "ske-demo" }
  )
);

// ─── Filter Store ─────────────────────────────────────────────────────────────
interface FilterStore {
  filters: FilterState;
  setCategory: (category: FilterState["category"]) => void;
  toggleColor: (color: string) => void;
  toggleSize: (size: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setSortBy: (sortBy: FilterState["sortBy"]) => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  category: "all",
  colors: [],
  sizes: [],
  priceRange: [1000, 20000],
  sortBy: "newest",
  search: "",
};

export const useFilterStore = create<FilterStore>()((set) => ({
  filters: defaultFilters,

  setCategory: (category) => set((s) => ({ filters: { ...s.filters, category } })),

  toggleColor: (color) =>
    set((s) => ({
      filters: {
        ...s.filters,
        colors: s.filters.colors.includes(color)
          ? s.filters.colors.filter((c) => c !== color)
          : [...s.filters.colors, color],
      },
    })),

  toggleSize: (size) =>
    set((s) => ({
      filters: {
        ...s.filters,
        sizes: s.filters.sizes.includes(size)
          ? s.filters.sizes.filter((sz) => sz !== size)
          : [...s.filters.sizes, size],
      },
    })),

  setPriceRange: (range) => set((s) => ({ filters: { ...s.filters, priceRange: range } })),

  setSortBy: (sortBy) => set((s) => ({ filters: { ...s.filters, sortBy } })),

  setSearch: (search) => set((s) => ({ filters: { ...s.filters, search } })),

  resetFilters: () => set({ filters: defaultFilters }),
}));

// ─── Wishlist Store ───────────────────────────────────────────────────────────
interface WishlistStore {
  productIds: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (id) =>
        set((s) => ({
          productIds: s.productIds.includes(id)
            ? s.productIds.filter((p) => p !== id)
            : [...s.productIds, id],
        })),
      has: (id) => get().productIds.includes(id),
    }),
    { name: "ske-wishlist" }
  )
);
