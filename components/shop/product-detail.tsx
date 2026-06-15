"use client";


import { useEffect, useMemo, useRef, useState } from "react";
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
import { ShareButton } from "@/components/shared/share-button";
import { SizeGuideDialog } from "@/components/shop/size-guide-dialog";
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
import type { Product, ProductReview, ProductVariant } from "@/types";

import { ReviewsPanel } from "@/components/shop/reviews-panel";

export function ProductDetail({
  product,
  initialReviews = [],
}: {
  product: Product;
  initialReviews?: ProductReview[];
}) {
  // Always show the base/primary product image on initial load.
  // Variant images are only shown when the user explicitly selects a color swatch.
  const initialDisplayImage =
    product.images[0] ||
    product.variants.find((variant) => variant.variantImageUrl)?.variantImageUrl ||
    "/images/product-placeholder.png";
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
  const [displayedImage, setDisplayedImage] = useState(initialDisplayImage);
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
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

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
  const selectedColorVariant = useMemo(
    () => currentProduct.variants.find((variant) => variant.color === selectedColor),
    [currentProduct.variants, selectedColor]
  );
  const variantImages = useMemo(
    () =>
      currentProduct.variants
        .map((variant) => variant.variantImageUrl)
        .filter((image): image is string => Boolean(image?.trim())),
    [currentProduct.variants]
  );
  const displayImages = useMemo(() => {
    const variantImage = selectedVariant?.variantImageUrl || "";

    return Array.from(
      new Set([variantImage, ...currentProduct.images, ...variantImages].filter(Boolean))
    );
  }, [
    currentProduct.images,
    currentProduct.variants,
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
  // FIX 2: price is derived ONLY from a fully-selected variant (color + size).
  // Dropping the selectedColorVariant fallback prevents the price sticking at a
  // previously-selected variant's price when the user clicks back to a color
  // without yet picking a size.
  const displayedPrice = selectedVariant?.price ?? currentProduct.basePrice;
  const sharePrice = displayedPrice;
  const sharePriceLabel = `Ksh ${sharePrice.toLocaleString()}`;
  const normalizedShareSummary = `${currentProduct.name} - ${sharePriceLabel}`;
  const shareDescription = currentProduct.description?.trim()
    ? `${currentProduct.description.trim().slice(0, 100)}${currentProduct.description.trim().length > 100 ? "..." : ""}`
    : "";
  // Share uses selected variant image when available, falls back to base product image.
  const shareImage =
    selectedVariant?.variantImageUrl ||
    selectedColorVariant?.variantImageUrl ||
    currentProduct.images[0] ||
    displayedImage ||
    "";
  // Build the share URL — append ?variant=ID so og:image resolves to the correct variant image.
  const shareUrl = pageUrl
    ? selectedVariant?.id
      ? `${pageUrl}?variant=${selectedVariant.id}`
      : pageUrl
    : "";
  const shareImageUrl = shareUrl && shareImage ? new URL(shareImage, shareUrl).toString() : shareImage;
  // Compose the share text including variant details when selected.
  const variantDetail = selectedVariant
    ? ` (${selectedVariant.color}, Size ${selectedVariant.size})`
    : "";

  // FIX 4 — platform-diagnostic URL deduplication:
  // The message BODY never embeds the product URL. Each sharing platform
  // receives the URL via its own dedicated channel:
  //   • navigator.share  → `url` field in ShareData
  //   • WhatsApp         → appended once at the end of the wa.me text
  //   • Twitter          → separate `url=` query param
  //   • ShareButton      → `url` prop (clipboard fallback writes only the url)
  // This ensures exactly one URL appears regardless of platform.
  const normalizedShareMessageBody = `🛍️ *${currentProduct.name}${variantDetail}*\n💰 ${sharePriceLabel}${shareDescription ? `\n\n${shareDescription}` : ""}`;
  const normalizedWhatsappShareUrl = shareUrl
    ? `https://wa.me/?text=${encodeURIComponent(`${normalizedShareMessageBody}\n\n👉 Shop here: ${shareUrl}`)}`
    : "";
  const normalizedTwitterShareUrl = shareUrl
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(normalizedShareSummary)}&url=${encodeURIComponent(shareUrl)}`
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
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    // On product change, reset to base image first
    const nextDisplayImage =
      product.images[0] ||
      product.variants.find((variant) => variant.variantImageUrl)?.variantImageUrl ||
      "/images/product-placeholder.png";

    setLiveProduct(product);
    setSelectedColor("");
    setSelectedSize("");
    setDisplayedImage(nextDisplayImage);

    // Fetch live stock/price so the cached page immediately updates with reality
    const fetchLiveProduct = async () => {
      try {
        const res = await fetch(`/api/products/${product.slug}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setLiveProduct(json.data);
          }
        }
      } catch (err) {}
    };
    fetchLiveProduct();
  }, [product]);

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
    if (!selectedColor) {
      setSelectedSize("");
      return;
    }

    const hasSelectedSize = currentProduct.variants.some(
      (variant) => variant.color === selectedColor && variant.size === selectedSize
    );

    if (selectedSize && !hasSelectedSize) {
      setSelectedSize("");
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
        title: "Sign in to save",
        description: "Let's create an account to start building your wishlist.",
      });
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname || "/wishlist")}`);
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
      // Use clean text without the inline URL — the `url` field in ShareData handles it.
      // Passing the URL in both `text` and `url` causes it to appear twice in native dialogs.
      const variantDetail = selectedVariant
        ? ` (${selectedVariant.color}, Size ${selectedVariant.size})`
        : "";
      const cleanShareText = `🛍️ ${currentProduct.name}${variantDetail} — ${sharePriceLabel}${shareDescription ? `\n${shareDescription}` : ""}`;
      await navigator.share({
        title: currentProduct.name,
        text: cleanShareText,
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
            {displayImages.map((image, index) => {
              // Determine if this thumbnail belongs to a known variant
              const thumbVariant = currentProduct.variants.find(
                (v) => v.variantImageUrl && v.variantImageUrl === image
              );
              // A thumbnail is "active" when it matches the displayed image OR the selected color variant
              const isActive =
                displayedImage === image ||
                (thumbVariant && thumbVariant.color === selectedColor && displayedImage === image);
              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => {
                    setSelectedImage(index);
                    setDisplayedImage(image);
                    // Sync color swatch: if this thumbnail belongs to a variant, select that color
                    if (thumbVariant && thumbVariant.color !== selectedColor) {
                      setSelectedColor(thumbVariant.color);
                      setSelectedSize("");
                      setNotifyOpen(false);
                      setNotifyMessage(null);
                    }
                  }}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-2xl border-2 transition-all",
                    isActive
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
              );
            })}
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
            {formatKES(displayedPrice)}
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
                          // Compute sizes for the clicked color inline so we can auto-select
                          // if there is only one size available for this color (covers One Size,
                          // single-size-per-color accessories, and single-size clothing variants).
                          const sizesForClickedColor = [
                            ...new Set(
                              currentProduct.variants
                                .filter((v) => v.color === color)
                                .map((v) => v.size.trim())
                                .filter(Boolean)
                            ),
                          ];
                          const autoSize =
                            sizesForClickedColor.length === 1 && sizesForClickedColor[0]
                              ? sizesForClickedColor[0]
                              : "";

                          setSelectedColor(color);
                          setSelectedSize(autoSize);
                          const variantImg = variant?.variantImageUrl || currentProduct.images[0] || initialDisplayImage;
                          setDisplayedImage(variantImg);
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
            {/* FIX 1 — 4-state Add to Cart button.
                State A: all sizes OOS or no-variant product OOS → Notify me
                State B: selected variant is OOS (stock=0) → disabled "Out of stock" + auto-open Notify Me
                State C: variants exist but not fully selected → disabled "Select options to continue"
                State D: ready → active "Add to cart - Ksh X" */}
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
            ) : selectedVariant && selectedVariant.stock === 0 ? (
              // State B — a specific variant is selected but has zero stock
              <button
                type="button"
                disabled
                onClick={() => {
                  setNotifyOpen(true);
                  setNotifyMessage(null);
                }}
                className="flex w-full items-center justify-center gap-3 rounded-[1.35rem] bg-muted px-6 py-4 text-base font-bold text-muted-foreground shadow-none cursor-not-allowed"
              >
                <ShoppingBag className="h-5 w-5" />
                Out of stock
              </button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.985 }}
                type="button"
                onClick={handleAddToCart}
                disabled={hasVariants && (!selectedColor || !selectedSize)}
                className="flex w-full items-center justify-center gap-3 rounded-[1.35rem] bg-brand-500 px-6 py-4 text-base font-bold text-white shadow-[0_14px_40px_rgba(249,115,22,0.24)] transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
              >
                <ShoppingBag className="h-5 w-5" />
                {hasVariants && (!selectedColor || !selectedSize)
                  ? "Select options to continue"
                  : `Add to cart - ${formatKES(displayedPrice)}`}
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

          {/* State B — auto-surface Notify Me when selected variant is OOS */}
          {selectedVariant && selectedVariant.stock === 0 && !notifyOpen && (
            <button
              type="button"
              onClick={() => {
                setNotifyOpen(true);
                setNotifyMessage(null);
              }}
              className="-mt-1 flex w-full items-center justify-center gap-2 rounded-[1.35rem] border border-border px-6 py-3.5 text-sm font-bold text-foreground transition-colors hover:border-brand-300 hover:text-brand-600"
            >
              Notify me when back in stock
            </button>
          )}

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

          {shareUrl ? (
            <ShareButton
              title={`${currentProduct.name}${selectedVariant ? ` – ${selectedVariant.color}, Size ${selectedVariant.size}` : ""}`}
              text={normalizedShareMessageBody}
              url={shareUrl}
              imageUrl={shareImageUrl}
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
        initialReviews={initialReviews}
      />
    </div>
  );
}


