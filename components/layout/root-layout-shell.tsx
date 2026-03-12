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

  if (isAdminPath) {
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
