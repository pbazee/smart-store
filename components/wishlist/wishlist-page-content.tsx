"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, X, ShoppingBag } from "lucide-react";
import useSWR from "swr";
import { InlineLoader } from "@/components/ui/ripple-loader";
import { useWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/lib/use-toast";
import { jsonFetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

type WishlistProductsResponse = {
  success: boolean;
  data: Product[];
};

async function fetchWishlistProducts(productIds: string[]) {
  const payload = await jsonFetcher<WishlistProductsResponse>("/api/products/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: productIds }),
  });
  return payload.data ?? [];
}

// IDs being animated out (exit animation before DOM removal)
type RemovingState = Record<string, boolean>;

export default function WishlistPageClient() {
  const { productIds, isLoading, isLoaded, isSignedIn, isSyncing, ensureLoaded, toggle } = useWishlist();
  const { toast } = useToast();
  const productIdsKey = productIds.join(",");

  const {
    data: fetchedProducts = [],
    isLoading: isLoadingProducts,
    error,
    mutate,
  } = useSWR(
    isLoaded && productIds.length > 0 ? ["wishlist-products", productIdsKey] : null,
    () => fetchWishlistProducts(productIds),
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
    }
  );

  // Local display list — allows instant removal without waiting for API
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  // Tracks which product IDs are in the exit-animation phase
  const [removingIds, setRemovingIds] = useState<RemovingState>({});

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  // Sync fetched products into local display state
  useEffect(() => {
    if (fetchedProducts.length > 0) {
      setDisplayProducts(fetchedProducts);
    }
  }, [fetchedProducts]);

  // ─── INSTANT REMOVE ──────────────────────────────────────────────────────────
  const handleRemove = useCallback(
    async (product: Product) => {
      // 1. Immediately start exit animation
      setRemovingIds((prev) => ({ ...prev, [product.id]: true }));

      // 2. After animation completes (~200 ms), remove from display list
      setTimeout(() => {
        setDisplayProducts((prev) => prev.filter((p) => p.id !== product.id));
        setRemovingIds((prev) => {
          const next = { ...prev };
          delete next[product.id];
          return next;
        });
      }, 200);

      // 3. Fire API call in the background — non-blocking
      try {
        const result = await toggle(product.id);
        if (result && !result.ok && result.reason !== "updated") {
          // Rollback: add the product back
          setDisplayProducts((prev) =>
            prev.some((p) => p.id === product.id) ? prev : [product, ...prev]
          );
          toast({
            title: "Could not remove item",
            description: "Please try again.",
            variant: "destructive",
          });
        } else {
          // Keep SWR in sync
          void mutate();
        }
      } catch {
        // Rollback on unexpected error
        setDisplayProducts((prev) =>
          prev.some((p) => p.id === product.id) ? prev : [product, ...prev]
        );
        toast({
          title: "Could not remove item",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    },
    [toggle, toast, mutate]
  );

  if (!isLoaded || isLoading) {
    return <InlineLoader label="Loading wishlist..." />;
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black">Sign in to see your wishlist</h1>
        <p className="mt-4 text-zinc-400">
          Save items while you&apos;re signed in to access them anywhere.
        </p>
        <Link
          href="/sign-in?redirect_url=/wishlist"
          className="mt-8 inline-flex rounded-full bg-orange-500 px-8 py-4 text-sm font-black text-white"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Determine effective product count — use displayProducts when loaded, else productIds length
  const effectiveCount = isLoadingProducts ? productIds.length : displayProducts.length;

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
            {effectiveCount} saved item{effectiveCount === 1 ? "" : "s"} ready for your next move.
          </p>
        </div>
      </div>

      {isLoadingProducts && displayProducts.length === 0 && isSyncing ? (
        <InlineLoader label="Loading wishlist..." />
      ) : error ? (
        <div className="rounded-[2.5rem] border border-dashed border-zinc-800 bg-zinc-950 px-6 py-16 text-center">
          <h2 className="text-2xl font-black">Could not load saved items</h2>
          <p className="mt-3 text-muted-foreground">
            Your wishlist IDs are still stored locally, but the product details could not be
            refreshed right now.
          </p>
          <button
            type="button"
            onClick={() => void mutate()}
            className="mt-8 inline-flex rounded-full border border-zinc-700 px-8 py-4 text-sm font-black text-white transition hover:border-orange-500"
          >
            Retry
          </button>
        </div>
      ) : displayProducts.length === 0 ? (
        // Show empty state INSTANTLY (no API wait) when all items removed
        <div className="rounded-[2.5rem] border border-dashed border-zinc-800 bg-zinc-950 px-6 py-20 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-zinc-600" />
          <h2 className="mt-4 text-2xl font-black">Your wishlist is empty</h2>
          <p className="mt-3 text-muted-foreground">
            Start saving the best drops so you can come back when the timing feels right.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex rounded-full bg-orange-500 px-8 py-4 text-sm font-black text-white transition-all hover:scale-105 hover:bg-orange-600"
          >
            Explore the shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-200",
                removingIds[product.id]
                  ? "pointer-events-none opacity-0 scale-95"
                  : "opacity-100 scale-100"
              )}
            >
              {/* Remove button — top-right corner */}
              <button
                type="button"
                aria-label={`Remove ${product.name} from wishlist`}
                onClick={() => handleRemove(product)}
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-red-500/90 active:scale-90"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              {/* Product image */}
              <Link href={`/product/${product.slug}`} className="block aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-zinc-400" />
                  </div>
                )}
              </Link>

              {/* Product info */}
              <div className="p-3">
                <Link href={`/product/${product.slug}`}>
                  <p className="line-clamp-2 text-sm font-semibold leading-snug hover:text-orange-500 transition-colors">
                    {product.name}
                  </p>
                </Link>
                <p className="mt-1 text-sm font-black text-orange-500">
                  KSh {(product.basePrice ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
