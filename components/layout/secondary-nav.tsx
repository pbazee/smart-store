"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Sparkles, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  desktopSecondaryLinks,
  mobileMenuSections,
  popularBrands,
} from "@/lib/site-content";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  const [targetPath, targetSearch] = href.split("?");

  if (targetPath === "/") {
    return pathname === "/" && !targetSearch;
  }

  if (!(pathname === targetPath || pathname.startsWith(`${targetPath}/`))) {
    return false;
  }

  if (!targetSearch) {
    return true;
  }

  return false;
}

function DesktopLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors",
        active
          ? "bg-orange-500 text-white"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

export function SecondaryNavBar() {
  const pathname = usePathname();

  return (
    <div className="hidden border-t border-border/70 bg-background/92 lg:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1">
          {desktopSecondaryLinks.slice(0, 5).map((link) => (
            <DesktopLink
              key={link.href}
              href={link.href}
              label={link.label}
              pathname={pathname}
            />
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors",
                  isActivePath(pathname, "/brands")
                    ? "bg-orange-500 text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                Brands
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 rounded-[1.5rem] p-3">
              <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                Popular Brands
              </div>
              {popularBrands.map((brand) => (
                <DropdownMenuItem key={brand.name} asChild className="items-start rounded-2xl">
                  <Link href={brand.href} className="flex-col items-start gap-1">
                    <span className="font-semibold text-foreground">{brand.name}</span>
                    <span className="text-xs text-muted-foreground">{brand.description}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {desktopSecondaryLinks.slice(5).map((link) => (
            <DesktopLink
              key={link.href}
              href={link.href}
              label={link.label}
              pathname={pathname}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-orange-600">
          <Sparkles className="h-3.5 w-3.5" />
          Nairobi summer edit live
        </div>
      </div>
    </div>
  );
}

export function MobileSiteMenu({
  isOpen,
  isSignedIn,
  onClose,
}: {
  isOpen: boolean;
  isSignedIn: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/55 lg:hidden"
        >
          <button
            type="button"
            aria-label="Close menu overlay"
            className="absolute inset-0 h-full w-full"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative h-full w-[86vw] max-w-sm overflow-y-auto border-r border-white/10 bg-[#0b0d12] px-5 pb-8 pt-6 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">
                  Explore
                </p>
                <h2 className="mt-2 text-2xl font-black">Full site menu</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overlay-readable-surface mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em]">
                Nairobi Summer 2026
              </p>
              <p className="mt-2 text-sm">
                New arrivals, trend edits, brand spotlights, and story pages without touching the
                main top bar.
              </p>
            </div>

            <div className="mt-6 space-y-6">
              {mobileMenuSections.map((section) => (
                <section key={section.title}>
                  <h3 className="overlay-readable-text text-xs font-bold uppercase tracking-[0.24em]">
                    {section.title}
                  </h3>
                  <div className="mt-3 grid gap-2">
                    {section.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors",
                          isActivePath(pathname, link.href)
                            ? "border-orange-400/50 bg-orange-500/15 text-white"
                            : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}

              <section>
                <h3 className="overlay-readable-text text-xs font-bold uppercase tracking-[0.24em]">
                  Popular Brands
                </h3>
                <div className="mt-3 grid gap-2">
                  {popularBrands.map((brand) => (
                    <Link
                      key={brand.name}
                      href={brand.href}
                      onClick={onClose}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10"
                    >
                      <p className="overlay-readable-text text-sm font-semibold">{brand.name}</p>
                      <p className="overlay-readable-text mt-1 text-xs">{brand.description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            {!isSignedIn && (
              <div className="mt-8 grid gap-3">
                <Link
                  href="/sign-in"
                  onClick={onClose}
                  className="rounded-full border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={onClose}
                  className="rounded-full bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.28)]"
                >
                  Join
                </Link>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
