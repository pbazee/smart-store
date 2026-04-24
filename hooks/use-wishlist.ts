"use client";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useCallback, useMemo } from "react";
import { useSessionUser } from "@/hooks/use-session-user";

const WISHLIST_CAP = 50;

type WishlistState = {
  productIds: string[];
  loadedForUserId: string | null;
  loadingForUserId: string | null;
  capWarning: boolean;
  setWishlist: (productIds: string[], userId: string) => void;
  setLoadingForUserId: (userId: string | null) => void;
  setCapWarning: (v: boolean) => void;
  reset: () => void;
};

const useWishlistState = create<WishlistState>((set) => ({
  productIds: [],
  loadedForUserId: null,
  loadingForUserId: null,
  capWarning: false,
  setWishlist: (productIds, userId) =>
    set({ productIds, loadedForUserId: userId, loadingForUserId: null }),
  setLoadingForUserId: (userId) => set({ loadingForUserId: userId }),
  setCapWarning: (v) => set({ capWarning: v }),
  reset: () =>
    set({
      productIds: [],
      loadedForUserId: null,
      loadingForUserId: null,
      capWarning: false,
    }),
}));

// Internal fetch — only called on demand (when wishlist drawer opens)
async function fetchWishlistIds(
  userId: string,
  setWishlist: (ids: string[], uid: string) => void,
  setLoadingForUserId: (uid: string | null) => void
) {
  setLoadingForUserId(userId);
  try {
    const response = await fetch("/api/wishlist", { cache: "no-store" });
    const payload = await response.json();
    setWishlist(payload?.data?.productIds ?? [], userId);
  } catch (error) {
    console.error("Failed to load wishlist:", error);
    setLoadingForUserId(null);
  }
}

/** Full hook — only use in the wishlist drawer/page. Triggers fetch on first call. */
export function useWishlist() {
  const { isSignedIn, sessionUser, isLoaded } = useSessionUser();

  const {
    productIds,
    loadedForUserId,
    loadingForUserId,
    capWarning,
    setWishlist,
    setLoadingForUserId,
    setCapWarning,
    reset,
  } = useWishlistState(
    useShallow((state) => ({
      productIds: state.productIds,
      loadedForUserId: state.loadedForUserId,
      loadingForUserId: state.loadingForUserId,
      capWarning: state.capWarning,
      setWishlist: state.setWishlist,
      setLoadingForUserId: state.setLoadingForUserId,
      setCapWarning: state.setCapWarning,
      reset: state.reset,
    }))
  );

  /** Call this when the wishlist drawer/page is opened. Fetches once per session. */
  const ensureLoaded = useCallback(() => {
    if (!isLoaded || !isSignedIn || !sessionUser) {
      if (isLoaded && !isSignedIn) reset();
      return;
    }
    if (loadedForUserId === sessionUser.id || loadingForUserId === sessionUser.id) return;
    void fetchWishlistIds(sessionUser.id, setWishlist, setLoadingForUserId);
  }, [
    isLoaded,
    isSignedIn,
    sessionUser,
    loadedForUserId,
    loadingForUserId,
    setWishlist,
    setLoadingForUserId,
    reset,
  ]);

  const toggle = useCallback(
    async (productId: string) => {
      if (!isSignedIn || !sessionUser) {
        return { ok: false, reason: "unauthenticated" as const };
      }

      // Cap check (client-side guard)
      const isAdding = !productIds.includes(productId);
      if (isAdding && productIds.length >= WISHLIST_CAP) {
        setCapWarning(true);
        return { ok: false, reason: "cap_exceeded" as const };
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
          if (response.status === 422) setCapWarning(true);
          throw new Error(payload?.error || "Failed to update wishlist");
        }

        setWishlist(payload.data.productIds ?? [], sessionUser.id);
        return { ok: true, reason: "updated" as const };
      } catch (error) {
        console.error("Wishlist update failed:", error);
        setLoadingForUserId(null);
        return { ok: false, reason: "error" as const };
      }
    },
    [isSignedIn, sessionUser, productIds, setWishlist, setLoadingForUserId, setCapWarning]
  );

  const has = useCallback(
    (productId: string) => productIds.includes(productId),
    [productIds]
  );

  return useMemo(
    () => ({
      isLoaded,
      isSignedIn,
      isLoading: !!sessionUser && loadingForUserId === sessionUser.id,
      productIds,
      capWarning,
      dismissCapWarning: () => setCapWarning(false),
      ensureLoaded,
      has,
      toggle,
    }),
    [isLoaded, isSignedIn, sessionUser, loadingForUserId, productIds, capWarning, setCapWarning, ensureLoaded, has, toggle]
  );
}

/** Lightweight hook — use in ProductCard buttons; reads from already-loaded state, no fetch. */
export function useWishlistProduct(productId: string) {
  return useWishlistState((state) => state.productIds.includes(productId));
}

/** Actions-only hook for toggle without subscribing to productIds list. */
export function useWishlistActions() {
  const { isSignedIn, sessionUser } = useSessionUser();
  const { productIds, setWishlist, setLoadingForUserId, setCapWarning } = useWishlistState(
    useShallow((state) => ({
      productIds: state.productIds,
      setWishlist: state.setWishlist,
      setLoadingForUserId: state.setLoadingForUserId,
      setCapWarning: state.setCapWarning,
    }))
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (!isSignedIn || !sessionUser) {
        return { ok: false, reason: "unauthenticated" as const };
      }

      const isAdding = !productIds.includes(productId);
      if (isAdding && productIds.length >= WISHLIST_CAP) {
        setCapWarning(true);
        return { ok: false, reason: "cap_exceeded" as const };
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
          if (response.status === 422) setCapWarning(true);
          throw new Error(payload?.error || "Failed to update wishlist");
        }
        setWishlist(payload.data.productIds ?? [], sessionUser.id);
        return { ok: true, reason: "updated" as const };
      } catch (error) {
        console.error("Wishlist update failed:", error);
        setLoadingForUserId(null);
        return { ok: false, reason: "error" as const };
      }
    },
    [isSignedIn, sessionUser, productIds, setWishlist, setLoadingForUserId, setCapWarning]
  );

  return useMemo(() => ({ isSignedIn, toggle }), [isSignedIn, toggle]);
}

/** Legacy compatibility — no-op, wishlist is now fetched on-demand only */
export function useWishlistSync() {
  // Intentionally empty: wishlist is fetched lazily via ensureLoaded()
}
