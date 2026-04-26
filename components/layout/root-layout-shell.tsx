"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function RootLayoutShell({
  children,
  storefrontChrome,
  storefrontFooter,
  storefrontOverlays,
}: {
  children: React.ReactNode;
  storefrontChrome: React.ReactNode;
  storefrontFooter: React.ReactNode;
  storefrontOverlays: React.ReactNode;
}) {
  const pathname = usePathname();
  const chromeRef = useRef<HTMLDivElement | null>(null);
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminLoginPath = pathname === "/admin-login" || pathname === "/login";
  const isAuthPath =
    pathname === "/sign-in" ||
    pathname.startsWith("/sign-in/") ||
    pathname === "/sign-up" ||
    pathname.startsWith("/sign-up/") ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/forgot-password/") ||
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password/") ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/");

  useEffect(() => {
    const root = document.documentElement;

    if (isAdminPath || isAdminLoginPath || isAuthPath) {
      root.style.setProperty("--storefront-header-height", "0px");
      return;
    }

    const updateHeaderHeight = () => {
      const nextHeight = chromeRef.current?.offsetHeight ?? 0;
      root.style.setProperty("--storefront-header-height", `${nextHeight}px`);
    };

    updateHeaderHeight();

    const observer =
      typeof ResizeObserver !== "undefined" && chromeRef.current
        ? new ResizeObserver(() => updateHeaderHeight())
        : null;

    if (observer && chromeRef.current) {
      observer.observe(chromeRef.current);
    }

    return () => {
      observer?.disconnect();
      root.style.removeProperty("--storefront-header-height");
    };
  }, [isAdminLoginPath, isAdminPath, isAuthPath, pathname]);

  if (isAdminPath || isAdminLoginPath || isAuthPath) {
    return <>{children}</>;
  }

  return (
    <>
      <div ref={chromeRef} className="fixed inset-x-0 top-0 z-50">
        {storefrontChrome}
      </div>
      <main className="min-h-screen pb-8 pt-[var(--storefront-header-height,104px)] transition-all duration-300 md:pb-0">
        {children}
      </main>
      {storefrontFooter}
      {storefrontOverlays}
    </>
  );
}
