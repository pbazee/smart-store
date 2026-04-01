"use client";

import { useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useSessionUser } from "@/hooks/use-session-user";
import { areCartItemsEqual, serializeCartItems } from "@/lib/cart-utils";
import { useCartStore } from "@/lib/store";
import type { CartItem } from "@/types";

async function readCartItems(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { data?: { items?: CartItem[] } }
    | null;

  return payload?.data?.items ?? [];
}

function getCartSignature(items: CartItem[]) {
  return JSON.stringify(serializeCartItems(items));
}

export function CartSessionSync() {
  const { isLoaded, sessionUser } = useSessionUser();
  const { hasHydrated, items, replaceItems, mergeExternalItems } = useCartStore(
    useShallow((state) => ({
      hasHydrated: state.hasHydrated,
      items: state.items,
      replaceItems: state.replaceItems,
      mergeExternalItems: state.mergeExternalItems,
    }))
  );
  const mergedUserIdRef = useRef<string | null>(null);
  const lastSyncedSignatureRef = useRef<string>("[]");
  const syncTimeoutRef = useRef<number | undefined>(undefined);
  const syncRequestIdRef = useRef(0);
  const isBootstrappingUserCartRef = useRef(false);
  const bootstrapRequestControllerRef = useRef<AbortController | null>(null);
  const syncRequestControllerRef = useRef<AbortController | null>(null);

  const clearPendingSyncTimeout = useCallback(() => {
    if (syncTimeoutRef.current !== undefined) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = undefined;
    }
  }, []);

  const syncCurrentCart = useCallback(async () => {
    const currentItems = useCartStore.getState().items;
    const sentSignature = getCartSignature(currentItems);

    if (sentSignature === lastSyncedSignatureRef.current) {
      return;
    }

    syncRequestControllerRef.current?.abort();
    const controller = new AbortController();
    syncRequestControllerRef.current = controller;
    const requestId = ++syncRequestIdRef.current;

    try {
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: serializeCartItems(currentItems),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Cart sync failed with status ${response.status}`);
      }

      const savedItems = await readCartItems(response);

      if (requestId !== syncRequestIdRef.current) {
        return;
      }

      const latestItems = useCartStore.getState().items;
      const latestSignature = getCartSignature(latestItems);

      if (latestSignature !== sentSignature) {
        return;
      }

      if (!areCartItemsEqual(latestItems, savedItems)) {
        replaceItems(savedItems);
      }

      lastSyncedSignatureRef.current = getCartSignature(savedItems);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      if (requestId !== syncRequestIdRef.current) {
        return;
      }

      console.error("[CartSync] Failed to sync cart update:", error);
    } finally {
      if (syncRequestControllerRef.current === controller) {
        syncRequestControllerRef.current = null;
      }
    }
  }, [replaceItems]);

  useEffect(() => {
    return () => {
      clearPendingSyncTimeout();
      bootstrapRequestControllerRef.current?.abort();
      syncRequestControllerRef.current?.abort();
    };
  }, [clearPendingSyncTimeout]);

  useEffect(() => {
    if (!hasHydrated || !isLoaded) {
      return;
    }

    if (!sessionUser) {
      isBootstrappingUserCartRef.current = false;
      mergedUserIdRef.current = null;
      syncRequestIdRef.current += 1;
      clearPendingSyncTimeout();
      bootstrapRequestControllerRef.current?.abort();
      bootstrapRequestControllerRef.current = null;
      syncRequestControllerRef.current?.abort();
      syncRequestControllerRef.current = null;
      lastSyncedSignatureRef.current = getCartSignature(useCartStore.getState().items);
      return;
    }

    if (mergedUserIdRef.current === sessionUser.id) {
      return;
    }

    let cancelled = false;
    isBootstrappingUserCartRef.current = true;
    const bootstrapCartSignature = getCartSignature(useCartStore.getState().items);
    bootstrapRequestControllerRef.current?.abort();
    const controller = new AbortController();
    bootstrapRequestControllerRef.current = controller;

    const mergeServerCart = async () => {
      let serverItems: CartItem[] = [];

      try {
        const response = await fetch("/api/cart", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.ok) {
          serverItems = await readCartItems(response);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("[CartSync] Failed to load saved cart:", error);
      } finally {
        if (bootstrapRequestControllerRef.current === controller) {
          bootstrapRequestControllerRef.current = null;
        }
      }

      if (cancelled || controller.signal.aborted) {
        return;
      }

      const currentCartSignature = getCartSignature(useCartStore.getState().items);

      // If the shopper changed the cart while the saved cart was loading, keep the
      // freshest local version and sync that back to the server instead of
      // re-introducing stale server items.
      if (currentCartSignature === bootstrapCartSignature) {
        mergeExternalItems(serverItems);
      }

      mergedUserIdRef.current = sessionUser.id;

      try {
        await syncCurrentCart();
      } finally {
        if (!cancelled) {
          isBootstrappingUserCartRef.current = false;
        }
      }
    };

    void mergeServerCart();

    return () => {
      cancelled = true;
      isBootstrappingUserCartRef.current = false;
      if (bootstrapRequestControllerRef.current === controller) {
        bootstrapRequestControllerRef.current.abort();
        bootstrapRequestControllerRef.current = null;
      }
    };
  }, [clearPendingSyncTimeout, hasHydrated, isLoaded, mergeExternalItems, sessionUser?.id, syncCurrentCart]);

  useEffect(() => {
    if (!hasHydrated || !isLoaded || !sessionUser) {
      return;
    }

    if (mergedUserIdRef.current !== sessionUser.id) {
      return;
    }

    if (isBootstrappingUserCartRef.current) {
      return;
    }

    const nextSignature = getCartSignature(items);
    if (nextSignature === lastSyncedSignatureRef.current) {
      return;
    }

    clearPendingSyncTimeout();

    syncTimeoutRef.current = window.setTimeout(() => {
      syncTimeoutRef.current = undefined;
      void syncCurrentCart();
    }, 250);

    return () => {
      clearPendingSyncTimeout();
    };
  }, [clearPendingSyncTimeout, hasHydrated, isLoaded, items, sessionUser?.id, syncCurrentCart]);

  return null;
}
