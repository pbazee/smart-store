"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Heart } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/types";
import { formatKES, cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/lib/use-toast";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const firstVariant = product.variants[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (firstVariant) {
      addItem(product, firstVariant);
      toast({
        title: "Added to cart! 🛍️",
        description: `${product.name} - ${firstVariant.color}, Size ${firstVariant.size}`,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-xl bg-muted aspect-[3/4] product-card-hover">
          {/* Main image */}
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className={cn(
              "object-cover transition-all duration-500",
              hovered && product.images[1] ? "opacity-0" : "opacity-100"
            )}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          {/* Hover image */}
          {product.images[1] && (
            <Image
              src={product.images[1]}
              alt={product.name}
              fill
              className={cn(
                "object-cover transition-all duration-500",
                hovered ? "opacity-100" : "opacity-0"
              )}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="px-2 py-0.5 bg-brand-500 text-white text-xs font-bold rounded-full">
                NEW
              </span>
            )}
            {product.tags.includes("trending") && (
              <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
                TRENDING
              </span>
            )}
            {product.tags.includes("bestseller") && (
              <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">
                BESTSELLER
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setWishlist(!wishlist);
            }}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                wishlist ? "fill-red-500 text-red-500" : "text-foreground"
              )}
            />
          </button>

          {/* Quick Add */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={hovered ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            onClick={handleQuickAdd}
            className="absolute bottom-3 left-3 right-3 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-600 dark:hover:bg-brand-100 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Quick Add
          </motion.button>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
            <p className="font-bold text-brand-600 text-sm whitespace-nowrap">
              {formatKES(product.basePrice)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-muted-foreground">
              {product.rating} ({product.reviewCount})
            </span>
          </div>
          {/* Color swatches */}
          <div className="flex items-center gap-1 pt-0.5">
            {[...new Set(product.variants.map((v) => v.colorHex))].slice(0, 4).map((hex) => (
              <div
                key={hex}
                className="w-3.5 h-3.5 rounded-full border border-border"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
