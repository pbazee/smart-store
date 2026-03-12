"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { useSessionUser } from "@/hooks/use-session-user";

type WishlistState = {
  productIds: string[];
  loadedForUserId: string | null;
  loadingForUserId: string | null;
  setWishlist: (productIds: string[], userId: string) => void;
  setLoadingForUserId: (userId: string | null) => void;
  reset: () => void;
};

const useWishlistState = create<WishlistState>((set) => ({
  productIds: [],
  loadedForUserId: null,
  loadingForUserId: null,
  setWishlist: (productIds, userId) =>
    set({
      productIds,
      loadedForUserId: userId,
      loadingForUserId: null,
    }),
  setLoadingForUserId: (userId) => set({ loadingForUserId: userId }),
  reset: () =>
    set({
      productIds: [],
      loadedForUserId: null,
      loadingForUserId: null,
    }),
}));

export function useWishlist() {
  const { isSignedIn, sessionUser, isLoaded } = useSessionUser();
  const productIds = useWishlistState((state) => state.productIds);
  const loadedForUserId = useWishlistState((state) => state.loadedForUserId);
  const loadingForUserId = useWishlistState((state) => state.loadingForUserId);
  const setWishlist = useWishlistState((state) => state.setWishlist);
  const setLoadingForUserId = useWishlistState((state) => state.setLoadingForUserId);
  const reset = useWishlistState((state) => state.reset);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !sessionUser) {
      reset();
      return;
    }

    if (
      loadedForUserId === sessionUser.id ||
      loadingForUserId === sessionUser.id
    ) {
      return;
    }

    setLoadingForUserId(sessionUser.id);

    void fetch("/api/wishlist", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        setWishlist(payload?.data?.productIds ?? [], sessionUser.id);
      })
      .catch((error) => {
        console.error("Failed to load wishlist:", error);
        setLoadingForUserId(null);
      });
  }, [
    isLoaded,
    isSignedIn,
    sessionUser,
    loadedForUserId,
    loadingForUserId,
    reset,
    setLoadingForUserId,
    setWishlist,
  ]);

  const toggle = async (productId: string) => {
    if (!isSignedIn || !sessionUser) {
      return { ok: false, reason: "unauthenticated" as const };
    }

    setLoadingForUserId(sessionUser.id);

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update wishlist");
      }

      setWishlist(payload.data.productIds ?? [], sessionUser.id);
      return { ok: true, reason: "updated" as const };
    } catch (error) {
      console.error("Wishlist update failed:", error);
      setLoadingForUserId(null);
      return { ok: false, reason: "error" as const };
    }
  };

  return {
    isLoaded,
    isSignedIn,
    isLoading: !!sessionUser && loadingForUserId === sessionUser.id,
    productIds,
    has: (productId: string) => productIds.includes(productId),
    toggle,
  };
}
