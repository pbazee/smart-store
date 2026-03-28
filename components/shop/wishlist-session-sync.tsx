"use client";

import { useWishlistSync } from "@/hooks/use-wishlist";

export function WishlistSessionSync() {
  useWishlistSync();

  return null;
}
