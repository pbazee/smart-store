import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import WishlistPageClient from "@/components/wishlist/wishlist-page-content";

export default function WishlistPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <WishlistPageClient />
    </Suspense>
  );
}
