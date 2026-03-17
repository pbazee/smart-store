"use client";

import Link from "next/link";
import { Home, Heart, ShoppingCart, Store, User2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { useSessionUser } from "@/hooks/use-session-user";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Shop", icon: Store },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { hasHydrated, itemCount, toggleCart, closeCart } = useCartStore();
  const { sessionUser } = useSessionUser();
  const cartCount = hasHydrated ? itemCount() : 0;

  const handleCartClick = () => {
    if (cartCount === 0) {
      closeCart();
      return;
    }

    toggleCart();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/96 backdrop-blur-md md:hidden">
      <div className="grid grid-cols-5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
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
          href={sessionUser ? "/account" : "/sign-in"}
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
