"use client";

import { useCallback, useEffect, useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { useSessionUser } from "@/hooks/use-session-user";
import { useToast } from "@/lib/use-toast";

const WISHLIST_CAP = 50;

function isRecoverableNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "AbortError" ||
    error.message.includes("Failed to fetch") ||
    error.message.includes("NetworkError") ||
    error.message.includes("timeout") ||
    error.message.includes("ECHECKOUTTIMEOUT")
  );
}

type WishlistState = {
  hasHydrated: boolean;
  productIdsByUser: Record<string, string[]>;
  syncedUserIds: string[];
  syncingUserIds: string[];
  capWarning: boolean;
  setHasHydrated: () => void;
  setWishlistForUser: (productIds: string[], userId: string, markSynced?: boolean) => void;
  markUserSynced: (userId: string) => void;
  setSyncingForUser: (userId: string, isSyncing: boolean) => void;
  setCapWarning: (value: boolean) => void;
  resetForUser: (userId: string) => void;
};

const useWishlistState = create<WishlistState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      productIdsByUser: {},
      syncedUserIds: [],
      syncingUserIds: [],
      capWarning: false,
      setHasHydrated: () => set({ hasHydrated: true }),
      setWishlistForUser: (productIds, userId, markSynced = false) =>
        set((state) => ({
          productIdsByUser: {
            ...state.productIdsByUser,
            [userId]: productIds,
          },
          syncedUserIds: markSynced
            ? Array.from(new Set([...state.syncedUserIds, userId]))
            : state.syncedUserIds,
        })),
      markUserSynced: (userId) =>
        set((state) => ({
          syncedUserIds: Array.from(new Set([...state.syncedUserIds, userId])),
        })),
      setSyncingForUser: (userId, isSyncing) =>
        set((state) => ({
          syncingUserIds: isSyncing
            ? Array.from(new Set([...state.syncingUserIds, userId]))
            : state.syncingUserIds.filter((id) => id !== userId),
        })),
      setCapWarning: (value) => set({ capWarning: value }),
      resetForUser: (userId) =>
        set((state) => {
          const nextProductIdsByUser = { ...state.productIdsByUser };
          delete nextProductIdsByUser[userId];

          return {
            productIdsByUser: nextProductIdsByUser,
            syncedUserIds: state.syncedUserIds.filter((id) => id !== userId),
            syncingUserIds: state.syncingUserIds.filter((id) => id !== userId),
            capWarning: false,
          };
        }),
    }),
    {
      name: "ske-wishlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        productIdsByUser: state.productIdsByUser,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to hydrate wishlist storage:", error);
        }

        state?.setHasHydrated();
      },
    }
  )
);

async function fetchWishlistIds(
  userId: string,
  setWishlistForUser: (ids: string[], uid: string, markSynced?: boolean) => void,
  setSyncingForUser: (uid: string, isSyncing: boolean) => void,
  resetForUser: (uid: string) => void
) {
  setSyncingForUser(userId, true);

  try {
    const response = await fetch("/api/wishlist", { cache: "no-store" });

    if (!response.ok) {
      if (response.status === 401) {
        resetForUser(userId);
      }
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { data?: { productIds?: string[]; ids?: string[] } }
      | null;

    setWishlistForUser(payload?.data?.productIds ?? payload?.data?.ids ?? [], userId, true);
  } catch {
    return;
  } finally {
    setSyncingForUser(userId, false);
  }
}

async function toggleWishlistItem({
  productId,
  userId,
  isSignedIn,
  setWishlistForUser,
  markUserSynced,
  setCapWarning,
  toast,
}: {
  productId: string;
  userId: string | null;
  isSignedIn: boolean;
  setWishlistForUser: (ids: string[], userId: string, markSynced?: boolean) => void;
  markUserSynced: (userId: string) => void;
  setCapWarning: (value: boolean) => void;
  toast: ReturnType<typeof useToast.getState>["toast"];
}) {
  if (!isSignedIn || !userId) {
    return { ok: false, reason: "unauthenticated" as const };
  }

  const currentIds = useWishlistState.getState().productIdsByUser[userId] ?? [];
  const wasInWishlist = currentIds.includes(productId);
  const nextIds = wasInWishlist
    ? currentIds.filter((id) => id !== productId)
    : [...currentIds, productId];

  if (!wasInWishlist && currentIds.length >= WISHLIST_CAP) {
    setCapWarning(true);
    return { ok: false, reason: "cap_exceeded" as const };
  }

  setWishlistForUser(nextIds, userId, true);
  markUserSynced(userId);

  try {
    const response = await fetch("/api/wishlist", {
      method: wasInWishlist ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      if (response.status === 422) {
        setCapWarning(true);
      }

      throw new Error(payload?.error || "Failed to update wishlist");
    }

    return {
      ok: true,
      reason: "updated" as const,
      state: wasInWishlist ? ("removed" as const) : ("added" as const),
    };
  } catch (error) {
    const isRecoverableError = isRecoverableNetworkError(error);

    if (isRecoverableError) {
      console.warn("Wishlist update temporarily unavailable:", error);
    } else {
      console.error("Wishlist update failed:", error);
    }

    setWishlistForUser(currentIds, userId, true);
    toast({
      title: "Wishlist unavailable",
      description: isRecoverableError
        ? "Connection timed out. Your wishlist is safe locally, and you can try again in a moment."
        : "Could not update wishlist. Please try again.",
      variant: "destructive",
    });
    return { ok: false, reason: "error" as const };
  }
}

export function useWishlist() {
  const { isSignedIn, sessionUser, isLoaded } = useSessionUser();
  const toast = useToast((state) => state.toast);
  const currentUserId = sessionUser?.id ?? null;

  const {
    hasHydrated,
    productIdsByUser,
    syncedUserIds,
    syncingUserIds,
    capWarning,
    setHasHydrated,
    setWishlistForUser,
    markUserSynced,
    setSyncingForUser,
    setCapWarning,
    resetForUser,
  } = useWishlistState(
    useShallow((state) => ({
      hasHydrated: state.hasHydrated,
      productIdsByUser: state.productIdsByUser,
      syncedUserIds: state.syncedUserIds,
      syncingUserIds: state.syncingUserIds,
      capWarning: state.capWarning,
      setHasHydrated: state.setHasHydrated,
      setWishlistForUser: state.setWishlistForUser,
      markUserSynced: state.markUserSynced,
      setSyncingForUser: state.setSyncingForUser,
      setCapWarning: state.setCapWarning,
      resetForUser: state.resetForUser,
    }))
  );
  const productIds = currentUserId ? productIdsByUser[currentUserId] ?? [] : [];
  const isSynced = currentUserId ? syncedUserIds.includes(currentUserId) : false;
  const isSyncing = currentUserId ? syncingUserIds.includes(currentUserId) : false;

  useEffect(() => {
    if (!hasHydrated) {
      setHasHydrated();
    }
  }, [hasHydrated, setHasHydrated]);

  const ensureLoaded = useCallback(() => {
    if (!hasHydrated || !isLoaded || !currentUserId) {
      return;
    }

    if (!isSignedIn) {
      resetForUser(currentUserId);
      return;
    }

    if (isSynced || isSyncing) {
      return;
    }

    void fetchWishlistIds(currentUserId, setWishlistForUser, setSyncingForUser, resetForUser);
  }, [
    currentUserId,
    hasHydrated,
    isLoaded,
    isSignedIn,
    isSynced,
    isSyncing,
    resetForUser,
    setSyncingForUser,
    setWishlistForUser,
  ]);

  const toggle = useCallback(
    async (productId: string) =>
      toggleWishlistItem({
        productId,
        userId: currentUserId,
        isSignedIn,
        setWishlistForUser,
        markUserSynced,
        setCapWarning,
        toast,
      }),
    [
      currentUserId,
      isSignedIn,
      markUserSynced,
      setCapWarning,
      setWishlistForUser,
      toast,
    ]
  );

  const has = useCallback((productId: string) => productIds.includes(productId), [productIds]);

  return useMemo(
    () => ({
      isLoaded,
      isSignedIn,
      isLoading:
        !hasHydrated || (!!currentUserId && isSyncing && productIds.length === 0 && !isSynced),
      isSyncing,
      productIds,
      capWarning,
      dismissCapWarning: () => setCapWarning(false),
      ensureLoaded,
      has,
      toggle,
    }),
    [
      capWarning,
      currentUserId,
      ensureLoaded,
      has,
      hasHydrated,
      isLoaded,
      isSignedIn,
      isSyncing,
      isSynced,
      productIds,
      setCapWarning,
      toggle,
    ]
  );
}

export function useWishlistProduct(productId: string) {
  const { sessionUser } = useSessionUser();

  return useWishlistState((state) =>
    sessionUser ? (state.productIdsByUser[sessionUser.id] ?? []).includes(productId) : false
  );
}

export function useWishlistActions() {
  const { isSignedIn, sessionUser } = useSessionUser();
  const toast = useToast((state) => state.toast);
  const { setWishlistForUser, markUserSynced, setCapWarning } = useWishlistState(
    useShallow((state) => ({
      setWishlistForUser: state.setWishlistForUser,
      markUserSynced: state.markUserSynced,
      setCapWarning: state.setCapWarning,
    }))
  );

  const toggle = useCallback(
    async (productId: string) =>
      toggleWishlistItem({
        productId,
        userId: sessionUser?.id ?? null,
        isSignedIn,
        setWishlistForUser,
        markUserSynced,
        setCapWarning,
        toast,
      }),
    [
      isSignedIn,
      markUserSynced,
      sessionUser,
      setCapWarning,
      setWishlistForUser,
      toast,
    ]
  );

  return useMemo(() => ({ isSignedIn, toggle }), [isSignedIn, toggle]);
}

export function useWishlistSync() {
  const { isLoaded, isSignedIn, sessionUser } = useSessionUser();
  const currentUserId = sessionUser?.id ?? null;
  const {
    hasHydrated,
    syncedUserIds,
    syncingUserIds,
    setWishlistForUser,
    setSyncingForUser,
    resetForUser,
  } = useWishlistState(
    useShallow((state) => ({
      hasHydrated: state.hasHydrated,
      syncedUserIds: state.syncedUserIds,
      syncingUserIds: state.syncingUserIds,
      setWishlistForUser: state.setWishlistForUser,
      setSyncingForUser: state.setSyncingForUser,
      resetForUser: state.resetForUser,
    }))
  );

  useEffect(() => {
    if (!hasHydrated || !isLoaded || !currentUserId) {
      return;
    }

    if (!isSignedIn) {
      resetForUser(currentUserId);
      return;
    }

    if (syncedUserIds.includes(currentUserId) || syncingUserIds.includes(currentUserId)) {
      return;
    }

    void fetchWishlistIds(currentUserId, setWishlistForUser, setSyncingForUser, resetForUser);
  }, [
    currentUserId,
    hasHydrated,
    isLoaded,
    isSignedIn,
    resetForUser,
    setSyncingForUser,
    setWishlistForUser,
    syncedUserIds,
    syncingUserIds,
  ]);
}
