"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

const prefetchedRoutes = new Set<string>();

export function useRoutePrefetch(routes: Array<string | null | undefined>) {
  const router = useRouter();
  const pathname = usePathname();
  const routesKey = routes.filter(Boolean).join("||");
  const uniqueRoutes = useMemo(
    () =>
      Array.from(new Set(routes.filter((route): route is string => Boolean(route?.trim())))).filter(
        (route) => route !== pathname
      ),
    [pathname, routesKey]
  );

  useEffect(() => {
    if (uniqueRoutes.length === 0 || document.visibilityState !== "visible") {
      return;
    }

    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
      deviceMemory?: number;
    }).connection as
      | { saveData?: boolean; effectiveType?: string }
      | undefined;
    const deviceMemory =
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const hardwareConcurrency = navigator.hardwareConcurrency ?? 8;

    if (connection?.saveData || connection?.effectiveType === "slow-2g") {
      return;
    }

    const isConstrainedDevice = deviceMemory <= 4 || hardwareConcurrency <= 4;
    const prefetchBudget = isConstrainedDevice ? 1 : 4;
    const routesToPrefetch = uniqueRoutes.slice(0, prefetchBudget);
    if (routesToPrefetch.length === 0) {
      return;
    }

    let idleId: number | null = null;
    let timeoutId: number | null = null;
    let fallbackDelayId: number | null = null;
    let hasScheduledPrefetch = false;

    const prefetchRoutes = () => {
      routesToPrefetch.forEach((route) => {
        if (prefetchedRoutes.has(route)) {
          return;
        }

        prefetchedRoutes.add(route);
        router.prefetch(route);
      });
    };

    const clearScheduledWork = () => {
      if (idleId !== null && typeof window.requestIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (fallbackDelayId !== null) {
        window.clearTimeout(fallbackDelayId);
      }
      idleId = null;
      timeoutId = null;
      fallbackDelayId = null;
    };

    const schedulePrefetch = () => {
      if (hasScheduledPrefetch) {
        return;
      }

      hasScheduledPrefetch = true;

      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(prefetchRoutes, { timeout: 2000 });
        return;
      }

      timeoutId = window.setTimeout(prefetchRoutes, 0);
    };

    const handleInteraction = () => {
      clearScheduledWork();
      schedulePrefetch();
    };

    if (!isConstrainedDevice) {
      fallbackDelayId = window.setTimeout(schedulePrefetch, 3000);
    }
    window.addEventListener("pointerdown", handleInteraction, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", handleInteraction, { once: true });

    return () => {
      clearScheduledWork();
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [router, uniqueRoutes]);
}
