"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

const prefetchedRoutes = new Set<string>();

export function useRoutePrefetch(routes: Array<string | null | undefined>) {
  const router = useRouter();
  const routesKey = routes.filter(Boolean).join("||");
  const uniqueRoutes = useMemo(
    () =>
      Array.from(new Set(routes.filter((route): route is string => Boolean(route?.trim())))),
    [routesKey]
  );

  useEffect(() => {
    if (uniqueRoutes.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      uniqueRoutes.forEach((route) => {
        if (prefetchedRoutes.has(route)) {
          return;
        }

        prefetchedRoutes.add(route);
        router.prefetch(route);
      });
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router, routesKey, uniqueRoutes]);
}
