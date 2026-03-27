"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Home, Heart, ShoppingCart, Store, User2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { useSessionUser } from "@/hooks/use-session-user";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: Store },
];

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { hasHydrated, itemCount, toggleCart, closeCart } = useCartStore();
  const { isLoaded, sessionUser } = useSessionUser();
  const cartCount = hasHydrated ? itemCount() : 0;
  const wishlistHref =
    isLoaded && !sessionUser ? "/sign-in?redirect_url=%2Fwishlist" : "/wishlist";
  const accountHref = isLoaded && !sessionUser ? "/sign-in" : "/account";
  const prefetchTargets = useMemo(
    () => Array.from(new Set([...navItems.map((item) => item.href), wishlistHref, accountHref])),
    [accountHref, wishlistHref]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      prefetchTargets.forEach((href) => router.prefetch(href));
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [prefetchTargets, router]);

  const handleCartClick = () => {
    if (cartCount === 0) {
      closeCart();
      return;
    }

    toggleCart();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/98 backdrop-blur-xl md:hidden dark:bg-[#121212] dark:border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
      <div className="grid grid-cols-5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={closeCart}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold text-muted-foreground transition-colors",
              pathname === item.href && "text-brand-600"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}

        <button
          type="button"
          onClick={handleCartClick}
          className="relative flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold text-muted-foreground"
        >
          <ShoppingCart className="h-4 w-4" />
          Cart
          {cartCount > 0 && (
            <span className="absolute right-5 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] text-white">
              {cartCount}
            </span>
          )}
        </button>

        <Link
          href={wishlistHref}
          prefetch
          onClick={closeCart}
          className={cn(
            "flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold text-muted-foreground transition-colors",
            pathname === "/wishlist" && "text-brand-600"
          )}
        >
          <Heart className="h-4 w-4" />
          Wishlist
        </Link>

        <Link
          href={accountHref}
          prefetch
          onClick={closeCart}
          className={cn(
            "flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold text-muted-foreground transition-colors",
            pathname === "/account" && "text-brand-600"
          )}
        >
          <User2 className="h-4 w-4" />
          Account
        </Link>
      </div>
    </div>
  );
}
