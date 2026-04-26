import { Suspense } from "react";
import { InlineLoader } from "@/components/ui/ripple-loader";
import WishlistPageClient from "@/components/wishlist/wishlist-page-content";

export default function WishlistPage() {
  return (
    <Suspense fallback={<InlineLoader label="Loading wishlist..." />}>
      <WishlistPageClient />
    </Suspense>
  );
}
