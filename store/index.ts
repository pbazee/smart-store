import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, FilterState } from "@/types";

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
        const existing = get().items.find((item) => item.variant.id === newItem.variant.id);
        if (existing) {
          set((state) => ({
            items: state.items.map((item) =>
              item.variant.id === newItem.variant.id
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            ),
          }));
          return;
        }

        set((state) => ({ items: [...state.items, newItem] }));
      },
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variant.id !== variantId),
        })),
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.variant.id === variantId ? { ...item, quantity } : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: () =>
        get().items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0),
    }),
    { name: "ske-cart" }
  )
);

interface DemoStore {
  useMockData: boolean;
  toggleMockData: () => void;
}

export const useDemoStore = create<DemoStore>()(
  persist(
    (set) => ({
      useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false",
      toggleMockData: () => set((state) => ({ useMockData: !state.useMockData })),
    }),
    { name: "ske-demo" }
  )
);

interface FilterStore {
  filters: FilterState;
  setCategory: (category: string[]) => void;
  toggleColor: (color: string) => void;
  toggleSize: (size: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setSortBy: (sortBy: string) => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  category: [],
  subcategory: [],
  gender: [],
  colors: [],
  sizes: [],
  priceRange: [1000, 20000],
  sortBy: "newest",
  search: "",
};

export const useFilterStore = create<FilterStore>()((set) => ({
  filters: defaultFilters,
  setCategory: (category) =>
    set((state) => ({ filters: { ...state.filters, category } })),
  toggleColor: (color) =>
    set((state) => ({
      filters: {
        ...state.filters,
        colors: state.filters.colors.includes(color)
          ? state.filters.colors.filter((value) => value !== color)
          : [...state.filters.colors, color],
      },
    })),
  toggleSize: (size) =>
    set((state) => ({
      filters: {
        ...state.filters,
        sizes: state.filters.sizes.includes(size)
          ? state.filters.sizes.filter((value) => value !== size)
          : [...state.filters.sizes, size],
      },
    })),
  setPriceRange: (priceRange) =>
    set((state) => ({ filters: { ...state.filters, priceRange } })),
  setSortBy: (sortBy) =>
    set((state) => ({ filters: { ...state.filters, sortBy } })),
  setSearch: (search) =>
    set((state) => ({ filters: { ...state.filters, search } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));

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
        set((state) => ({
          productIds: state.productIds.includes(id)
            ? state.productIds.filter((productId) => productId !== id)
            : [...state.productIds, id],
        })),
      has: (id) => get().productIds.includes(id),
    }),
    { name: "ske-wishlist" }
  )
);
