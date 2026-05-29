"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  Link,
  MessageCircle,
  Share,
  Shield,
  Send,
  ShoppingBag,
  Smartphone,
  Star,
  Truck,
  Twitter,
  ZoomIn,
} from "lucide-react";
import { SizeGuideDialog } from "@/components/shop/size-guide-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareButton } from "@/components/shared/share-button";
import { useSessionUser } from "@/hooks/use-session-user";
import { buildProductHref } from "@/lib/product-routes";
import {
  createDefaultProductVariant,
  hasRealVariants,
} from "@/lib/product-stock";
import {
  isAgeBasedSize,
  isFootwearProductLike,
  isNumericSize,
  isOneSize,
  shouldUseCompactSizeButton,
} from "@/lib/size-guide";
import { useWishlistActions, useWishlistProduct } from "@/hooks/use-wishlist";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/lib/use-toast";
import { cn, createBlurDataURL, formatKES } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types";

const ReviewsPanel = dynamic(
  () => import("@/components/shop/reviews-panel").then((module) => module.ReviewsPanel),
  {
    ssr: false,
    loading: () => <ReviewsPanelFallback />,
  }
);

export function ProductDetail({
  product,
}: {
  product: Product;
}) {
  const initialVariant = hasRealVariants(product)
    ? product.variants.find((variant) => variant.stock > 0) ?? product.variants[0]
    : undefined;
  const router = useRouter();
  const pathname = usePathname();
  const imageRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();
  const isWishlisted = useWishlistProduct(product.id);
  const { isSignedIn, toggle } = useWishlistActions();
  const { sessionUser } = useSessionUser();
  const [liveProduct, setLiveProduct] = useState(product);
  const [selectedImage, setSelectedImage] = useState(0);
  const [displayedImage, setDisplayedImage] = useState(
    initialVariant?.variantImageUrl || product.images[0] || "/images/product-placeholder.png"
  );
  const [zoomed, setZoomed] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [canUseNativeShare, setCanUseNativeShare] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyPhone, setNotifyPhone] = useState("");
  const [notifyMessage, setNotifyMessage] = useState<string | null>(null);
  const [notifyPending, setNotifyPending] = useState(false);
  const preferredShareBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";

  const currentProduct = liveProduct;
  const hasVariants = hasRealVariants(currentProduct);
  const defaultVariant = useMemo(() => createDefaultProductVariant(currentProduct), [currentProduct]);
  const [selectedColor, setSelectedColor] = useState(initialVariant?.color ?? "");
  const [selectedSize, setSelectedSize] = useState(initialVariant?.size ?? "");

  const colors = useMemo(
    () => [...new Set(currentProduct.variants.map((variant) => variant.color))],
    [currentProduct.variants]
  );
  const sizesForColor = useMemo(
    () => currentProduct.variants.filter((variant) => variant.color === selectedColor),
    [currentProduct.variants, selectedColor]
  );
  const selectedVariant: ProductVariant | undefined = useMemo(
    () =>
      currentProduct.variants.find(
        (variant) => variant.color === selectedColor && variant.size === selectedSize
      ),
    [currentProduct.variants, selectedColor, selectedSize]
  );
  const variantImages = useMemo(
    () =>
      currentProduct.variants
        .map((variant) => variant.variantImageUrl)
        .filter((image): image is string => Boolean(image?.trim())),
    [currentProduct.variants]
  );
  const displayImages = useMemo(() => {
    const variantImage =
      selectedVariant?.variantImageUrl ||
      currentProduct.variants.find((variant) => variant.color === selectedColor)?.variantImageUrl ||
      "";

    return Array.from(
      new Set([variantImage, displayedImage, ...currentProduct.images, ...variantImages].filter(Boolean))
    );
  }, [
    currentProduct.images,
    currentProduct.variants,
    displayedImage,
    selectedColor,
    selectedVariant,
    variantImages,
  ]);
  const blurDataUrl = useMemo(
    () =>
      createBlurDataURL({
        from: "#111827",
        to: "#f97316",
        accent: "#fdba74",
      }),
    []
  );
  const averageRating = currentProduct.rating;
  const isFootwearProduct = isFootwearProductLike(currentProduct);
  const sharePrice = selectedVariant?.price ?? currentProduct.basePrice;
  const sharePriceLabel = `Ksh ${sharePrice.toLocaleString()}`;
  const normalizedShareSummary = `${currentProduct.name} - ${sharePriceLabel}`;
  const shareDescription = currentProduct.description?.trim()
    ? `${currentProduct.description.trim().slice(0, 100)}${currentProduct.description.trim().length > 100 ? "..." : ""}`
    : "";
  const normalizedShareMessage = pageUrl
    ? `🛍️ *${currentProduct.name}*\n💰 ${sharePriceLabel}${shareDescription ? `\n\n${shareDescription}` : ""}\n\n👉 Shop here: ${pageUrl}`
    : `🛍️ *${currentProduct.name}*\n💰 ${sharePriceLabel}${shareDescription ? `\n\n${shareDescription}` : ""}`;
  const normalizedWhatsappShareUrl = pageUrl
    ? `https://wa.me/?text=${encodeURIComponent(normalizedShareMessage)}`
    : "";
  const normalizedTwitterShareUrl = pageUrl
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(normalizedShareSummary)}&url=${encodeURIComponent(pageUrl)}`
    : "";
  const uniqueSizes = useMemo(
    () => [...new Set(sizesForColor.map((variant) => variant.size.trim()).filter(Boolean))],
    [sizesForColor]
  );
  const outOfStockSizes = useMemo(
    () => sizesForColor.filter((variant) => variant.stock === 0).map((variant) => variant.size.trim()),
    [sizesForColor]
  );
  const inStockSizes = useMemo(
    () => sizesForColor.filter((variant) => variant.stock > 0).map((variant) => variant.size.trim()),
    [sizesForColor]
  );
  const sizeLabel = useMemo(() => {
    if (uniqueSizes.length === 1 && uniqueSizes[0] && isOneSize(uniqueSizes[0])) {
      return "One Size fits all";
    }

    if (uniqueSizes.some((size) => isAgeBasedSize(size))) {
      return "Size (Age)";
    }

    if (isFootwearProduct || uniqueSizes.some((size) => isNumericSize(size))) {
      return "Size (EU)";
    }

    return "Size";
  }, [isFootwearProduct, uniqueSizes]);
  const allSizesOutOfStock = sizesForColor.length > 0 && inStockSizes.length === 0;
  const singleSizeRemaining =
    inStockSizes.length === 1 && uniqueSizes.length > 1 ? inStockSizes[0] : null;
  const defaultProductOutOfStock = false;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) {
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    imageRef.current.style.setProperty(
      "--product-zoom-origin-x",
      `${((event.clientX - rect.left) / rect.width) * 100}%`
    );
    imageRef.current.style.setProperty(
      "--product-zoom-origin-y",
      `${((event.clientY - rect.top) / rect.height) * 100}%`
    );
  };

  useEffect(() => {
    const nextInitialVariant = hasRealVariants(product)
      ? product.variants.find((variant) => variant.stock > 0) ?? product.variants[0]
      : undefined;

    setLiveProduct(product);
    setSelectedColor(nextInitialVariant?.color ?? "");
    setSelectedSize(nextInitialVariant?.size ?? "");
    setDisplayedImage(
      nextInitialVariant?.variantImageUrl || product.images[0] || "/images/product-placeholder.png"
    );
  }, [product]);

  useEffect(() => {
    let cancelled = false;

    void fetch(`/api/products/${product.slug}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as { data?: Product };
        return payload.data ?? null;
      })
      .then((freshProduct) => {
        if (cancelled || !freshProduct) {
          return;
        }

        const nextInitialVariant = hasRealVariants(freshProduct)
          ? freshProduct.variants.find((variant) => variant.stock > 0) ?? freshProduct.variants[0]
          : undefined;

        setLiveProduct(freshProduct);
        setSelectedColor((current) => current || nextInitialVariant?.color || "");
        setSelectedSize((current) => current || nextInitialVariant?.size || "");
        if (nextInitialVariant?.variantImageUrl) {
          setDisplayedImage((current) =>
            current === (product.images[0] || "/images/product-placeholder.png")
              ? nextInitialVariant.variantImageUrl || current
              : current
          );
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [product.slug]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const publicBaseUrl =
      preferredShareBaseUrl &&
      !preferredShareBaseUrl.includes("localhost") &&
      !preferredShareBaseUrl.includes("127.0.0.1")
        ? preferredShareBaseUrl.replace(/\/$/, "")
        : "";

    setPageUrl(publicBaseUrl ? `${publicBaseUrl}${buildProductHref(product)}` : window.location.href);

    setCanUseNativeShare(Boolean(window.navigator.share));
  }, [preferredShareBaseUrl, product]);

  useEffect(() => {
    if (!displayImages.includes(displayedImage)) {
      setDisplayedImage(displayImages[0] || "/images/product-placeholder.png");
    }
    setSelectedImage(Math.max(0, displayImages.indexOf(displayedImage)));
  }, [displayImages, displayedImage]);

  useEffect(() => {
    const hasSelectedColor = currentProduct.variants.some((variant) => variant.color === selectedColor);
    if (!selectedColor) {
      setSelectedSize("");
      return;
    }

    if (hasSelectedColor) {
      const hasSelectedSize = currentProduct.variants.some(
        (variant) => variant.color === selectedColor && variant.size === selectedSize
      );
      if (hasSelectedSize) {
        return;
      }

      const nextVariant =
        currentProduct.variants.find(
          (variant) => variant.color === selectedColor && variant.stock > 0
        ) ?? currentProduct.variants.find((variant) => variant.color === selectedColor);

      if (nextVariant?.size) {
        setSelectedSize(nextVariant.size);
      }
      return;
    }
  }, [currentProduct, selectedColor, selectedSize]);

  const handleAddToCart = () => {
    const variantToAdd = hasVariants ? selectedVariant : defaultVariant;

    if (hasVariants && !variantToAdd) {
      toast({
        title: "Select a size first",
        description: "Choose your fit before adding this item to cart.",
        variant: "destructive",
      });
      return;
    }

    if (!variantToAdd || variantToAdd.stock === 0) {
      toast({
        title: "Out of stock",
        description: hasVariants ? "That size is currently unavailable." : "This item is currently unavailable.",
        variant: "destructive",
      });
      return;
    }

    const result = addItem(currentProduct, variantToAdd);

    if (result.status === "out-of-stock" || result.status === "max-stock") {
      toast({
        title: result.status === "out-of-stock" ? "Out of stock" : "Stock limit reached",
        description: hasVariants
          ? `${currentProduct.name} - ${selectedColor}, Size ${selectedSize}`
          : currentProduct.name,
        variant: "destructive",
      });
      return;
    }

    void import("@/lib/confetti")
      .then(({ default: confetti }) =>
        confetti({
          particleCount: 110,
          spread: 68,
          origin: { y: 0.62 },
          colors: ["#f97316", "#fb923c", "#fdba74", "#22c55e"],
        })
      )
      .catch(() => undefined);

    toast({
      title: "Added to cart",
      description: hasVariants
        ? `${currentProduct.name} - ${selectedColor}, Size ${selectedSize}`
        : currentProduct.name,
    });
  };

  const handleNotifyMe = async () => {
    if (!notifyEmail.trim()) {
      setNotifyMessage("Please enter your email address.");
      return;
    }

    setNotifyPending(true);
    setNotifyMessage(null);

    try {
      const response = await fetch("/api/notify-restock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: currentProduct.id,
          variantId: hasVariants ? selectedVariant?.id ?? null : null,
          email: notifyEmail.trim(),
          phone: notifyPhone.trim() || null,
          sizeName: hasVariants ? (selectedSize || null) : null,
        }),
      });

      const payload = (await response.json()) as { message?: string; duplicate?: boolean };
      setNotifyMessage(
        payload.message ||
          (response.ok
            ? `We'll email you at ${notifyEmail.trim()} when this is back in stock!`
            : "Unable to save your restock alert right now.")
      );
    } catch {
      setNotifyMessage("Unable to save your restock alert right now.");
    } finally {
      setNotifyPending(false);
    }
  };

  const handleWishlistToggle = async () => {
    setHeartAnimating(true);
    window.setTimeout(() => setHeartAnimating(false), 200);

    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Use your account or demo login to save this product.",
      });
      router.push(`/sign-in?redirect_url=${encodeURIComponent(pathname || "/wishlist")}`);
      return;
    }

    const wasSaved = isWishlisted;
    toast({
      title: wasSaved ? "Removed from wishlist" : "Saved to wishlist",
      description: wasSaved
        ? "This product has been removed from your saved list."
        : "You can find this piece in your wishlist at any time.",
    });

    const result = await toggle(product.id);

    if (!result.ok) {
      return;
    }
  };

  const openShareWindow = (shareUrl: string) => {
    if (!shareUrl) {
      return;
    }

    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    if (!pageUrl) {
      return;
    }

    await navigator.clipboard.writeText(pageUrl);
    toast({
      title: "Link copied!",
      description: "The full product URL is ready to share.",
    });
  };

  const handleShare = async () => {
    if (!pageUrl) {
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: currentProduct.name,
        text: normalizedShareMessage,
        url: pageUrl,
      });
      return;
    }

    openShareWindow(normalizedWhatsappShareUrl);
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
              src={displayedImage || "/images/product-placeholder.png"}
              alt={currentProduct.name}
              fill
              priority
              placeholder="blur"
              quality={80}
              blurDataURL={blurDataUrl}
              className={cn(
                "object-cover transition-transform duration-200",
                zoomed ? "scale-[1.55]" : "scale-100"
              )}
              style={
                zoomed
                  ? {
                      transformOrigin:
                        "var(--product-zoom-origin-x, 50%) var(--product-zoom-origin-y, 50%)",
                    }
                  : undefined
              }
              sizes="(max-width: 1024px) 100vw, 52vw"
            />

            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {currentProduct.isNew && (
                <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                  New Arrival
                </span>
              )}
              {((hasVariants && selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5) ||
                false) && (
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
            {displayImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => {
                  const imageVariant = currentProduct.variants.find(
                    (variant) => variant.variantImageUrl === image
                  );

                  if (imageVariant) {
                    setSelectedColor(imageVariant.color);
                    setSelectedSize(imageVariant.size);
                    setNotifyOpen(false);
                    setNotifyMessage(null);
                  }

                  setSelectedImage(index);
                  setDisplayedImage(image);
                }}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-2xl border-2 transition-all",
                  displayedImage === image
                    ? "border-brand-500 shadow-[0_0_0_3px_rgba(249,115,22,0.15)]"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={image || "/images/product-placeholder.png"}
                  alt={`${currentProduct.name} view ${index + 1}`}
                  fill
                  placeholder="blur"
                  quality={80}
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
              {currentProduct.category} - {currentProduct.subcategory}
            </p>
            <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-5xl">
              {currentProduct.name}
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
                {averageRating.toFixed(1)} average - {currentProduct.reviewCount} reviews
              </span>
              {sessionUser?.isDemo && (
                <span className="rounded-full border border-brand-300/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600">
                  Demo mode
                </span>
              )}
            </div>
          </div>

          <div className="text-3xl font-black text-brand-600">
            {selectedVariant ? formatKES(selectedVariant.price) : formatKES(currentProduct.basePrice)}
          </div>

          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            {currentProduct.description}
          </p>

          {hasVariants ? (
            <div className="rounded-[1.75rem] border border-border bg-card p-5">
              <div>
                <p className="text-sm font-semibold">
                  Color <span className="text-muted-foreground">- {selectedColor || "Choose a color"}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {colors.map((color) => {
                    const variant = currentProduct.variants.find((item) => item.color === color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color);
                          const nextVariant =
                            currentProduct.variants.find(
                              (item) => item.color === color && item.stock > 0
                            ) ?? currentProduct.variants.find((item) => item.color === color);
                          setSelectedSize(nextVariant?.size ?? "");
                          setDisplayedImage(
                            nextVariant?.variantImageUrl ||
                              currentProduct.images[0] ||
                              "/images/product-placeholder.png"
                          );
                          setNotifyOpen(false);
                          setNotifyMessage(null);
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
                  <p className="text-sm font-semibold">{sizeLabel}</p>
                  <SizeGuideDialog product={currentProduct} />
                </div>
                {selectedVariant ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected size: <span className="font-semibold text-foreground">{selectedVariant.size}</span>
                    {" - "}
                    {selectedVariant.stock > 0
                      ? `${selectedVariant.stock} in stock`
                      : "Out of stock"}
                  </p>
                ) : null}
                {selectedColor && uniqueSizes.length === 1 && uniqueSizes[0] && isOneSize(uniqueSizes[0]) ? (
                  <div className="mt-3 inline-flex rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-600">
                    One Size
                  </div>
                ) : allSizesOutOfStock ? (
                  <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/70">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Currently out of stock
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifyOpen((current) => !current);
                        setNotifyMessage(null);
                      }}
                      className="mt-3 rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    >
                      Notify me
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sizesForColor.map((variant) => {
                      const outOfStock = variant.stock === 0;
                      const compactButton = shouldUseCompactSizeButton(variant.size);

                      return (
                        <button
                          key={`${variant.color}-${variant.size}`}
                          type="button"
                          onClick={() => {
                            if (outOfStock) {
                              return;
                            }

                            setSelectedSize(variant.size);
                            setDisplayedImage(
                              variant.variantImageUrl ||
                                currentProduct.images[0] ||
                                "/images/product-placeholder.png"
                            );
                            setNotifyOpen(false);
                            setNotifyMessage(null);
                          }}
                          disabled={outOfStock}
                          className={cn(
                            "rounded-2xl border px-4 py-3 text-sm font-semibold transition-all",
                            compactButton ? "min-w-12" : "min-w-[3.5rem]",
                            !compactButton && "px-5",
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
                )}
                {singleSizeRemaining ? (
                  <p className="mt-3 text-sm font-medium text-amber-600 dark:text-amber-400">
                    Only size {singleSizeRemaining} remaining
                  </p>
                ) : null}
                {!singleSizeRemaining && outOfStockSizes.length > 0 && !allSizesOutOfStock ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Sizes {outOfStockSizes.join(", ")} out of stock
                  </p>
                ) : null}
                {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
                  <p className="mt-3 text-sm font-medium text-amber-600 dark:text-amber-400">
                    Low stock: only {selectedVariant.stock} left in this size.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                This product is sold as a single item with no size or color selection required.
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr,auto]">
            {defaultProductOutOfStock || allSizesOutOfStock ? (
              <button
                type="button"
                onClick={() => {
                  setNotifyOpen((current) => !current);
                  setNotifyMessage(null);
                }}
                className="flex w-full items-center justify-center gap-3 rounded-[1.35rem] border border-border px-6 py-4 text-base font-bold text-foreground transition-colors hover:border-brand-300 hover:text-brand-600"
              >
                Notify me
              </button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.985 }}
                type="button"
                onClick={handleAddToCart}
                className="flex w-full items-center justify-center gap-3 rounded-[1.35rem] bg-brand-500 px-6 py-4 text-base font-bold text-white shadow-[0_14px_40px_rgba(249,115,22,0.24)] transition-colors hover:bg-brand-600"
              >
                <ShoppingBag className="h-5 w-5" />
                Add to cart -{" "}
                {selectedVariant ? formatKES(selectedVariant.price) : formatKES(currentProduct.basePrice)}
              </motion.button>
            )}

            <button
              type="button"
              onClick={handleWishlistToggle}
              className="inline-flex items-center justify-center gap-2 rounded-[1.35rem] border border-border px-5 py-4 text-sm font-semibold transition-colors hover:border-brand-300 hover:text-brand-600"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  heartAnimating && "wishlist-heart-pulse",
                  isWishlisted ? "fill-red-500 text-red-500" : ""
                )}
              />
              Wishlist
            </button>
          </div>

          {notifyOpen ? (
            <div className="rounded-[1.35rem] border border-border bg-card p-4">
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={(event) => setNotifyEmail(event.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-400"
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Phone number (optional)
                  </label>
                  <input
                    type="tel"
                    value={notifyPhone}
                    onChange={(event) => setNotifyPhone(event.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleNotifyMe()}
                  disabled={notifyPending}
                  className="rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {notifyPending ? "Saving..." : "Notify me"}
                </button>
              </div>
              {notifyMessage ? <p className="mt-3 text-sm text-muted-foreground">{notifyMessage}</p> : null}
            </div>
          ) : null}

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

          {pageUrl ? (
            <ShareButton
              title={currentProduct.name}
              text={`Check out ${currentProduct.name} on Smartest Store KE${shareDescription ? `. ${shareDescription}` : ""}`}
              url={pageUrl}
              label="Share this product"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            />
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground"
              disabled
            >
              <Share className="h-4 w-4" />
              Share this product
            </button>
          )}
        </div>
      </div>

      <ReviewsPanel
        productId={currentProduct.id}
        averageRating={averageRating}
        reviewCount={currentProduct.reviewCount}
      />
    </div>
  );
}

function ReviewsPanelFallback() {
  return (
    <section className="mt-20 grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
      <div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-4 flex items-center gap-4">
            <div className="h-12 w-16 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-border bg-card p-5">
              <div className="h-5 w-2/5 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-4 w-full animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </section>
  );
}


