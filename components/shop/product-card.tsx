"use client";

import { memo, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useWishlistActions, useWishlistProduct } from "@/hooks/use-wishlist";
import { buildProductHref } from "@/lib/product-routes";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/lib/use-toast";
import { cn, createBlurDataURL, formatKES } from "@/lib/utils";
import type { Product } from "@/types";

const CARD_BLUR_DATA_URL = createBlurDataURL({
  from: "#f5f5f5",
  to: "#e5e5e5",
  accent: "#f97316",
});

interface ProductCardProps {
  product: Product;
  index?: number;
  priority?: boolean;
  sizes?: string;
}

function prefetchProductRoute(
  router: { prefetch: (href: string) => void },
  href: string,
  hasPrefetchedRef: { current: boolean }
) {
  if (hasPrefetchedRef.current) {
    return;
  }

  hasPrefetchedRef.current = true;
  router.prefetch(href);
}

function ProductCardComponent({
  product,
  index = 0,
  priority = false,
  sizes = "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw",
}: ProductCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const hasPrefetchedRef = useRef(false);
  const isWishlisted = useWishlistProduct(product.id);
  const { isSignedIn, toggle } = useWishlistActions();
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();
  const [heartAnimating, setHeartAnimating] = useState(false);

  const firstVariant =
    product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
  const productHref = buildProductHref(product);
  const colorSwatches = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.colorHex))].slice(0, 4),
    [product.variants]
  );

  const prefetchProduct = () => {
    prefetchProductRoute(router, productHref, hasPrefetchedRef);
  };

  const handleQuickAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!firstVariant) {
      return;
    }

    const result = addItem(product, firstVariant);

    if (result.status === "out-of-stock" || result.status === "max-stock") {
      toast({
        title: result.status === "out-of-stock" ? "Out of stock" : "Stock limit reached",
        description: `${product.name} - ${firstVariant.color}, Size ${firstVariant.size}`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Added to cart",
      description: `${product.name} - ${firstVariant.color}, Size ${firstVariant.size}`,
    });
  };

  const handleWishlistToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setHeartAnimating(true);
    window.setTimeout(() => setHeartAnimating(false), 200);

    if (!isSignedIn) {
      const redirectPath =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : pathname;

      toast({
        title: "Sign in required",
        description: "Create an account or use demo login to save this item.",
      });
      router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectPath || "/wishlist")}`);
      return;
    }

    const wasSaved = isWishlisted;

    toast({
      title: wasSaved ? "Removed from wishlist" : "Saved to wishlist",
      description: wasSaved
        ? "This item has been removed from your saved list."
        : "You can find it any time in your wishlist.",
    });

    void toggle(product.id).then((result) => {
      if (!result.ok) {
        return;
      }
    });
  };

  return (
    <div
      className="group relative"
      style={{ contentVisibility: "auto", containIntrinsicSize: "320px 480px" }}
    >
      <Link
        ref={linkRef}
        href={productHref}
        prefetch={false}
        onMouseEnter={prefetchProduct}
        onFocus={prefetchProduct}
        className="block"
      >
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <div className="relative aspect-[3/4] overflow-hidden bg-muted">
            <Image
              src={product.images[0] || "/images/product-placeholder.png"}
              alt={product.name}
              fill
              priority={priority}
              loading={priority ? undefined : "lazy"}
              placeholder="blur"
              quality={80}
              blurDataURL={CARD_BLUR_DATA_URL}
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes={sizes}
            />

            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
              {product.isNew && (
                <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  New
                </span>
              )}
              {product.tags.includes("trending") && (
                <span className="rounded-full bg-neutral-900/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Trending
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleWishlistToggle}
              className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm transition-all hover:scale-110 dark:bg-black/70 dark:text-white md:opacity-0 md:group-hover:opacity-100"
              aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  heartAnimating && "wishlist-heart-pulse",
                  isWishlisted ? "fill-red-500 text-red-500" : ""
                )}
              />
            </button>

            {firstVariant && (
              <button
                type="button"
                onClick={handleQuickAdd}
                className="absolute bottom-3 left-3 right-3 hidden translate-y-4 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-orange-600 md:flex"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to cart
              </button>
            )}
          </div>

          <div className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold leading-tight">{product.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{product.subcategory}</p>
              </div>
              <p className="whitespace-nowrap text-sm font-black text-orange-600">
                {formatKES(product.basePrice)}
              </p>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs text-muted-foreground">
                  {product.rating.toFixed(1)} ({product.reviewCount})
                </span>
              </div>

              <div className="flex items-center gap-1">
                {colorSwatches.map((hex) => (
                  <span
                    key={hex}
                    className="h-3 w-3 rounded-full border border-border"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            {firstVariant && (
              <button
                type="button"
                onClick={handleQuickAdd}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2 text-xs font-bold text-white transition-colors active:bg-orange-600 md:hidden"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Add to cart
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export const ProductCard = memo(ProductCardComponent);
