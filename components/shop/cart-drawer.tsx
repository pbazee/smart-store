"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Smartphone, X } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { formatKES } from "@/lib/utils";

export function CartDrawer() {
  const { hasHydrated, items, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } =
    useCartStore();
  const cartTotal = hasHydrated ? total() : 0;
  const totalItems = hasHydrated ? itemCount() : 0;

  useEffect(() => {
    if (!hasHydrated || !isOpen || items.length > 0) {
      return;
    }

    closeCart();
  }, [closeCart, hasHydrated, isOpen, items.length]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-zinc-950/32 backdrop-blur-[2px] dark:bg-black/60 dark:backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white/95 text-zinc-950 shadow-[0_32px_80px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-border dark:bg-background dark:text-foreground dark:shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-200/80 p-5 dark:border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-brand-500" />
                <h2 className="text-lg font-bold text-zinc-950 dark:text-foreground">
                  Your Cart ({totalItems})
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-inherit dark:hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <ShoppingCart className="h-16 w-16 text-zinc-300 dark:text-muted-foreground/30" />
                  <div>
                    <p className="font-semibold text-zinc-950 dark:text-foreground">
                      Your cart is empty
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-muted-foreground">
                      Add some fire pieces.
                    </p>
                  </div>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="flex w-full items-center justify-center rounded-xl bg-brand-500 py-4 text-center font-bold text-white shadow-[0_12px_24px_rgba(249,115,22,0.25)] transition-all hover:bg-brand-600 active:scale-95"
                  >
                    Shop Now
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.variant.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/95 p-3 shadow-sm dark:border-transparent dark:bg-transparent dark:p-0 dark:shadow-none"
                  >
                    <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-muted">
                      <Image
                        src={item.product.images[0] || "/images/product-placeholder.png"}
                        alt={item.product.name}
                        fill
                        quality={85}
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-zinc-950 dark:text-foreground">
                        {item.product.name}
                      </h4>
                      <p className="mt-0.5 text-xs text-zinc-600 dark:text-muted-foreground">
                        {item.variant.color} · Size {item.variant.size}
                      </p>
                      <p className="mt-1 text-sm font-bold text-brand-600">
                        {formatKES(item.variant.price * item.quantity)}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100 dark:border-border dark:bg-transparent dark:text-inherit dark:shadow-none dark:hover:bg-muted"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold text-zinc-950 dark:text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100 dark:border-border dark:bg-transparent dark:text-inherit dark:shadow-none dark:hover:bg-muted"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.variant.id)}
                          className="ml-auto rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-destructive dark:hover:bg-transparent"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-3 border-t border-zinc-200/80 bg-white/92 p-5 shadow-[0_-18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-border dark:bg-background dark:shadow-none">
                <div className="flex items-center justify-between text-lg font-bold text-zinc-950 dark:text-foreground">
                  <span>Total</span>
                  <span className="text-brand-600">{formatKES(cartTotal)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-muted-foreground">
                  <Smartphone className="h-3.5 w-3.5 text-green-500" />
                  <span>Pay with M-Pesa, Visa, or Mastercard</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full rounded-xl bg-brand-500 py-3.5 text-center font-bold text-white shadow-[0_12px_24px_rgba(249,115,22,0.22)] transition-colors hover:bg-brand-600"
                >
                  Checkout · {formatKES(cartTotal)}
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="block w-full rounded-xl border border-zinc-300 bg-white py-2.5 text-center text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-border dark:bg-transparent dark:text-foreground dark:hover:bg-muted"
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
