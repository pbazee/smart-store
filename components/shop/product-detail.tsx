"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Truck, Shield, ZoomIn, Share2 } from "lucide-react";
import type { Product, ProductVariant } from "@/types";
import { formatKES, cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/lib/use-toast";
import confetti from "canvas-confetti";

export function ProductDetail({ product }: { product: Product }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    product.variants[0]?.color ?? ""
  );
  const [selectedSize, setSelectedSize] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);

  const { addItem } = useCartStore();
  const { toast } = useToast();

  const colors = [...new Set(product.variants.map((v) => v.color))];
  const sizesForColor = product.variants
    .filter((v) => v.color === selectedColor)
    .map((v) => v.size);

  const selectedVariant: ProductVariant | undefined = product.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({ title: "Please select a size", variant: "destructive" });
      return;
    }
    if (!selectedVariant) return;
    if (selectedVariant.stock === 0) {
      toast({ title: "Out of stock", variant: "destructive" });
      return;
    }

    addItem(product, selectedVariant);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f97316", "#ea580c", "#fdba74"],
    });

    toast({
      title: "Added to cart! 🎉",
      description: `${product.name} — ${selectedColor}, Size ${selectedSize}`,
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
      {/* Images */}
      <div className="space-y-3">
        <div
          ref={imgRef}
          className="relative aspect-square rounded-2xl overflow-hidden bg-muted cursor-zoom-in"
          onMouseEnter={() => setZoomed(true)}
          onMouseLeave={() => setZoomed(false)}
          onMouseMove={handleMouseMove}
        >
          <Image
            src={product.images[selectedImage]}
            alt={product.name}
            fill
            priority
            className={cn(
              "object-cover transition-transform duration-200",
              zoomed ? "scale-150" : "scale-100"
            )}
            style={
              zoomed
                ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` }
                : {}
            }
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {!zoomed && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
              <ZoomIn className="w-3 h-3" /> Hover to zoom
            </div>
          )}
          {product.isNew && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-brand-500 text-white text-xs font-bold rounded-full">
              NEW ARRIVAL
            </div>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedImage(i)}
              className={cn(
                "w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all",
                selectedImage === i
                  ? "border-brand-500"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image src={img} alt="" width={80} height={80} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-500">
              {product.category} · {product.subcategory}
            </span>
          </div>
          <h1 className="text-3xl font-black leading-tight mb-3">{product.name}</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-4 h-4",
                    i < Math.floor(product.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted"
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>
        </div>

        <div className="text-3xl font-black text-brand-600">
          {selectedVariant
            ? formatKES(selectedVariant.price)
            : formatKES(product.basePrice)}
        </div>

        <p className="text-muted-foreground leading-relaxed">{product.description}</p>

        {/* Color */}
        <div>
          <p className="text-sm font-semibold mb-2">
            Color: <span className="font-bold">{selectedColor}</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {colors.map((color) => {
              const variant = product.variants.find((v) => v.color === color);
              return (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    setSelectedSize("");
                  }}
                  title={color}
                  className={cn(
                    "w-9 h-9 rounded-full border-2 transition-all hover:scale-110",
                    selectedColor === color
                      ? "border-brand-500 scale-110 ring-2 ring-brand-500 ring-offset-2"
                      : "border-border"
                  )}
                  style={{ backgroundColor: variant?.colorHex }}
                />
              );
            })}
          </div>
        </div>

        {/* Size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Size</p>
            <button className="text-xs text-brand-500 hover:underline">Size Guide</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {sizesForColor.map((size) => {
              const v = product.variants.find(
                (v) => v.color === selectedColor && v.size === size
              );
              const outOfStock = v?.stock === 0;
              return (
                <button
                  key={size}
                  onClick={() => !outOfStock && setSelectedSize(size)}
                  disabled={outOfStock}
                  className={cn(
                    "px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all",
                    outOfStock && "opacity-30 cursor-not-allowed line-through",
                    selectedSize === size
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-border hover:border-foreground"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
          {selectedVariant && selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
              ⚡ Only {selectedVariant.stock} left in stock!
            </p>
          )}
        </div>

        {/* Add to Cart */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAddToCart}
          className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl flex items-center justify-center gap-3 text-lg transition-colors shadow-lg shadow-brand-500/25"
        >
          <ShoppingBag className="w-5 h-5" />
          Add to Cart · {selectedVariant ? formatKES(selectedVariant.price) : formatKES(product.basePrice)}
        </motion.button>

        {/* Trust signals */}
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Truck className="w-4 h-4 text-green-500" />
            <span>Free delivery in Nairobi</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>30-day returns</span>
          </div>
        </div>

        {/* M-Pesa badge */}
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
          <span className="text-green-600 font-bold text-sm">📱 M-Pesa</span>
          <span className="text-sm text-green-700 dark:text-green-400">
            Pay instantly with Safaricom M-Pesa. No card needed.
          </span>
        </div>

        <button
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: product.name, url: window.location.href });
            }
          }}
        >
          <Share2 className="w-4 h-4" /> Share this product
        </button>
      </div>
    </div>
  );
}
