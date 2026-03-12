"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { buildProductHref } from "@/lib/product-routes";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/lib/use-toast";
import { cn, createBlurDataURL, formatKES } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const wishlist = useWishlist();
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const firstVariant =
    product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
  const blurDataUrl = useMemo(
    () =>
      createBlurDataURL({
        from: "#f5f5f5",
        to: "#e5e5e5",
        accent: "#f97316",
      }),
    []
  );

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

  const handleWishlistToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!wishlist.isSignedIn) {
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

    const wasSaved = wishlist.has(product.id);
    const result = await wishlist.toggle(product.id);

    if (!result.ok) {
      toast({
        title: "Wishlist unavailable",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: wasSaved ? "Removed from wishlist" : "Saved to wishlist",
      description: wasSaved
        ? "This item has been removed from your saved list."
        : "You can find it any time in your wishlist.",
    });

    if (pathname === "/wishlist") {
      router.refresh();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={buildProductHref(product)} className="block">
        {/* Card container */}
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
          {/* Image */}
          <div className="relative aspect-[3/4] overflow-hidden bg-muted">
            <Image
              src={product.images[0] || "/images/product-placeholder.png"}
              alt={product.name}
              fill
              placeholder="blur"
              blurDataURL={blurDataUrl}
              className={cn(
                "object-cover transition-transform duration-500",
                hovered ? "scale-110" : "scale-100"
              )}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />

            {/* Badges */}
            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
              {product.isNew && (
                <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  New
                </span>
              )}
              {product.tags.includes("trending") && (
                <span className="rounded-full bg-neutral-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  Trending
                </span>
              )}
            </div>

            {/* Wishlist heart */}
            <button
              type="button"
              onClick={handleWishlistToggle}
              className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm transition-all hover:scale-110 dark:bg-black/70 dark:text-white md:opacity-0 md:group-hover:opacity-100"
              aria-label={wishlist.has(product.id) ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  wishlist.has(product.id) ? "fill-red-500 text-red-500" : ""
                )}
              />
            </button>

            {/* Quick add button */}
            {firstVariant && (
              <motion.button
                initial={{ y: 16, opacity: 0 }}
                animate={hovered ? { y: 0, opacity: 1 } : { y: 16, opacity: 0 }}
                onClick={handleQuickAdd}
                className="absolute bottom-3 left-3 right-3 hidden items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-orange-600 md:flex"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to cart
              </motion.button>
            )}
          </div>

          {/* Info */}
          <div className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold leading-tight">{product.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {product.subcategory}
                </p>
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
                {[...new Set(product.variants.map((variant) => variant.colorHex))]
                  .slice(0, 4)
                  .map((hex) => (
                    <span
                      key={hex}
                      className="h-3 w-3 rounded-full border border-border"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
