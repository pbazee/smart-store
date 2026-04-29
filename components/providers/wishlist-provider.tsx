"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useWishlist } from "@/hooks/use-wishlist";

const WishlistContext = createContext<ReturnType<typeof useWishlist> | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const wishlist = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null or a skeleton until mounted to prevent hydration mismatch
  // since wishlist data comes from localStorage
  if (!mounted) return null;

  return (
    <WishlistContext.Provider value={wishlist}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlistContext = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlistContext must be used within a WishlistProvider");
  }
  return context;
}
