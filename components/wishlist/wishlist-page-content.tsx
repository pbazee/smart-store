"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { useWishlist } from "@/hooks/use-wishlist";
import type { Product } from "@/types";

function WishlistSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-[2rem] bg-zinc-900 border border-zinc-800" />
            ))}
        </div>
    );
}

export default function WishlistPageClient() {
  const { productIds, isLoaded, isSignedIn, ensureLoaded } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  useEffect(() => {
    if (isLoaded && productIds.length > 0) {
      setLoading(true);
      // Batch fetch full product details for the IDs we have
      fetch(`/api/products/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: productIds }),
      })
        .then((res) => res.json())
        .then((payload) => setProducts(payload.data || []))
        .finally(() => setLoading(false));
    } else if (isLoaded && productIds.length === 0) {
      setProducts([]);
    }
  }, [isLoaded, productIds]);

  if (!isLoaded) {
    return (
        <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
    );
  }

  if (!isSignedIn) {
      return (
          <div className="mx-auto max-w-7xl px-4 py-20 text-center">
              <h1 className="text-3xl font-black">Sign in to see your wishlist</h1>
              <p className="mt-4 text-zinc-400">Save items while you're signed in to access them anywhere.</p>
              <Link href="/sign-in?redirect_url=/wishlist" className="mt-8 inline-flex rounded-full bg-orange-500 px-8 py-4 text-sm font-black text-white">
                  Sign In
              </Link>
          </div>
      );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-500">
            <Heart className="h-4 w-4 fill-orange-500" />
            <span className="text-xs font-bold uppercase tracking-[0.24em]">Wishlist</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-black tracking-tight">
            Saved for later
          </h1>
          <p className="mt-2 text-muted-foreground">
            {productIds.length} saved item{productIds.length === 1 ? "" : "s"} ready for your next
            move.
          </p>
        </div>
      </div>

      {loading ? (
        <WishlistSkeleton />
      ) : products.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-zinc-800 bg-zinc-950 px-6 py-20 text-center">
          <h2 className="text-2xl font-black">Your wishlist is empty</h2>
          <p className="mt-3 text-muted-foreground">
            Start saving the best drops so you can come back when the timing feels right.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex rounded-full bg-orange-500 px-8 py-4 text-sm font-black text-white transition-all hover:bg-orange-600 hover:scale-105"
          >
            Explore the shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
