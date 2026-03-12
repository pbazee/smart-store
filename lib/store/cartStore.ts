import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, color: string, size: string) => void;
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
      addItem: (product, color, size) => {
        const variant = product.variants.find(
          (candidate) => candidate.color === color && candidate.size === size
        );

        if (!variant) {
          return;
        }

        const existingItem = get().items.find((item) => item.variant.id === variant.id);
        if (existingItem) {
          set((state) => ({
            items: state.items.map((item) =>
              item.variant.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          }));
          return;
        }

        set((state) => ({
          items: [...state.items, { product, variant, quantity: 1 }],
        }));
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
    { name: "smartest-store-cart" }
  )
);
