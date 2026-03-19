"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  Share,
  Shield,
  ShoppingBag,
  Smartphone,
  Star,
  Truck,
  ZoomIn,
} from "lucide-react";
import confetti from "@/lib/confetti";
import { ReviewsPanel } from "@/components/shop/reviews-panel";
import { SizeGuideDialog } from "@/components/shop/size-guide-dialog";
import { useSessionUser } from "@/hooks/use-session-user";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/lib/use-toast";
import { cn, createBlurDataURL, formatKES } from "@/lib/utils";
import type { Product, ProductReview, ProductVariant } from "@/types";

export function ProductDetail({
  product,
  reviews,
}: {
  product: Product;
  reviews: ProductReview[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const imageRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const wishlist = useWishlist();
  const { sessionUser } = useSessionUser();
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const initialVariant =
    product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
  const [selectedColor, setSelectedColor] = useState(initialVariant?.color ?? "");
  const [selectedSize, setSelectedSize] = useState(initialVariant?.size ?? "");

  const colors = [...new Set(product.variants.map((variant) => variant.color))];
  const sizesForColor = product.variants.filter((variant) => variant.color === selectedColor);
  const selectedVariant: ProductVariant | undefined = product.variants.find(
    (variant) => variant.color === selectedColor && variant.size === selectedSize
  );
  const blurDataUrl = useMemo(
    () =>
      createBlurDataURL({
        from: "#111827",
        to: "#f97316",
        accent: "#fdba74",
      }),
    []
  );
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : product.rating;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) {
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast({
        title: "Select a size first",
        description: "Choose your fit before adding this item to cart.",
        variant: "destructive",
      });
      return;
    }

    if (selectedVariant.stock === 0) {
      toast({
        title: "Out of stock",
        description: "That size is currently unavailable.",
        variant: "destructive",
      });
      return;
    }

    const result = addItem(product, selectedVariant);

    if (result.status === "out-of-stock" || result.status === "max-stock") {
      toast({
        title: result.status === "out-of-stock" ? "Out of stock" : "Stock limit reached",
        description: `${product.name} - ${selectedColor}, Size ${selectedSize}`,
        variant: "destructive",
      });
      return;
    }

    confetti({
      particleCount: 110,
      spread: 68,
      origin: { y: 0.62 },
      colors: ["#f97316", "#fb923c", "#fdba74", "#22c55e"],
    });

    toast({
      title: "Added to cart",
      description: `${product.name} - ${selectedColor}, Size ${selectedSize}`,
    });
  };

  const handleWishlistToggle = async () => {
    if (!wishlist.isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Use your account or demo login to save this product.",
      });
      router.push(`/sign-in?redirect_url=${encodeURIComponent(pathname || "/wishlist")}`);
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
        ? "This product has been removed from your saved list."
        : "You can find this piece in your wishlist at any time.",
    });
  };

  return (
    <div className="space-y-20">
      <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr] lg:gap-16">
        <div className="space-y-4">
          <div
            ref={imageRef}
            className="relative aspect-square overflow-hidden rounded-[2rem] bg-muted"
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            <Image
              src={product.images[selectedImage] || "/images/product-placeholder.png"}
              alt={product.name}
              fill
              priority
              placeholder="blur"
              quality={90}
              blurDataURL={blurDataUrl}
              className={cn(
                "object-cover transition-transform duration-200",
                zoomed ? "scale-[1.55]" : "scale-100"
              )}
              style={zoomed ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` } : undefined}
              sizes="(max-width: 1024px) 100vw, 52vw"
            />

            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {product.isNew && (
                <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                  New Arrival
                </span>
              )}
              {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
                <span className="rounded-full bg-amber-400/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-black">
                  Low stock
                </span>
              )}
            </div>

            {!zoomed && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">
                <ZoomIn className="h-3.5 w-3.5" />
                Hover to zoom
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
            {product.images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setSelectedImage(index)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-2xl border-2 transition-all",
                  selectedImage === index
                    ? "border-brand-500 shadow-[0_0_0_3px_rgba(249,115,22,0.15)]"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={image || "/images/product-placeholder.png"}
                  alt={`${product.name} view ${index + 1}`}
                  fill
                  placeholder="blur"
                  quality={85}
                  blurDataURL={blurDataUrl}
                  className="object-cover"
                  sizes="120px"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-500">
              {product.category} - {product.subcategory}
            </p>
            <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-5xl">
              {product.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      "h-4 w-4",
                      index < Math.round(averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-muted text-muted"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} average - {reviews.length || product.reviewCount} reviews
              </span>
              {sessionUser?.isDemo && (
                <span className="rounded-full border border-brand-300/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600">
                  Demo mode
                </span>
              )}
            </div>
          </div>

          <div className="text-3xl font-black text-brand-600">
            {selectedVariant ? formatKES(selectedVariant.price) : formatKES(product.basePrice)}
          </div>

          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="rounded-[1.75rem] border border-border bg-card p-5">
            <div>
              <p className="text-sm font-semibold">
                Color <span className="text-muted-foreground">- {selectedColor}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {colors.map((color, index) => {
                  const variant = product.variants.find((item) => item.color === color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        const nextVariant =
                          product.variants.find(
                            (item) => item.color === color && item.stock > 0
                          ) ?? product.variants.find((item) => item.color === color);
                        setSelectedSize(nextVariant?.size ?? "");
                        setSelectedImage(index % product.images.length);
                      }}
                      className={cn(
                        "h-11 w-11 rounded-full border-2 transition-all hover:scale-105",
                        selectedColor === color
                          ? "border-brand-500 ring-4 ring-brand-500/15"
                          : "border-border"
                      )}
                      style={{ backgroundColor: variant?.colorHex }}
                      aria-label={color}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Size</p>
                <SizeGuideDialog />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizesForColor.map((variant) => {
                  const outOfStock = variant.stock === 0;

                  return (
                    <button
                      key={`${variant.color}-${variant.size}`}
                      type="button"
                      onClick={() => !outOfStock && setSelectedSize(variant.size)}
                      disabled={outOfStock}
                      className={cn(
                        "min-w-12 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all",
                        outOfStock && "cursor-not-allowed opacity-35 line-through",
                        selectedSize === variant.size
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-border hover:border-foreground"
                      )}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </div>
              {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
                <p className="mt-3 text-sm font-medium text-amber-600 dark:text-amber-400">
                  Low stock: only {selectedVariant.stock} left in this size.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr,auto]">
            <motion.button
              whileTap={{ scale: 0.985 }}
              type="button"
              onClick={handleAddToCart}
              className="flex w-full items-center justify-center gap-3 rounded-[1.35rem] bg-brand-500 px-6 py-4 text-base font-bold text-white shadow-[0_14px_40px_rgba(249,115,22,0.24)] transition-colors hover:bg-brand-600"
            >
              <ShoppingBag className="h-5 w-5" />
              Add to cart -{" "}
              {selectedVariant ? formatKES(selectedVariant.price) : formatKES(product.basePrice)}
            </motion.button>

            <button
              type="button"
              onClick={handleWishlistToggle}
              className="inline-flex items-center justify-center gap-2 rounded-[1.35rem] border border-border px-5 py-4 text-sm font-semibold transition-colors hover:border-brand-300 hover:text-brand-600"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  wishlist.has(product.id) ? "fill-red-500 text-red-500" : ""
                )}
              />
              Wishlist
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.35rem] border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="h-4 w-4 text-emerald-500" />
                Free same-day Nairobi delivery
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Order before noon for same-day dispatch inside Nairobi.
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Shield className="h-4 w-4 text-sky-500" />
                Easy returns and secure checkout
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                30-day returns with encrypted checkout and order tracking.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-500/20 bg-green-500/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-300">
              <Smartphone className="h-4 w-4" />
              M-Pesa accepted everywhere
            </div>
            <p className="mt-2 text-sm text-green-800/80 dark:text-green-200/80">
              Pay instantly with Safaricom M-Pesa or card at checkout. No friction, no extra step.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => {
              if (navigator.share) {
                void navigator.share({
                  title: product.name,
                  text: product.description,
                  url: window.location.href,
                });
                return;
              }

              void navigator.clipboard?.writeText(window.location.href);
              toast({
                title: "Link copied",
                description: "Product link copied to your clipboard.",
              });
            }}
          >
            <Share className="h-4 w-4" />
            Share this product
          </button>
        </div>
      </div>

      <ReviewsPanel
        productId={product.id}
        initialReviews={reviews}
        averageRating={averageRating}
      />
    </div>
  );
}
