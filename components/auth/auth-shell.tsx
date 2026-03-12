"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { DemoAuthPanel } from "@/components/auth/demo-auth-panel";

type AuthShellProps = {
  mode: "sign-in" | "sign-up";
  children: ReactNode;
};

export const clerkAppearance = {
  elements: {
    rootBox: "w-full",
    card: "border border-white/10 bg-transparent shadow-none",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "border border-white/12 bg-white/6 text-white hover:bg-white/10",
    formButtonPrimary:
      "bg-brand-500 text-white hover:bg-brand-600 shadow-[0_0_35px_rgba(249,115,22,0.35)]",
    formFieldInput:
      "border border-white/12 bg-black/35 text-white placeholder:text-white/35 focus:border-brand-400",
    formFieldLabel: "text-white/80",
    footerActionLink: "text-brand-300 hover:text-brand-200",
    dividerLine: "bg-white/12",
    dividerText: "text-white/45",
    formFieldSuccessText: "text-emerald-300",
    identityPreviewText: "text-white/70",
    formResendCodeLink: "text-brand-300 hover:text-brand-200",
  },
} as const;

export function AuthShell({ mode, children }: AuthShellProps) {
  const showDemoPanel = shouldUseMockData();
  const isSignIn = mode === "sign-in";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#05060a_0%,_#101828_50%,_#140a05_100%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1.1fr,0.9fr] lg:px-8">
        <div className="flex flex-col justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-sm font-black text-white shadow-[0_0_30px_rgba(249,115,22,0.4)]">
                SK
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-white/50">Smartest Store KE</p>
                <p className="text-base font-semibold text-white">Nairobi streetwear, upgraded.</p>
              </div>
            </Link>

            <div className="mt-16 max-w-xl">
              <p className="text-sm uppercase tracking-[0.28em] text-brand-300">
                East African Commerce, 2026 Edition
              </p>
              <h1 className="mt-4 text-5xl font-black leading-[0.95] sm:text-6xl">
                {isSignIn ? "Come back to the drop." : "Create your fashion passport."}
              </h1>
              <p className="mt-5 text-lg text-white/70">
                Sign in to track orders, save your wishlist, and move from inspiration to checkout
                without losing your place.
              </p>
            </div>
          </div>

          {showDemoPanel && <DemoAuthPanel />}
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/6 p-4 shadow-[0_20px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6">
            <div className="mb-6 rounded-[1.6rem] border border-white/10 bg-black/20 p-6">
              <p className="text-xs uppercase tracking-[0.26em] text-white/40">
                {isSignIn ? "Member Access" : "New Account"}
              </p>
              <h2 className="mt-3 text-3xl font-black">
                {isSignIn ? "Sign in to continue" : "Join Smartest Store KE"}
              </h2>
              <p className="mt-2 text-sm text-white/65">
                {isSignIn
                  ? "Your wishlist, orders, and personalized recommendations are waiting."
                  : "Customer role is the default. Admin access stays controlled from Clerk public metadata."}
              </p>
              <p className="mt-3 text-xs text-white/45">
                Store operators should use <Link href="/login" className="text-brand-300 hover:text-brand-200">/login</Link>.
              </p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
