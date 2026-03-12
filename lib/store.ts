import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product, ProductVariant } from "@/types";

type AddItemResult = {
  status: "added" | "updated" | "max-stock" | "out-of-stock";
};

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  hasHydrated: boolean;
  addItem: (product: Product, variant: ProductVariant) => AddItemResult;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  total: () => number;
  itemCount: () => number;
  setHasHydrated: (value: boolean) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      hasHydrated: false,
      addItem: (product, variant) => {
        if (variant.stock <= 0) {
          return { status: "out-of-stock" };
        }

        const items = get().items;
        const existing = items.find((i) => i.variant.id === variant.id);
        if (existing) {
          if (existing.quantity >= existing.variant.stock) {
            return { status: "max-stock" };
          }

          set({
            items: items.map((i) =>
              i.variant.id === variant.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
          return { status: "updated" };
        }

        set({ items: [...items, { product, variant, quantity: 1 }] });
        return { status: "added" };
      },
      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variant.id !== variantId) });
      },
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        const existing = get().items.find((item) => item.variant.id === variantId);
        if (!existing) {
          return;
        }

        set({
          items: get().items.map((i) =>
            i.variant.id === variantId
              ? {
                  ...i,
                  quantity: Math.min(quantity, i.variant.stock),
                }
              : i
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      total: () =>
        get().items.reduce(
          (sum, item) => sum + item.variant.price * item.quantity,
          0
        ),
      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "smartest-store-cart",
      version: 2,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<CartStore> | undefined;

        if (!state) {
          return {
            items: [],
            isOpen: false,
            hasHydrated: false,
          };
        }

        if (version < 2) {
          return {
            ...state,
            items: [],
            isOpen: false,
            hasHydrated: false,
          };
        }

        return state;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

interface DemoStore {
  isMockMode: boolean;
  toggleMockMode: () => void;
}

export const useDemoStore = create<DemoStore>((set, get) => ({
  isMockMode: true,
  toggleMockMode: () => set({ isMockMode: !get().isMockMode }),
}));
