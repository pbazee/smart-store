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
    if (uniqueRoutes.length === 0) {
      return;
    }

    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection as
      | { saveData?: boolean; effectiveType?: string }
      | undefined;

    if (connection?.saveData || connection?.effectiveType === "slow-2g") {
      return;
    }

    const prefetchRoutes = () => {
      uniqueRoutes.forEach((route) => {
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
