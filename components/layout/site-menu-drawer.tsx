"use client";

import Link from "next/link";
import { LayoutDashboard, Package2, User2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  drawerCategoryLinks,
  drawerMenuLinks,
  isNavigationLinkActive,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";
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
  isSignedIn: boolean;
  isAdmin: boolean;
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
        "rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors",
        active
          ? "border-orange-300/70 bg-orange-500/10 text-foreground"
          : "border-border/70 bg-background text-muted-foreground hover:border-orange-200 hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

export function SiteMenuDrawer({
  open,
  onOpenChange,
  isSignedIn,
  isAdmin,
}: SiteMenuDrawerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const closeDrawer = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[90vw] max-w-sm border-border/70 bg-background/98 px-0"
      >
        <div className="flex h-full flex-col overflow-y-auto px-6 pb-8 pt-6">
          <SheetHeader className="pr-10">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-600">Menu</p>
            <SheetTitle className="font-display text-3xl">Smartest Store KE</SheetTitle>
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
                      className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-orange-200 hover:text-foreground"
                    >
                      <User2 className="h-4 w-4" />
                      My Account
                    </Link>
                    <Link
                      href="/orders"
                      onClick={closeDrawer}
                      className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-orange-200 hover:text-foreground"
                    >
                      <Package2 className="h-4 w-4" />
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={closeDrawer}
                        className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-orange-200 hover:text-foreground"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      onClick={closeDrawer}
                      className="rounded-full border border-border px-4 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      onClick={closeDrawer}
                      className="rounded-full bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.24)] transition-colors hover:bg-orange-600"
                    >
                      Join
                    </Link>
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
