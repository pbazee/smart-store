"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart, Menu, Moon, Search, ShoppingCart, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { useShallow } from "zustand/react/shallow";
import dynamic from "next/dynamic";
import { useRoutePrefetch } from "@/hooks/use-route-prefetch";
import { jsonFetcher } from "@/lib/fetcher";
import { getStoreLogoSetFromSettings } from "@/lib/store-branding";
import { isNavigationLinkActive, primaryCategoryLinks } from "@/lib/navigation";
import { useCartStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { StoreSettings } from "@/types";

const AccountMenu = dynamic(
  () => import("@/components/layout/account-menu").then((mod) => mod.AccountMenu),
  { ssr: false }
);
const SiteMenuDrawer = dynamic(
  () => import("@/components/layout/site-menu-drawer").then((mod) => mod.SiteMenuDrawer),
  { ssr: false }
);

function DesktopNavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
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

function SearchForm({
  defaultValue,
  onSubmit,
  className,
  inputClassName,
}: {
  defaultValue: string;
  onSubmit: (form: HTMLFormElement) => void;
  className?: string;
  inputClassName?: string;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(event.currentTarget);
      }}
      className={className}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          type="text"
          defaultValue={defaultValue}
          placeholder="Search products..."
          className={cn(
            "h-12 w-full rounded-full border border-border/70 bg-muted/35 pl-11 pr-5 text-sm font-medium text-foreground outline-none transition-all focus:border-orange-300 focus:bg-background focus:ring-2 focus:ring-orange-500/20",
            inputClassName
          )}
        />
      </div>
    </form>
  );
}

function HeaderIconButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border border-border/70 bg-background/80 p-2.5 text-muted-foreground transition-all hover:border-orange-200 hover:bg-muted hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function HeaderIconLink({
  href,
  active,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Link> & {
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border border-border/70 bg-background/80 p-2.5 text-muted-foreground transition-all hover:border-orange-200 hover:bg-muted hover:text-foreground",
        active && "border-orange-200 bg-muted text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

function BrandMark({ storeSettings }: { storeSettings: StoreSettings | null | undefined }) {
  const branding = getStoreLogoSetFromSettings(storeSettings);
  const storeName = branding.storeName;
  const lightLogo = branding.logoUrl;
  const darkLogo = branding.logoDarkUrl || lightLogo;

  if (lightLogo || darkLogo) {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-10 w-[112px] shrink-0 sm:w-[132px]">
          {lightLogo ? (
            <Image
              src={lightLogo}
              alt={storeName}
              fill
              sizes="132px"
              className={cn("object-contain dark:hidden")}
              priority
            />
          ) : null}
          {darkLogo ? (
            <Image
              src={darkLogo}
              alt={storeName}
              fill
              sizes="132px"
              className={cn("hidden object-contain dark:block")}
              priority
            />
          ) : null}
        </div>
        <div className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-semibold text-muted-foreground">
            {branding.storeTagline}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-xs font-black text-white shadow-[0_16px_32px_rgba(249,115,22,0.24)]">
        SK
      </div>
      <div className="min-w-0">
        <span className="block truncate font-display text-lg font-black tracking-tight sm:text-xl">
          {storeName}
        </span>
      </div>
    </div>
  );
}

export function Navbar({
  initialStoreSettings,
}: {
  initialStoreSettings?: StoreSettings | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { hasHydrated, cartCount, toggleCart, closeCart } = useCartStore(
    useShallow((state) => ({
      hasHydrated: state.hasHydrated,
      cartCount: state.items.reduce((sum, item) => sum + item.quantity, 0),
      toggleCart: state.toggleCart,
      closeCart: state.closeCart,
    }))
  );
  const { data: storeSettingsResponse } = useSWR<{ success: boolean; data: StoreSettings }>(
    "/api/store-settings",
    jsonFetcher,
    {
      fallbackData: initialStoreSettings
        ? { success: true, data: initialStoreSettings }
        : undefined,
      dedupingInterval: 300_000,
      revalidateOnFocus: false,
    }
  );
  const storeSettings = storeSettingsResponse?.data ?? initialStoreSettings;
  const count = hasHydrated ? cartCount : 0;
  const searchValue = searchParams.get("search") ?? "";
  const wishlistHref = "/wishlist";
  const accountHref = "/account";

  useRoutePrefetch(["/", "/shop", "/contact", "/faq", "/about", wishlistHref, accountHref]);

  const submitSearch = (form: HTMLFormElement) => {
    const q = (form.elements.namedItem("q") as HTMLInputElement).value;

    if (!q.trim()) {
      return;
    }

    router.push(`/shop?search=${encodeURIComponent(q.trim())}`);
    setMenuOpen(false);
  };

  return (
    <header className="relative z-40 w-full border-b border-border/70 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="hidden min-h-[84px] grid-cols-[auto,minmax(0,1fr),auto] items-center gap-6 py-3 md:grid">
          <Link href="/" onClick={closeCart} className="flex min-w-0 items-center gap-3">
            <BrandMark storeSettings={storeSettings} />
          </Link>

          <SearchForm
            defaultValue={searchValue}
            onSubmit={submitSearch}
            className="mx-auto w-full max-w-2xl"
          />

          <div className="flex items-center justify-end gap-1.5">
            <nav className="hidden items-center gap-1 lg:flex">
              {primaryCategoryLinks.map((link) => (
                <DesktopNavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={isNavigationLinkActive(pathname, searchParams, link.href)}
                  onClick={closeCart}
                />
              ))}
            </nav>

            <HeaderIconLink
              href={wishlistHref}
              active={pathname === "/wishlist"}
              aria-label="Open wishlist"
              onClick={closeCart}
            >
              <Heart className="h-5 w-5" />
            </HeaderIconLink>

            <HeaderIconButton
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 dark:hidden" />
              <Moon className="hidden h-5 w-5 dark:block" />
            </HeaderIconButton>

            <HeaderIconButton
              onClick={toggleCart}
              className={pathname === "/cart" ? "border-orange-200 bg-muted text-foreground" : ""}
              aria-label="Open cart"
              suppressHydrationWarning
            >
              <span className="relative block">
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                  <span
                    className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white"
                    suppressHydrationWarning
                  >
                    {count}
                  </span>
                )}
              </span>
            </HeaderIconButton>

            <AccountMenu />

            <HeaderIconButton onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </HeaderIconButton>
          </div>
        </div>

        <div className="py-3 md:hidden">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              onClick={closeCart}
              className="flex min-w-0 max-w-[8.5rem] items-center gap-2 sm:max-w-none"
            >
              <BrandMark storeSettings={storeSettings} />
            </Link>

            <div className="flex-1">
              <SearchForm
                defaultValue={searchValue}
                onSubmit={submitSearch}
                inputClassName="h-10"
              />
            </div>

            <HeaderIconButton
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </HeaderIconButton>

            <HeaderIconButton onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span className="relative block">
                <Menu className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </span>
            </HeaderIconButton>
          </div>
        </div>
      </div>

      <SiteMenuDrawer open={menuOpen} onOpenChange={setMenuOpen} />
    </header>
  );
}
