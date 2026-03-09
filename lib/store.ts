import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product, ProductVariant } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, variant: ProductVariant) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (product, variant) => {
        const items = get().items;
        const existing = items.find((i) => i.variant.id === variant.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.variant.id === variant.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...items, { product, variant, quantity: 1 }] });
        }
      },
      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variant.id !== variantId) });
      },
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variant.id === variantId ? { ...i, quantity } : i
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
    }),
    { name: "smartest-store-cart" }
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
