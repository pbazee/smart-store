import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { getSessionUser } from "@/lib/session-user";
import { getWishlistProducts } from "@/lib/wishlist-service";

export default async function WishlistPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/sign-in?redirect_url=%2Fwishlist");
  }

  const products = await getWishlistProducts(sessionUser.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-500">
            <Heart className="h-4 w-4 fill-brand-500" />
            <span className="text-xs font-bold uppercase tracking-[0.24em]">Wishlist</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-black tracking-tight">
            Saved for later
          </h1>
          <p className="mt-2 text-muted-foreground">
            {products.length} saved item{products.length === 1 ? "" : "s"} ready for your next
            move.
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-16 text-center">
          <h2 className="text-2xl font-black">Your wishlist is empty</h2>
          <p className="mt-3 text-muted-foreground">
            Start saving the best drops so you can come back when the timing feels right.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Explore the shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
