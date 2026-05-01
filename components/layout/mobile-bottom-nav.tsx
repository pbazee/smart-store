"use client";

import Link from "next/link";
import { Heart, Home, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { usePathname } from "next/navigation";
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
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
          );
        })}
      </div>
    </nav>
  );
}
