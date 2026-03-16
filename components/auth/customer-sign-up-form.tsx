"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader } from "lucide-react";
import { signUpCustomerAction } from "@/app/auth/customer-auth";

export function CustomerSignUpForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";
  const [state, formAction, isPending] = useActionState(signUpCustomerAction, {
    error: null,
    success: false,
  });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectUrl" value={redirectUrl} />

      {state.error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            required
            disabled={isPending}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
            placeholder="John"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            required
            disabled={isPending}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
            placeholder="Doe"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          disabled={isPending}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Password
        </label>
        <input
          type="password"
          name="password"
          required
          disabled={isPending}
          minLength={8}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
          placeholder="At least 8 characters"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:shadow-lg transition-shadow disabled:opacity-75 flex items-center justify-center gap-2"
      >
        {isPending && <Loader className="h-4 w-4 animate-spin" />}
        {isPending ? "Creating account..." : "Create Account"}
      </button>

      <div className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
          className="text-orange-600 hover:text-orange-700 font-medium"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
