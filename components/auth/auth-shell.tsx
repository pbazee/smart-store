"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  mode: "sign-in" | "sign-up";
  children: ReactNode;
};

const authContent = {
  "sign-in": {
    title: "Sign in with Google first",
    subtitle: "Use Google for the fastest checkout, or continue with email below.",
    formEyebrow: "Sign In",
  },
  "sign-up": {
    title: "Create your account",
    subtitle: "Start with Google, or continue with email and password below.",
    formEyebrow: "Sign Up",
  },
} as const;

export function AuthShell({ mode, children }: AuthShellProps) {
  const content = authContent[mode];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#05060a_0%,_#101828_50%,_#140a05_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:44px_44px] opacity-20" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:justify-end lg:px-8">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-[0_24px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-sm font-black text-white shadow-[0_0_30px_rgba(249,115,22,0.4)]">
              SK
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                Smartest Store KE
              </p>
              <p className="text-sm font-semibold text-white">Clean checkout starts here.</p>
            </div>
          </Link>

          <div className="mt-8 rounded-[1.6rem] border border-white/10 bg-black/25 p-6">
            <p className="text-xs uppercase tracking-[0.26em] text-white/70">
              {content.formEyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-[2.2rem]">
              {content.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/75">{content.subtitle}</p>
          </div>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
