"use client";

import Link from "next/link";
import { Heart, Home, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useCartStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account", label: "Account", icon: User },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { hasHydrated, cartCount } = useCartStore(
    useShallow((state) => ({
      hasHydrated: state.hasHydrated,
      cartCount: state.items.reduce((sum, item) => sum + item.quantity, 0),
    }))
  );
  const count = hasHydrated ? cartCount : 0;

  if (
    pathname?.startsWith("/admin") ||
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname?.startsWith("/auth/")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
      <div
        className="grid grid-cols-5 items-center px-2 py-2"
        style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))" }}
      >
        {links.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href === "/shop" && pathname?.startsWith("/shop")) ||
            (href === "/account" && pathname?.startsWith("/account")) ||
            (href === "/wishlist" && pathname?.startsWith("/wishlist")) ||
            (href === "/cart" && pathname?.startsWith("/cart"));
          const showCartBadge = href === "/cart" && count > 0;

          return (
          <Link
            key={href}
            href={href}
            prefetch
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1 transition-colors",
              isActive ? "text-orange-500" : "text-muted-foreground"
            )}
          >
            <span className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              {showCartBadge ? (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
                  {count}
                </span>
              ) : null}
            </span>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
          );
        })}
      </div>
    </nav>
  );
}
