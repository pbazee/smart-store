"use client";

import dynamic from "next/dynamic";
import { SWRConfig } from "swr";
import { jsonFetcher } from "@/lib/fetcher";

const WishlistProvider = dynamic(
  () => import("@/components/providers/wishlist-provider").then((mod) => mod.WishlistProvider),
  { ssr: false }
);

export function ProvidersClient({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: jsonFetcher,
        revalidateOnFocus: false,
        dedupingInterval: 60_000,
        keepPreviousData: true,
        shouldRetryOnError: false,
      }}
    >
      <WishlistProvider>{children}</WishlistProvider>
    </SWRConfig>
  );
}
