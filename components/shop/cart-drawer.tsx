"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, ShoppingCart, Smartphone } from "lucide-react";
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
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-500" />
                <h2 className="font-bold text-lg">Your Cart ({totalItems})</h2>
              </div>
              <button onClick={closeCart} className="p-1.5 rounded-md hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <ShoppingCart className="w-16 h-16 text-muted-foreground/30" />
                  <div>
                    <p className="font-semibold">Your cart is empty</p>
                    <p className="text-sm text-muted-foreground mt-1">Add some fire pieces! 🔥</p>
                  </div>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors"
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
                    className="flex gap-3"
                  >
                    <div className="w-20 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                      <Image
                        src={item.product.images[0] || "/images/product-placeholder.png"}
                        alt={item.product.name}
                        fill
                        quality={85}
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{item.product.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.variant.color} · Size {item.variant.size}
                      </p>
                      <p className="font-bold text-brand-600 text-sm mt-1">
                        {formatKES(item.variant.price * item.quantity)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.variant.id)}
                          className="ml-auto p-1 hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-border space-y-3">
                <div className="flex items-center justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-brand-600">{formatKES(cartTotal)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Smartphone className="w-3.5 h-3.5 text-green-500" />
                  <span>Pay with M-Pesa, Visa, or Mastercard</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-center transition-colors"
                >
                  Checkout · {formatKES(cartTotal)}
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="block w-full py-2.5 border border-border hover:bg-muted font-semibold rounded-xl text-center text-sm transition-colors"
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
