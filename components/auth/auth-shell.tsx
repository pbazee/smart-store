"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LockKeyhole, Sparkles, Star } from "lucide-react";

type AuthShellProps = {
  mode: "sign-in" | "sign-up";
  children: ReactNode;
};

const authContent = {
  "sign-in": {
    title: "Continue with Google",
    subtitle: "Sign in fast, then use email below only if you prefer.",
    formEyebrow: "Google First",
  },
  "sign-up": {
    title: "Create your account",
    subtitle: "Use Google first, or continue with email underneath.",
    formEyebrow: "Google First",
  },
} as const;

export function AuthShell({ mode, children }: AuthShellProps) {
  const content = authContent[mode];
  const isSignUp = mode === "sign-up";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#05060a_0%,_#101828_50%,_#140a05_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:44px_44px] opacity-20" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute left-0 right-0 top-0 flex flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
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

        <div className="ml-auto w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-[0_24px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8">
          <div className="mb-8 rounded-[1.6rem] border border-white/10 bg-black/25 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-brand-300">
                {content.formEyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-black">{content.title}</h1>
              <p className="mt-2 text-sm leading-6 text-white/65">{content.subtitle}</p>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100">
              <LockKeyhole className="h-3.5 w-3.5" />
              Secure Clerk authentication
            </div>
          </div>

          {children}

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
              Wishlist, orders, and account state stay synced after login.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
