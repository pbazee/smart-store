"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Heart,
  LockKeyhole,
  PackageCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { resolveRequestedRedirectPath } from "@/lib/auth-routing";

type AuthShellProps = {
  mode: "sign-in" | "sign-up";
  children: ReactNode;
};

type AuthFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const authFeatures: Record<"sign-in" | "sign-up", AuthFeature[]> = {
  "sign-in": [
    {
      icon: Heart,
      title: "Wishlist Sync",
      description: "Pick up saved looks across mobile, desktop, and every new drop.",
    },
    {
      icon: PackageCheck,
      title: "Order Tracking",
      description: "Stay on top of payments, dispatch updates, and doorstep delivery.",
    },
    {
      icon: Sparkles,
      title: "Smart Recommendations",
      description: "Get sharper picks based on the styles, sizes, and brands you love.",
    },
  ],
  "sign-up": [
    {
      icon: Sparkles,
      title: "Instant Access",
      description: "Start with Google in seconds, then keep shopping without extra setup.",
    },
    {
      icon: Heart,
      title: "Exclusive Drops",
      description: "Save favorites early and stay ready for limited Nairobi releases.",
    },
    {
      icon: PackageCheck,
      title: "Faster Checkout",
      description: "Keep your account ready for smoother delivery tracking and repeat orders.",
    },
  ],
};

const authContent = {
  "sign-in": {
    eyebrow: "Customer Access",
    title: "Welcome Back",
    subtitle: "Access your wishlist, track orders, and get personalized recommendations.",
    formEyebrow: "Google First",
    formTitle: "Continue with Google",
    formSubtitle:
      "Use Google at the top for the fastest sign-in, then continue with email below if you prefer.",
    panelTitle: "Nairobi style, zero friction.",
    panelDescription:
      "Move from discovery to checkout with secure customer access built for Kenya's smartest fashion store.",
    imageSrc: "/images/mock/hero-streetwear.svg",
    imageAlt: "Streetwear collection preview",
  },
  "sign-up": {
    eyebrow: "New Customer",
    title: "Join Smartest Store KE",
    subtitle: "Join Kenya's smartest fashion store - save wishlist, track orders, exclusive drops.",
    formEyebrow: "Google First",
    formTitle: "Create Your Account",
    formSubtitle: "Join instantly with Google - no password needed.",
    panelTitle: "Your account, ready before the next drop.",
    panelDescription:
      "Save your size preferences, keep your wishlist close, and unlock a smoother checkout flow from day one.",
    imageSrc: "/images/mock/hero-women.svg",
    imageAlt: "Fashion lookbook preview",
  },
} as const;

export const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
    showOptionalFields: true,
  },
  elements: {
    rootBox: "w-full",
    card: "w-full border-0 bg-transparent shadow-none",
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsRoot: "mb-6 grid gap-3",
    socialButtonsBlockButton:
      "min-h-14 rounded-2xl border border-brand-400/40 bg-white text-slate-950 shadow-[0_18px_38px_rgba(249,115,22,0.22)] transition-all hover:border-brand-500 hover:bg-orange-50 hover:shadow-[0_22px_48px_rgba(249,115,22,0.28)]",
    socialButtonsBlockButtonText: "text-sm font-semibold text-slate-950",
    socialButtonsProviderIcon: "h-5 w-5",
    socialButtonsIconButton:
      "h-14 w-14 rounded-2xl border border-brand-400/30 bg-white text-slate-950 shadow-[0_18px_38px_rgba(249,115,22,0.18)] hover:bg-orange-50",
    formButtonPrimary:
      "mt-2 h-12 rounded-2xl bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 shadow-[0_0_35px_rgba(249,115,22,0.35)]",
    formFieldInput:
      "h-12 rounded-2xl border border-white/12 bg-black/35 text-white placeholder:text-white/35 focus:border-brand-400",
    formFieldLabel: "text-sm font-medium text-white/80",
    formFieldHintText: "text-xs text-white/55",
    formFieldWarningText: "text-xs font-medium text-amber-200",
    footerActionLink: "text-brand-300 hover:text-brand-200",
    footerActionText: "text-white/55",
    footerAction: "text-sm",
    footer: "mt-6",
    dividerRow: "my-6",
    dividerLine: "bg-white/12",
    dividerText: "text-[11px] font-semibold uppercase tracking-[0.26em] text-white/45",
    formFieldSuccessText: "text-emerald-300",
    identityPreviewText: "text-white/70",
    formResendCodeLink: "text-brand-300 hover:text-brand-200",
    formFieldErrorText: "text-rose-300",
    alert: "rounded-2xl border border-rose-400/30 bg-rose-500/10 text-rose-100",
    otpCodeFieldInput:
      "h-12 w-12 rounded-2xl border border-white/12 bg-black/35 text-white",
  },
} as const;

function shouldShowGoogleInstead(pathname: string, mode: "sign-in" | "sign-up") {
  const basePath = `/${mode}`;

  if (!pathname.startsWith(`${basePath}/`)) {
    return false;
  }

  const nestedStep = pathname.slice(basePath.length + 1).toLowerCase();
  return ["verify", "factor", "continue", "choose", "reset", "forgot"].some((token) =>
    nestedStep.includes(token)
  );
}

export function AuthShell({ mode, children }: AuthShellProps) {
  const content = authContent[mode];
  const features = authFeatures[mode];
  const isSignUp = mode === "sign-up";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectUrl = resolveRequestedRedirectPath(searchParams.get("redirect_url"), "/");
  const useGoogleInsteadHref = `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;
  const showGoogleInstead = shouldShowGoogleInstead(pathname, mode);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#05060a_0%,_#101828_50%,_#140a05_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:44px_44px] opacity-20" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="absolute top-0 left-0 right-0 flex flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 max-w-7xl">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-sm font-black text-white shadow-[0_0_30px_rgba(249,115,22,0.4)]">
              SK
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/50">
                Smartest Store KE
              </p>
              <p className="text-base font-semibold text-white">Nairobi streetwear, upgraded.</p>
            </div>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            <Sparkles className="h-3.5 w-3.5 text-brand-300" />
            East African 2026
          </div>
        </div>

        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-[0_20px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
          <div className="mb-8 rounded-[1.6rem] border border-white/10 bg-black/20 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-brand-300">
                {content.formEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-black">{content.formTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">{content.formSubtitle}</p>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100">
              <LockKeyhole className="h-3.5 w-3.5" />
              Secure login powered by Google
            </div>
          </div>

          {children}

          {showGoogleInstead && (
            <div className="mt-6 rounded-[1.6rem] border border-brand-400/20 bg-brand-500/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-300">
                Prefer Google?
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Leave this code step and jump back to the Google-first sign-in flow instead.
              </p>
              <Link
                href={useGoogleInsteadHref}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(249,115,22,0.26)] transition-all hover:scale-[1.02] hover:bg-brand-600 hover:brightness-105"
              >
                Use Google instead
              </Link>
            </div>
          )}

          {isSignUp ? (
            <p className="mt-6 text-xs leading-6 text-white/45">
              By signing up, you agree to our{" "}
              <Link href="/privacy-policy" className="text-brand-300 hover:text-brand-200">
                Terms
              </Link>{" "}
              &{" "}
              <Link href="/privacy-policy" className="text-brand-300 hover:text-brand-200">
                Privacy Policy
              </Link>
              .
            </p>
          ) : (
            <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/45">
              <Star className="h-3.5 w-3.5 text-brand-300" />
              Premium customer access for wishlist, orders, and tailored picks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
