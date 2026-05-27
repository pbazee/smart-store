"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import { signInCustomerAction, signInWithGoogleAction } from "@/app/auth/customer-auth";

export function SupabaseSignIn({ redirectUrl }: { redirectUrl?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [googlePending, startGoogleTransition] = useTransition();
  const [state, formAction, isPending] = useActionState(signInCustomerAction, {
    error: null,
    success: false,
  });

  const handleGoogleSignIn = () => {
    setOauthError(null);

    startGoogleTransition(() => {
      void (async () => {
        const result = await signInWithGoogleAction(redirectUrl);
        if (result?.error) {
          setOauthError(result.error);
        }
      })();
    });
  };

  const isLoading = isPending || googlePending;
  const errorMessage = oauthError || state.error;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="flex min-h-[58px] w-full items-center justify-center rounded-2xl border border-white/10 bg-white px-5 text-base font-bold text-zinc-950 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {googlePending ? "Connecting..." : "Continue with Google"}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-[#111114] px-4 text-zinc-500">or continue with email</span>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-rose-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-200" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        </div>
      )}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirectUrl" value={redirectUrl || "/"} />
        <input type="hidden" name="rememberMe" value={rememberMe ? "true" : "false"} />

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-zinc-300">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              className="h-14 w-full rounded-2xl border border-white/10 bg-black/35 pl-11 pr-4 text-white placeholder:text-zinc-500 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/30 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className="text-sm font-medium text-zinc-300">
              Password
            </label>
            <Link
              href={
                redirectUrl
                  ? `/forgot-password?redirect_url=${encodeURIComponent(redirectUrl)}`
                  : "/forgot-password"
              }
              className="text-sm font-semibold text-orange-400 transition hover:text-orange-300"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              className="h-14 w-full rounded-2xl border border-white/10 bg-black/35 pl-11 pr-4 text-white placeholder:text-zinc-500 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/30 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-white/15 bg-black/40 accent-orange-500"
          />
          Remember me
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-orange-500 text-base font-bold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link
          href={redirectUrl ? `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}` : "/sign-up"}
          className="font-semibold text-orange-400 transition hover:text-orange-300"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
