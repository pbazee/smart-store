import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CreditCard, Shield, Truck } from "lucide-react";
import { AuthThemeToggle } from "@/components/auth/auth-theme-toggle";
import { getStoreLogoSetFromSettings } from "@/lib/store-branding-shared";
import type { StoreSettings } from "@/types";

type AuthShellProps = {
  mode: "sign-in" | "sign-up" | "forgot-password" | "reset-password";
  children: ReactNode;
  redirectPath?: string;
  storeSettings?: StoreSettings | null;
};

const authContent = {
  "sign-in": {
    title: "Sign in to Smartest Store KE",
    subtitle: "Access your orders, saved items, and checkout details in one place.",
  },
  "sign-up": {
    title: "Create your account",
    subtitle: "Join Smartest Store KE for faster checkout, saved orders, and wishlist sync.",
  },
  "forgot-password": {
    title: "Reset your password",
    subtitle: "Enter the email linked to your account and we will send you a secure reset link.",
  },
  "reset-password": {
    title: "Choose a new password",
    subtitle: "Set a fresh password for your account and we will sign you in right away.",
  },
} as const;

const authHeroImage =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85";

function buildAuthHref(pathname: string, redirectPath?: string) {
  if (!redirectPath) {
    return pathname;
  }

  return `${pathname}?redirect_url=${encodeURIComponent(redirectPath)}`;
}

export function AuthShell({ mode, children, redirectPath, storeSettings }: AuthShellProps) {
  const content = authContent[mode];
  const branding = getStoreLogoSetFromSettings(storeSettings);
  const shouldShowCheckoutBanner = mode === "sign-in" && redirectPath === "/checkout";
  const titleParts =
    mode === "sign-in" && content.title.includes(branding.storeName)
      ? content.title.split(branding.storeName)
      : [content.title, ""];
  const alternateAction = {
    "sign-in": {
      prompt: "New here?",
      href: "/sign-up",
      label: "Create an account",
    },
    "sign-up": {
      prompt: "Already have an account?",
      href: "/sign-in",
      label: "Sign in",
    },
    "forgot-password": {
      prompt: "Remembered your password?",
      href: "/sign-in",
      label: "Sign in",
    },
    "reset-password": {
      prompt: "Need another email?",
      href: "/forgot-password",
      label: "Request a new link",
    },
  }[mode];

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="relative hidden min-h-screen overflow-hidden border-r border-white/6 lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.78)),linear-gradient(135deg,rgba(9,9,11,0.12),rgba(9,9,11,0.92)),url('${authHeroImage}')`,
            }}
          />
          <div className="absolute inset-0 bg-black/10" />

          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between p-10 xl:p-14">
            <Link href="/" className="inline-flex items-center gap-4 group">
              {branding.logoDarkUrl || branding.logoUrl ? (
                <div className="relative h-12 w-32 overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src={branding.logoDarkUrl || branding.logoUrl || ""}
                    alt={branding.storeName}
                    fill
                    sizes="128px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-lg font-black text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
                  SK
                </div>
              )}
              <div className="flex flex-col">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-200">
                  {branding.storeName}
                </p>
                <p className="text-sm font-medium text-zinc-300/85">
                  {branding.storeTagline || "Kenya's smartest fashion destination"}
                </p>
              </div>
            </Link>

            <div className="max-w-xl pt-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-black/25 px-4 py-2 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-orange-200">
                  {mode === "sign-in" ? "Welcome back" : "Your account, styled"}
                </span>
              </div>

              <h1 className="mt-8 font-display text-5xl font-black leading-[0.98] tracking-tight text-white xl:text-7xl">
                {mode === "sign-in" ? (
                  <>
                    {titleParts[0]}
                    <span className="text-orange-500">{branding.storeName}</span>
                    {titleParts[1]}
                  </>
                ) : (
                  content.title
                )}
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-200/80">
                {content.subtitle}
              </p>
            </div>

            <div className="max-w-md rounded-[1.5rem] border border-white/10 bg-black/38 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Secure &amp; Safe</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-300/80">
                      Your data and checkout details stay protected.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Fast Checkout</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-300/80">
                      Save time with account details ready at payment.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Track Orders</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-300/80">
                      Keep delivery updates and order history together.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_24%),linear-gradient(180deg,#111114,#09090b)] px-5 py-8 sm:px-8 lg:px-12">
          <div className="absolute right-5 top-5 z-20 sm:right-8 sm:top-8">
            <AuthThemeToggle />
          </div>

          <div className="w-full max-w-[540px]">
            {shouldShowCheckoutBanner ? (
              <div className="mb-6 rounded-2xl border border-orange-400/20 bg-orange-500/10 px-5 py-4 text-sm font-semibold text-orange-100 backdrop-blur-md">
                Sign in to complete your purchase.
              </div>
            ) : null}

            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                {branding.logoDarkUrl || branding.logoUrl ? (
                  <div className="relative h-10 w-28 overflow-hidden rounded-lg">
                    <Image
                      src={branding.logoDarkUrl || branding.logoUrl || ""}
                      alt={branding.storeName}
                      fill
                      sizes="112px"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-sm font-black text-white shadow-md">
                    SK
                  </div>
                )}
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-white">
                    {branding.storeName}
                  </p>
                  <p className="text-xs text-zinc-400">{branding.storeTagline}</p>
                </div>
              </Link>
            </div>

            <div className="mb-8 space-y-3 text-center lg:text-left">
              <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                {mode === "sign-in" ? "Welcome back" : content.title}
              </h2>
              <p className="text-base text-zinc-400">
                {mode === "sign-in"
                  ? "Sign in to continue to your account"
                  : content.subtitle}
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/8 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:p-8">
              {children}
            </div>

            {mode !== "sign-in" ? (
              <div className="mt-8 text-center">
                <p className="text-sm text-zinc-400">
                  {alternateAction.prompt}{" "}
                  <Link
                    href={buildAuthHref(alternateAction.href, redirectPath)}
                    className="font-semibold text-orange-400 transition hover:text-orange-300"
                  >
                    {alternateAction.label}
                  </Link>
                </p>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
