"use client";
import { useCartStore } from "@/lib/store";
import { buildProductHref } from "@/lib/product-routes";
import { formatKES } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, X, Smartphone, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const { hasHydrated, items, removeItem, updateQuantity, total, clearCart, itemCount } =
    useCartStore();
  const cartTotal = hasHydrated ? total() : 0;
  const totalItems = hasHydrated ? itemCount() : 0;

  if (!hasHydrated) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(2)].map((_, index) => (
                <div key={index} className="h-36 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
            <div className="h-72 rounded-2xl bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🛍️</div>
        <h1 className="text-2xl font-black mb-3">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Add some fire pieces to your cart!</p>
        <Link href="/shop" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-[0_12px_24px_rgba(249,115,22,0.25)] active:scale-95">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/shop" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-black">Your Cart ({totalItems} items)</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.variant.id}
                layout
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-4 p-4 border border-border rounded-xl bg-card"
              >
                <div className="w-24 h-28 rounded-lg overflow-hidden relative flex-shrink-0">
                  <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="96px" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <Link href={buildProductHref(item.product)} className="font-bold hover:text-brand-500 transition-colors">
                      {item.product.name}
                    </Link>
                    <button onClick={() => removeItem(item.variant.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.variant.color} · Size {item.variant.size}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 border border-border rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(item.variant.id, item.quantity - 1)} className="p-2 hover:bg-muted transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variant.id, item.quantity + 1)} className="p-2 hover:bg-muted transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-bold text-brand-600">{formatKES(item.variant.price * item.quantity)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="border border-border rounded-2xl p-6 bg-card sticky top-20 space-y-4">
            <h2 className="font-bold text-lg">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatKES(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-green-600">Free (Nairobi)</span>
              </div>
            </div>
            <div className="border-t border-border pt-4 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-brand-600">{formatKES(cartTotal)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Smartphone className="w-3.5 h-3.5 text-green-500" />
              <span>Pay with M-Pesa, Visa, or Mastercard</span>
            </div>
            <Link href="/checkout" className="block w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-center transition-colors">
              Proceed to Checkout
            </Link>
            <button onClick={clearCart} className="block w-full py-2 text-sm text-muted-foreground hover:text-destructive text-center transition-colors">
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
