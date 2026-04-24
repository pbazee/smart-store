"use client";

import dynamic from "next/dynamic";

const WishlistProvider = dynamic(
  () => import("@/components/providers/wishlist-provider").then((mod) => mod.WishlistProvider),
  { ssr: false }
);

export function ProvidersClient({ children }: { children: React.ReactNode }) {
  return <WishlistProvider>{children}</WishlistProvider>;
}
