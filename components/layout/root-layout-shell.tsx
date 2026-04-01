"use client";

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

  if (isAdminPath || isAdminLoginPath || isAuthPath) {
    return <>{children}</>;
  }

  return (
    <>
      {storefrontChrome}
      <main className="min-h-screen pb-20 md:pb-0">{children}</main>
      {storefrontFooter}
      {storefrontOverlays}
    </>
  );
}
