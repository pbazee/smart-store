import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
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
    formEyebrow: "Sign In",
  },
  "sign-up": {
    title: "Create your account",
    subtitle: "Join Smartest Store KE for faster checkout, saved orders, and wishlist sync.",
    formEyebrow: "Sign Up",
  },
  "forgot-password": {
    title: "Reset your password",
    subtitle: "Enter the email linked to your account and we will send you a secure reset link.",
    formEyebrow: "Forgot Password",
  },
  "reset-password": {
    title: "Choose a new password",
    subtitle: "Set a fresh password for your account and we will sign you in right away.",
    formEyebrow: "Reset Password",
  },
} as const;

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
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="flex min-h-screen">
        <aside className="relative hidden w-full max-w-2xl flex-col justify-between overflow-hidden bg-zinc-950 p-12 lg:flex">
          {/* Abstract deep background elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 grayscale" />
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="relative z-10 flex flex-col gap-12">
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
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
                  {branding.storeName}
                </p>
                <p className="text-xs font-medium text-zinc-500">
                  Kenya&apos;s smartest fashion destination
                </p>
              </div>
            </Link>

            <div className="max-w-md mt-16">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 mb-6 backdrop-blur-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                  {content.formEyebrow}
                </span>
              </div>
              <h1 className="font-display text-5xl font-black leading-[1.1] tracking-tight text-white">
                {content.title}
              </h1>
              <p className="mt-6 text-base leading-relaxed text-zinc-400">
                {content.subtitle}
              </p>
            </div>
          </div>

          <div className="relative z-10 max-w-md rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl transition-all hover:bg-white/[0.04]">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-brand-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <p className="text-sm font-bold text-white">Fast, secure checkout</p>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">
              Sign in once and we&apos;ll keep your cart, delivery flow, and order history ready across all your devices.
            </p>
          </div>
        </aside>

        <main className="flex w-full flex-1 items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-[440px]">
            {shouldShowCheckoutBanner ? (
              <div className="mb-8 rounded-2xl border border-brand-200/50 bg-brand-50/50 px-5 py-4 text-sm font-semibold text-brand-700 shadow-sm backdrop-blur-sm">
                Sign in to complete your purchase.
              </div>
            ) : null}

            <div className="mb-10 lg:hidden">
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
              </Link>
            </div>

            <div className="mb-10 space-y-3">
              <h2 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
                {content.title}
              </h2>
              <p className="text-sm text-zinc-500">{content.subtitle}</p>
            </div>

            <div className="rounded-[2rem] border border-zinc-200/60 bg-white p-6 sm:p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)]">
              {children}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-zinc-500">
                {alternateAction.prompt}{" "}
                <Link
                  href={buildAuthHref(alternateAction.href, redirectPath)}
                  className="font-semibold text-zinc-950 decoration-brand-500 decoration-2 underline-offset-4 transition-all hover:underline"
                >
                  {alternateAction.label}
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
