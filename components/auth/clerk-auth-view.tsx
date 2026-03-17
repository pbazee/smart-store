"use client";

import Link from "next/link";
import {
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
  SignIn,
  SignUp,
} from "@clerk/nextjs";
import { AlertCircle, Loader2 } from "lucide-react";
import { clerkAuthAppearance } from "@/lib/clerk-theme";

type ClerkAuthViewProps = {
  mode: "sign-in" | "sign-up";
};

function AuthLoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-[1.6rem] border border-white/10 bg-black/20 px-6 py-12">
      <div className="flex flex-col items-center gap-4 text-center text-white/80">
        <Loader2 className="h-8 w-8 animate-spin text-orange-300" />
        <div className="space-y-1">
          <p className="text-base font-semibold text-white">Loading authentication</p>
          <p className="text-sm text-white/65">Preparing secure sign-in options.</p>
        </div>
      </div>
    </div>
  );
}

function AuthErrorState({ mode }: ClerkAuthViewProps) {
  const alternateLink =
    mode === "sign-in"
      ? { href: "/sign-up", label: "Go to sign up" }
      : { href: "/sign-in", label: "Go to sign in" };

  return (
    <div className="rounded-[1.6rem] border border-rose-400/30 bg-rose-500/10 px-6 py-8 text-center text-rose-50">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <AlertCircle className="h-8 w-8 text-rose-200" />
        <div className="space-y-2">
          <p className="text-lg font-semibold">Authentication is unavailable right now.</p>
          <p className="text-sm text-rose-100/80">
            Clerk could not finish loading. Verify your Clerk publishable key and enabled sign-in
            methods, then try again.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={alternateLink.href}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {alternateLink.label}
          </Link>
          <Link
            href="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-50"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ClerkAuthView({ mode }: ClerkAuthViewProps) {
  const sharedProps = {
    routing: "path" as const,
    oauthFlow: "redirect" as const,
    appearance: clerkAuthAppearance,
    fallback: <AuthLoadingState />,
  };

  return (
    <>
      <ClerkLoading>
        <AuthLoadingState />
      </ClerkLoading>

      <ClerkFailed>
        <AuthErrorState mode={mode} />
      </ClerkFailed>

      <ClerkLoaded>
        {mode === "sign-in" ? (
          <SignIn
            {...sharedProps}
            path="/sign-in"
            signUpUrl="/sign-up"
            forceRedirectUrl="/"
            fallbackRedirectUrl="/"
          />
        ) : (
          <SignUp
            {...sharedProps}
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl="/"
            fallbackRedirectUrl="/"
          />
        )}
      </ClerkLoaded>
    </>
  );
}
