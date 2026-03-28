"use client";

import { useEffect, useRef } from "react";
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

export function CartSessionSync() {
  const { isLoaded, sessionUser } = useSessionUser();
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const items = useCartStore((state) => state.items);
  const replaceItems = useCartStore((state) => state.replaceItems);
  const mergedUserIdRef = useRef<string | null>(null);
  const lastSyncedSignatureRef = useRef<string>("[]");
  const syncTimeoutRef = useRef<number | undefined>(undefined);

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
      lastSyncedSignatureRef.current = JSON.stringify(
        serializeCartItems(useCartStore.getState().items)
      );
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

      const mergedItems = useCartStore.getState().mergeExternalItems(serverItems);

      try {
        const response = await fetch("/api/cart", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: serializeCartItems(mergedItems),
          }),
        });

        if (!response.ok) {
          throw new Error(`Cart save failed with status ${response.status}`);
        }

        const savedItems = await readCartItems(response);
        if (cancelled) {
          return;
        }

        if (!areCartItemsEqual(useCartStore.getState().items, savedItems)) {
          replaceItems(savedItems);
        }

        lastSyncedSignatureRef.current = JSON.stringify(serializeCartItems(savedItems));
      } catch (error) {
        console.error("[CartSync] Failed to save merged cart:", error);

        if (cancelled) {
          return;
        }

        if (!areCartItemsEqual(useCartStore.getState().items, mergedItems)) {
          replaceItems(mergedItems);
        }

        lastSyncedSignatureRef.current = JSON.stringify(serializeCartItems(mergedItems));
      }

      mergedUserIdRef.current = sessionUser.id;
    };

    void mergeServerCart();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isLoaded, replaceItems, sessionUser?.id]);

  useEffect(() => {
    if (!hasHydrated || !isLoaded || !sessionUser) {
      return;
    }

    if (mergedUserIdRef.current !== sessionUser.id) {
      return;
    }

    const nextSignature = JSON.stringify(serializeCartItems(items));
    if (nextSignature === lastSyncedSignatureRef.current) {
      return;
    }

    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(async () => {
      try {
        const currentItems = useCartStore.getState().items;
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

        if (!areCartItemsEqual(useCartStore.getState().items, savedItems)) {
          replaceItems(savedItems);
        }

        lastSyncedSignatureRef.current = JSON.stringify(serializeCartItems(savedItems));
      } catch (error) {
        console.error("[CartSync] Failed to sync cart update:", error);
      }
    }, 250);

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [hasHydrated, isLoaded, items, replaceItems, sessionUser?.id]);

  return null;
}
