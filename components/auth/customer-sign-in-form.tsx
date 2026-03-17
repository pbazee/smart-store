"use client";

import { useActionState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader } from "lucide-react";
import { signInCustomerAction, signInWithGoogleAction } from "@/app/auth/customer-auth";

export function CustomerSignInForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";
  const error = searchParams.get("error");
  const [googlePending, startGoogleTransition] = useTransition();
  const [state, formAction, isPending] = useActionState(signInCustomerAction, {
    error: null,
    success: false,
  });

  const handleGoogleSignIn = () => {
    startGoogleTransition(async () => {
      await signInWithGoogleAction(redirectUrl);
    });
  };

  const errorMessage = error ? getErrorMessage(error) : state.error;
  const isLoading = isPending || googlePending;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectUrl" value={redirectUrl} />

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Google Sign-In Button - Large & Prominent */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/60 mb-3">Google First</p>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full px-4 py-4 border-2 border-white/30 rounded-xl hover:bg-white/5 transition-all disabled:opacity-75 flex items-center justify-center gap-3 font-bold text-white text-lg bg-white/[0.08] backdrop-blur-sm hover:border-white/50"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24">
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
          {googlePending ? "Signing in..." : "Continue with Google"}
        </button>
        <p className="text-xs text-emerald-200/70 mt-2 text-center">Secure login powered by Google</p>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/12" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#05060a] text-white/45">Or continue with email</span>
        </div>
      </div>

      {/* Email & Password Form */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          disabled={isLoading}
          className="w-full px-3.5 py-2.5 border border-white/12 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-black/20 bg-black/35 text-white placeholder:text-white/35"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Password
        </label>
        <input
          type="password"
          name="password"
          required
          disabled={isLoading}
          className="w-full px-3.5 py-2.5 border border-white/12 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-black/20 bg-black/35 text-white placeholder:text-white/35"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-75 flex items-center justify-center gap-2"
      >
        {isPending && <Loader className="h-4 w-4 animate-spin" />}
        {isPending ? "Signing in..." : "Sign In"}
      </button>

      <div className="text-center text-sm text-white/60">
        Don't have an account?{" "}
        <Link
          href={`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}
          className="text-orange-400 hover:text-orange-300 font-medium"
        >
          Create one
        </Link>
      </div>
    </form>
  );
}

function getErrorMessage(code: string): string {
  const errors: Record<string, string> = {
    no_auth_code: "Authentication failed: No authorization code received",
    auth_failed: "Authentication failed: Could not complete Google sign-in",
    callback_failed: "Authentication failed: Error processing sign-in",
  };
  return errors[code] || "Authentication failed. Please try again.";
}
