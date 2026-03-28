"use client";

import { useCallback, useEffect, useRef } from "react";
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
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const items = useCartStore((state) => state.items);
  const replaceItems = useCartStore((state) => state.replaceItems);
  const mergeExternalItems = useCartStore((state) => state.mergeExternalItems);
  const mergedUserIdRef = useRef<string | null>(null);
  const lastSyncedSignatureRef = useRef<string>("[]");
  const syncTimeoutRef = useRef<number | undefined>(undefined);
  const syncRequestIdRef = useRef(0);

  const syncCurrentCart = useCallback(async () => {
    const currentItems = useCartStore.getState().items;
    const sentSignature = getCartSignature(currentItems);
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
      if (requestId !== syncRequestIdRef.current) {
        return;
      }

      console.error("[CartSync] Failed to sync cart update:", error);
    }
  }, [replaceItems]);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated || !isLoaded) {
      return;
    }

    if (!sessionUser) {
      mergedUserIdRef.current = null;
      syncRequestIdRef.current += 1;
      lastSyncedSignatureRef.current = getCartSignature(useCartStore.getState().items);
      return;
    }

    if (mergedUserIdRef.current === sessionUser.id) {
      return;
    }

    let cancelled = false;

    const mergeServerCart = async () => {
      let serverItems: CartItem[] = [];

      try {
        const response = await fetch("/api/cart", {
          cache: "no-store",
        });

        if (response.ok) {
          serverItems = await readCartItems(response);
        }
      } catch (error) {
        console.error("[CartSync] Failed to load saved cart:", error);
      }

      if (cancelled) {
        return;
      }

      mergeExternalItems(serverItems);
      mergedUserIdRef.current = sessionUser.id;

      await syncCurrentCart();
    };

    void mergeServerCart();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isLoaded, mergeExternalItems, sessionUser?.id, syncCurrentCart]);

  useEffect(() => {
    if (!hasHydrated || !isLoaded || !sessionUser) {
      return;
    }

    if (mergedUserIdRef.current !== sessionUser.id) {
      return;
    }

    const nextSignature = getCartSignature(items);
    if (nextSignature === lastSyncedSignatureRef.current) {
      return;
    }

    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      void syncCurrentCart();
    }, 250);

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [hasHydrated, isLoaded, items, sessionUser?.id, syncCurrentCart]);

  return null;
}
