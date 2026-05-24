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
    title: "Sign in with Google first",
    subtitle: "Use Google for the fastest checkout, or continue with email below.",
    formEyebrow: "Sign In",
  },
  "sign-up": {
    title: "Create your account",
    subtitle: "Start with Google, or continue with email and password below.",
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
    <div className="min-h-screen bg-[#fff8f1] text-zinc-950">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[minmax(320px,40%)_minmax(0,60%)]">
        <aside className="relative overflow-hidden bg-[linear-gradient(160deg,#f97316_0%,#fb923c_34%,#7c2d12_100%)] px-6 py-10 text-white sm:px-10 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,237,213,0.18),transparent_35%)]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-4">
                {branding.logoDarkUrl || branding.logoUrl ? (
                  <div className="relative h-14 w-36 overflow-hidden rounded-2xl bg-white/10 p-2 backdrop-blur">
                    <Image
                      src={branding.logoDarkUrl || branding.logoUrl || ""}
                      alt={branding.storeName}
                      fill
                      sizes="144px"
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-white text-lg font-black text-orange-500 shadow-[0_18px_44px_rgba(124,45,18,0.24)]">
                    SK
                  </div>
                )}
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">
                    {branding.storeName}
                  </p>
                  <p className="text-sm font-semibold text-white/90">
                    Kenya&apos;s smartest fashion destination
                  </p>
                </div>
              </Link>

              <div className="mt-12 max-w-md">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-100/80">
                  {content.formEyebrow}
                </p>
                <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                  {content.title}
                </h1>
                <p className="mt-4 max-w-sm text-sm leading-7 text-orange-50/88">
                  {content.subtitle}
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-[2rem] border border-white/20 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-semibold text-white">Fast checkout. Secure payments.</p>
              <p className="mt-2 text-sm leading-6 text-orange-50/82">
                Sign in once and we&apos;ll keep your cart, delivery flow, and order history ready
                across devices.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-2xl rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_30px_80px_rgba(249,115,22,0.12)] sm:p-8">
            {shouldShowCheckoutBanner ? (
              <div className="mb-6 rounded-[1.5rem] border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
                Sign in to complete your purchase 🛍️
              </div>
            ) : null}

            <div className="rounded-[1.6rem] border border-orange-100 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_55%,#fff1e6_100%)] p-6">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-orange-500">
                {content.formEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-black text-zinc-950 sm:text-[2.2rem]">
                {content.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{content.subtitle}</p>
            </div>

            <div className="mt-8">{children}</div>

            <div className="mt-8 border-t border-orange-100 pt-5 text-center text-sm text-zinc-600">
              {alternateAction.prompt}{" "}
              <Link
                href={buildAuthHref(alternateAction.href, redirectPath)}
                className="font-semibold text-orange-500 transition-colors hover:text-orange-600"
              >
                {alternateAction.label}
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
