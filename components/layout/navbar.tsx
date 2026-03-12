"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Menu, Moon, Search, ShoppingCart, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { AccountMenu } from "@/components/layout/account-menu";
import { SiteMenuDrawer } from "@/components/layout/site-menu-drawer";
import { isNavigationLinkActive, primaryCategoryLinks } from "@/lib/navigation";
import { useCartStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useSessionUser } from "@/hooks/use-session-user";

function DesktopNavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.22)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { sessionUser } = useSessionUser();
  const { hasHydrated, itemCount, toggleCart } = useCartStore();
  const count = hasHydrated ? itemCount() : 0;

  const submitSearch = (form: HTMLFormElement) => {
    const q = (form.elements.namedItem("q") as HTMLInputElement).value;
    if (!q.trim()) {
      return;
    }

    router.push(`/products?search=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen((open) => !open);
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/92 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[76px] grid-cols-[auto,minmax(0,1fr),auto] items-center gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-border/70 p-2.5 transition-colors hover:bg-muted"
              onClick={toggleMenu}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-xs font-black text-white shadow-md">
                SK
              </div>
              <div className="min-w-0">
                <span className="block truncate font-display text-lg font-black tracking-tight sm:hidden">
                  Smartest
                </span>
                <span className="hidden truncate font-display text-xl font-black tracking-tight sm:block">
                  Smartest Store KE
                </span>
              </div>
            </Link>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch(event.currentTarget);
            }}
            className="relative mx-auto hidden w-full max-w-2xl md:block"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              type="text"
              defaultValue={searchParams.get("search") ?? ""}
              placeholder="Search products..."
              className="h-11 w-full rounded-full border border-border/70 bg-muted/35 pl-11 pr-5 text-sm font-medium text-foreground outline-none transition-all focus:border-orange-300 focus:bg-background focus:ring-2 focus:ring-orange-500/20"
            />
          </form>

          <div className="flex items-center justify-end gap-1 lg:gap-2">
            <nav className="hidden items-center gap-1 lg:flex">
              {primaryCategoryLinks.map((link) => (
                <DesktopNavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={isNavigationLinkActive(pathname, searchParams, link.href)}
                />
              ))}
            </nav>

            <button
              type="button"
              onClick={() => {
                setSearchOpen((open) => !open);
                setMenuOpen(false);
              }}
              className="rounded-full p-2.5 transition-colors hover:bg-muted md:hidden"
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link
              href="/wishlist"
              className={cn(
                "rounded-full p-2.5 transition-colors hover:bg-muted",
                pathname === "/wishlist" && "bg-muted text-foreground"
              )}
              aria-label="Open wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>

            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="rounded-full p-2.5 transition-colors hover:bg-muted"
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 dark:hidden" />
              <Moon className="hidden h-5 w-5 dark:block" />
            </button>

            <button
              type="button"
              onClick={toggleCart}
              className={cn(
                "relative rounded-full p-2.5 transition-colors hover:bg-muted",
                pathname === "/cart" && "bg-muted text-foreground"
              )}
              aria-label="Open cart"
              suppressHydrationWarning
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white"
                  suppressHydrationWarning
                >
                  {count}
                </motion.span>
              )}
            </button>

            <AccountMenu />
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden md:hidden"
            >
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitSearch(event.currentTarget);
                }}
                className="pb-4"
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    name="q"
                    type="text"
                    autoFocus
                    defaultValue={searchParams.get("search") ?? ""}
                    placeholder="Search products..."
                    className="h-11 w-full rounded-2xl border border-border/70 bg-muted/35 pl-11 pr-5 text-sm font-medium outline-none transition-colors focus:border-orange-300 focus:bg-background"
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SiteMenuDrawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        isSignedIn={!!sessionUser}
        isAdmin={sessionUser?.role === "admin"}
      />
    </header>
  );
}
