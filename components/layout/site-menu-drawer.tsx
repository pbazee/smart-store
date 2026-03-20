"use client";

import Link from "next/link";
import { LayoutDashboard, Package2, User2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  drawerCategoryLinks,
  drawerMenuLinks,
  isNavigationLinkActive,
} from "@/lib/navigation";
import { useCartStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useSessionUser } from "@/hooks/use-session-user";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type SiteMenuDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DrawerLinkProps = {
  href: string;
  label: string;
  active: boolean;
  onSelect: () => void;
};

function DrawerLink({ href, label, active, onSelect }: DrawerLinkProps) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm font-semibold transition-all shadow-sm",
        active
          ? "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-orange-500/10"
          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-orange-400/50 hover:bg-zinc-100 hover:text-orange-600 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:border-white/20 dark:hover:text-white"
      )}
    >
      {label}
    </Link>
  );
}

export function SiteMenuDrawer({
  open,
  onOpenChange,
}: SiteMenuDrawerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { sessionUser } = useSessionUser();
  const closeCart = useCartStore((state) => state.closeCart);
  const closeDrawer = () => {
    closeCart();
    onOpenChange(false);
  };

  const isSignedIn = !!sessionUser;
  const isAdmin = sessionUser?.role === "admin";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[90vw] max-w-sm border-r border-border/60 bg-background font-sans dark:border-white/10 dark:bg-[#121212] px-0 shadow-2xl"
      >
        <div className="flex h-full flex-col overflow-y-auto px-6 pb-8 pt-6">
          <SheetHeader className="text-left pr-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 dark:text-orange-500">Navigation</p>
            <SheetTitle className="font-display text-3xl font-black tracking-tight text-foreground dark:text-white">Smartest Store KE</SheetTitle>
            <SheetDescription>
              Clean access to the full storefront, collections, and support pages.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-8">
            <section>
              <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Menu
              </h3>
              <div className="mt-3 grid gap-2">
                {drawerMenuLinks.map((link) => (
                  <DrawerLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    active={isNavigationLinkActive(pathname, searchParams, link.href)}
                    onSelect={closeDrawer}
                  />
                ))}

                {/* Cart and Wishlist on Mobile */}
                <DrawerLink
                  href="/cart"
                  label="Cart"
                  active={pathname === "/cart"}
                  onSelect={closeDrawer}
                />
                <DrawerLink
                  href="/wishlist"
                  label="Wishlist"
                  active={pathname === "/wishlist"}
                  onSelect={closeDrawer}
                />
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Categories
              </h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {drawerCategoryLinks.map((link) => (
                  <DrawerLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    active={isNavigationLinkActive(pathname, searchParams, link.href)}
                    onSelect={closeDrawer}
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Account
              </h3>
              <div className="mt-3 grid gap-2">
                {isSignedIn ? (
                  <>
                    <Link
                      href="/account"
                      onClick={closeDrawer}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all shadow-sm",
                        pathname === "/account"
                          ? "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-orange-400/50 hover:bg-zinc-100 hover:text-orange-600 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:border-white/20 dark:hover:text-white"
                      )}
                    >
                      <User2 className="h-4 w-4" />
                      My Account
                    </Link>
                    <Link
                      href="/orders"
                      onClick={closeDrawer}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all shadow-sm",
                        pathname === "/orders"
                          ? "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-orange-400/50 hover:bg-zinc-100 hover:text-orange-600 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:border-white/20 dark:hover:text-white"
                      )}
                    >
                      <Package2 className="h-4 w-4" />
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={closeDrawer}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all shadow-sm",
                          pathname.startsWith("/admin")
                            ? "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-orange-400/50 hover:bg-zinc-100 hover:text-orange-600 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:border-white/20 dark:hover:text-white"
                        )}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/sign-in"
                      onClick={closeDrawer}
                      className="rounded-2xl border border-border/70 dark:border-white/15 px-4 py-3.5 text-center text-sm font-bold text-foreground transition-all hover:bg-muted dark:text-white dark:hover:bg-white/5"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      onClick={closeDrawer}
                      className="rounded-2xl bg-orange-500 px-4 py-3.5 text-center text-sm font-bold text-white shadow-[0_12px_24px_rgba(249,115,22,0.3)] transition-all hover:bg-orange-600 hover:shadow-[0_12px_30px_rgba(249,115,22,0.4)]"
                    >
                      Join
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
