import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, color: string, size: string) => void;
  removeItem: (variantKey: string) => void;
  updateQuantity: (variantKey: string, quantity: number) => void;
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
        const variantKey = `${product.id}-${color}-${size}`;
        const existingItem = get().items.find((i) => i.variantKey === variantKey);
        if (existingItem) {
          set((state) => ({
            items: state.items.map((item) =>
              item.variantKey === variantKey ? { ...item, quantity: item.quantity + 1 } : item
            ),
          }));
        } else {
          set((state) => ({
            items: [...state.items, { product, selectedColor: color, selectedSize: size, quantity: 1, variantKey }],
          }));
        }
      },
      removeItem: (variantKey) => set((state) => ({ items: state.items.filter((item) => item.variantKey !== variantKey) })),
      updateQuantity: (variantKey, quantity) => {
        if (quantity <= 0) { get().removeItem(variantKey); return; }
        set((state) => ({ items: state.items.map((item) => item.variantKey === variantKey ? { ...item, quantity } : item) }));
      },
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: () => get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    }),
    { name: "smartest-store-cart" }
  )
);
