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

    const prefetchBudget = deviceMemory <= 4 || hardwareConcurrency <= 4 ? 2 : 4;
    const routesToPrefetch = uniqueRoutes.slice(0, prefetchBudget);
    if (routesToPrefetch.length === 0) {
      return;
    }

    const prefetchRoutes = () => {
      routesToPrefetch.forEach((route) => {
        if (prefetchedRoutes.has(route)) {
          return;
        }

        prefetchedRoutes.add(route);
        router.prefetch(route);
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(prefetchRoutes, { timeout: 1500 });

      return () => {
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(prefetchRoutes, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router, uniqueRoutes]);
}
