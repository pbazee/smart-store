"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Heart, Share2, Truck, Shield, RefreshCcw, Ruler, Star, Minus, Plus, Zap } from "lucide-react";
import { useCartStore, useWishlistStore } from "@/store";
import { formatKES, cn } from "@/lib/utils";
import { getMockProductBySlug, getMockRelatedProducts } from "@/lib/mock-data";
import { ProductCard } from "@/components/shop/ProductCard";
import confetti from "canvas-confetti";
import type { ProductVariant } from "@/types";

interface PDPProps {
  params: { slug: string };
}

export default function ProductPage({ params }: PDPProps) {
  const product = getMockProductBySlug(params.slug);
  if (!product) notFound();

  const related = getMockRelatedProducts(product);
  const { addItem, openCart } = useCartStore();
  const { toggle, has } = useWishlistStore();

  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);

  const isWished = has(product.id);

  const selectedVariant: ProductVariant | undefined = product.variants.find(
    (v) => v.color === selectedColor.name && (selectedSize ? v.size === selectedSize : true)
  );

  const variantImages =
    product.variants.find((v) => v.color === selectedColor.name)?.images || product.images;

  const displayImages = variantImages.length ? variantImages : product.images;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }

    const variant = product.variants.find(
      (v) => v.color === selectedColor.name && v.size === selectedSize
    );
    if (!variant) return;

    addItem({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      brand: product.brand,
      size: variant.size,
      color: variant.color,
      colorHex: variant.colorHex,
      price: variant.price,
      quantity,
      image: product.mainImage,
      slug: product.slug,
    });

    setAddedToCart(true);
    openCart();

    // Confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f97316", "#ea580c", "#fb923c", "#fed7aa"],
    });

    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const currentPrice = selectedVariant?.price || product.basePrice;
  const stockForSelected = product.variants
    .filter((v) => v.color === selectedColor.name && (!selectedSize || v.size === selectedSize))
    .reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-2 gap-12 xl:gap-16">
        {/* Images */}
        <div className="space-y-4">
          {/* Main image */}
          <div
            ref={imageRef}
            className={cn(
              "relative aspect-square overflow-hidden rounded-2xl bg-muted cursor-zoom-in",
              isZoomed && "cursor-zoom-out"
            )}
            onMouseMove={handleImageMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <Image
              src={displayImages[activeImage] || product.mainImage}
              alt={product.name}
              fill
              className={cn(
                "object-cover transition-transform duration-200",
                isZoomed ? "scale-150" : "scale-100"
              )}
              style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isNew && (
                <span className="bg-foreground text-background text-xs font-bold px-3 py-1 rounded-full">NEW</span>
              )}
              {product.discount && (
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                  -{product.discount}%
                </span>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={() => toggle(product.id)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 dark:bg-background/90 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow"
            >
              <Heart className={cn("w-5 h-5", isWished ? "fill-red-500 text-red-500" : "")} />
            </button>
          </div>

          {/* Thumbnails */}
          {displayImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {displayImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all",
                    activeImage === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-6">
          {/* Brand + Name */}
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">{product.brand}</p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl mt-1">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-muted"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} · {product.reviewCount} reviews
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="font-display font-bold text-4xl kes text-primary">{formatKES(currentPrice)}</span>
            {product.originalPrice && (
              <>
                <span className="text-xl text-muted-foreground line-through kes">
                  {formatKES(product.originalPrice)}
                </span>
                <span className="price-badge">Save {product.discount}%</span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          {/* Colors */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Color: <span className="font-normal text-muted-foreground">{selectedColor.name}</span></span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {product.colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => { setSelectedColor(color); setActiveImage(0); }}
                  title={color.name}
                  className={cn(
                    "w-10 h-10 rounded-full border-4 transition-all hover:scale-110",
                    selectedColor.name === color.name
                      ? "border-primary scale-110 ring-2 ring-primary ring-offset-2"
                      : "border-border hover:border-muted-foreground"
                  )}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={cn("text-sm font-semibold", sizeError && "text-destructive")}>
                {sizeError ? "Please select a size" : "Size"}
              </span>
              <button
                onClick={() => setShowSizeGuide(true)}
                className="text-xs text-primary flex items-center gap-1 hover:opacity-70"
              >
                <Ruler className="w-3 h-3" /> Size Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => {
                const sizeVariant = product.variants.find(
                  (v) => v.size === size && v.color === selectedColor.name
                );
                const outOfStock = sizeVariant ? sizeVariant.stock === 0 : false;

                return (
                  <button
                    key={size}
                    onClick={() => !outOfStock && setSelectedSize(size)}
                    disabled={outOfStock}
                    className={cn(
                      "min-w-[56px] px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                      selectedSize === size
                        ? "bg-foreground text-background border-foreground"
                        : outOfStock
                        ? "bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed line-through"
                        : "bg-card border-border hover:border-foreground hover:bg-muted"
                    )}
                  >
                    {size}
                    {sizeVariant && sizeVariant.stock <= 3 && sizeVariant.stock > 0 && (
                      <span className="block text-[10px] text-amber-500 font-normal">Low</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock warning */}
          {stockForSelected <= 5 && stockForSelected > 0 && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-4 py-3 text-sm">
              <Zap className="w-4 h-4" />
              <span>Only {stockForSelected} left in stock — order soon!</span>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex gap-4">
            <div className="flex items-center bg-muted rounded-xl">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-4 hover:text-primary transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-4 hover:text-primary transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <motion.button
              onClick={handleAddToCart}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all",
                addedToCart
                  ? "bg-green-500 text-white"
                  : "bg-primary text-white hover:bg-primary/90"
              )}
            >
              <ShoppingBag className="w-5 h-5" />
              {addedToCart ? "Added to Cart! 🎉" : "Add to Cart"}
            </motion.button>
          </div>

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
            {[
              { icon: Truck, text: "Free Delivery", sub: "Orders over KSh 5,000" },
              { icon: Shield, text: "Authentic", sub: "100% genuine products" },
              { icon: RefreshCcw, text: "30-Day Returns", sub: "Hassle-free returns" },
            ].map((item) => (
              <div key={item.text} className="text-center">
                <item.icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <p className="text-xs font-semibold">{item.text}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Share */}
          <div className="flex gap-3 pt-2">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-20 border-t border-border pt-16">
          <h2 className="font-display font-bold text-3xl mb-8">You Might Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSizeGuide(false)}
              className="fixed inset-0 bg-foreground/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-2xl p-8 z-50 w-[90vw] max-w-lg shadow-2xl"
            >
              <h3 className="font-display font-bold text-2xl mb-4">Size Guide</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4">UK</th>
                      <th className="text-left py-2 pr-4">EU</th>
                      <th className="text-left py-2 pr-4">US</th>
                      <th className="text-left py-2">CM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["UK 6", "EU 39", "US 7", "24.5"],
                      ["UK 7", "EU 40", "US 8", "25.5"],
                      ["UK 8", "EU 42", "US 9", "26.5"],
                      ["UK 9", "EU 43", "US 10", "27.5"],
                      ["UK 10", "EU 44", "US 11", "28.5"],
                      ["UK 11", "EU 45", "US 12", "29.5"],
                    ].map((row) => (
                      <tr key={row[0]} className="border-b border-border/50 hover:bg-muted/50">
                        {row.map((cell) => <td key={cell} className="py-2 pr-4">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                💡 If you&apos;re between sizes, we recommend sizing up for a comfortable fit.
              </p>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="mt-6 w-full bg-foreground text-background py-3 rounded-xl font-semibold hover:bg-primary transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
