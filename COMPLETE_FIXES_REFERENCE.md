# Complete File Changes - All 3 Production Fixes

This document shows exact BEFORE → AFTER for every file changed.

---

## File 1: NEW → `lib/supabase.ts`

**Purpose:** Setup Supabase client for OAuth with @supabase/ssr

**Status:** ✅ NEW FILE - Complete implementation

```typescript
/**
 * Supabase Client Setup for App Router
 * Uses @supabase/ssr for proper Next.js integration with cookies
 */

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️  Supabase environment variables not configured. OAuth will not work.");
}

/**
 * Server-side Supabase client
 * Use this in Server Components and Server Actions
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // If the callback throws an error, it's probably because we're
          // in a Server Component or a Route Handler. In that case, we would
          // need to use the `UnsafeLocalStorage` adapter instead.
        }
      },
    },
  });
}

/**
 * Client-side Supabase client
 * Use this in Client Components with "use client"
 */
export function createSupabaseClientClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
```

---

## File 2: NEW → `app/auth/callback/route.ts`

**Purpose:** Handle OAuth redirects from Supabase after Google sign-in

**Status:** ✅ NEW FILE - Complete OAuth callback handler

```typescript
/**
 * OAuth Callback Route
 * Handles Supabase auth redirects after Google OAuth
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { createLocalAuthToken, getLocalAuthCookieMaxAge, LOCAL_AUTH_COOKIE } from "@/lib/local-auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectUrl = searchParams.get("redirect_url") || "/";

  try {
    if (!code) {
      return NextResponse.redirect(
        new URL(`/sign-in?error=no_auth_code&redirect_url=${encodeURIComponent(redirectUrl)}`, request.url)
      );
    }

    const supabase = await createSupabaseServerClient();

    // Exchange code for session with Supabase
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !sessionData?.user) {
      console.error("Auth callback exchange error:", sessionError);
      return NextResponse.redirect(
        new URL(`/sign-in?error=auth_failed&redirect_url=${encodeURIComponent(redirectUrl)}`, request.url)
      );
    }

    const supabaseUser = sessionData.user;

    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    });

    if (!user) {
      // Create new user from OAuth
      const nameParts = (supabaseUser.user_metadata?.name || supabaseUser.email).split(" ");
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(" ") || "";

      user = await prisma.user.create({
        data: {
          email: supabaseUser.email!,
          firstName,
          lastName,
          fullName: supabaseUser.user_metadata?.name || supabaseUser.email,
          role: "CUSTOMER",
          // No password for OAuth users
        },
      });
    }

    // Create our local auth token
    const token = await createLocalAuthToken({
      userId: user.id,
      email: user.email ?? supabaseUser.email!,
      name: user.fullName ?? "Customer",
      role: "customer",
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(LOCAL_AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getLocalAuthCookieMaxAge(),
    });

    // Redirect to requested URL
    return NextResponse.redirect(
      new URL(redirectUrl.startsWith("/") ? redirectUrl : "/", request.url)
    );
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(
      new URL(`/sign-in?error=callback_failed&redirect_url=${encodeURIComponent(redirectUrl)}`, request.url)
    );
  }
}
```

---

## File 3: UPDATED → `app/auth/customer-auth.ts`

**Changes:**
1. ✅ Added Supabase imports
2. ✅ Added `signInWithGoogleAction()` function
3. ✅ Added `signUpWithGoogleAction()` function
4. ✅ Improved error logging in signUp/signIn

### BEFORE (top):
```typescript
/**
 * Customer Sign-In and Sign-Up Server Actions
 * Handles email/password authentication for customers
 */

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createLocalAuthToken, getLocalAuthCookieMaxAge, LOCAL_AUTH_COOKIE } from "@/lib/local-auth";
```

### AFTER (top):
```typescript
/**
 * Customer Sign-In and Sign-Up Server Actions
 * Handles email/password and OAuth authentication for customers
 */

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createLocalAuthToken, getLocalAuthCookieMaxAge, LOCAL_AUTH_COOKIE } from "@/lib/local-auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getAppUrl } from "@/lib/app-url";
```

### BEFORE (signUp error):
```typescript
    console.error("Sign up failed:", error);
    return { error: "Sign up failed. Please try again.", success: false };
```

### AFTER (signUp error - improved):
```typescript
    // Log detailed error for debugging
    console.error("Sign up failed:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      code: error instanceof Error && "code" in error ? (error as any).code : undefined,
    });

    // Return user-friendly error message
    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL") || error.message.includes("connection")) {
        return { error: "Service temporarily unavailable. Please try again in a moment.", success: false };
      }
      if (error.message.includes("duplicate key")) {
        return { error: "Email already registered", success: false };
      }
    }

    return { error: "Failed to create account. Please try again.", success: false };
```

### NEW - Added at end:
```typescript
export async function signInWithGoogleAction(redirectUrl?: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const appUrl = getAppUrl();
    const callbackUrl = `${appUrl}/auth/callback?redirect_url=${encodeURIComponent(redirectUrl || "/")}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      console.error("OAuth sign in error:", error);
      return { error: "Failed to sign in with Google", success: false };
    }

    if (data?.url) {
      redirect(data.url);
    }

    return { error: "No redirect URL from OAuth provider", success: false };
  } catch (error) {
    console.error("Google sign in failed:", error);
    const message = error instanceof Error ? error.message : "Google sign in failed";
    return { error: message, success: false };
  }
}

export async function signUpWithGoogleAction(redirectUrl?: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const appUrl = getAppUrl();
    const callbackUrl = `${appUrl}/auth/callback?redirect_url=${encodeURIComponent(redirectUrl || "/")}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          prompt: "consent", // Force account selection on Google
        },
      },
    });

    if (error) {
      console.error("OAuth sign up error:", error);
      return { error: "Failed to sign up with Google", success: false };
    }

    if (data?.url) {
      redirect(data.url);
    }

    return { error: "No redirect URL from OAuth provider", success: false };
  } catch (error) {
    console.error("Google sign up failed:", error);
    const message = error instanceof Error ? error.message : "Google sign up failed";
    return { error: message, success: false };
  }
}
```

---

## File 4: UPDATED → `components/auth/customer-sign-in-form.tsx`

**Changes:**
- ✅ Added Google OAuth button with onClick handler
- ✅ Added query param error handling
- ✅ Added divider between OAuth and email form
- ✅ Improved form layout and styling

### BEFORE:
```tsx
"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader } from "lucide-react";
import { signInCustomerAction } from "@/app/auth/customer-auth";

export function CustomerSignInForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";
  const [state, formAction, isPending] = useActionState(signInCustomerAction, {
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

      {/* ... email/password form ... */}
    </form>
  );
}
```

### AFTER:
```tsx
"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader } from "lucide-react";
import { signInCustomerAction, signInWithGoogleAction } from "@/app/auth/customer-auth";

export function CustomerSignInForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";
  const error = searchParams.get("error");
  const [state, formAction, isPending] = useActionState(signInCustomerAction, {
    error: null,
    success: false,
  });

  const handleGoogleSignIn = async () => {
    await signInWithGoogleAction(redirectUrl);
  };

  const errorMessage = error ? getErrorMessage(error) : state.error;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectUrl" value={redirectUrl} />

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Google Sign-In Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isPending}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-75 flex items-center justify-center gap-3 font-medium text-gray-700"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          {/* Google SVG icon */}
        </svg>
        {isPending ? "Signing in..." : "Continue with Google"}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      {/* Email & Password Form - Same as before */}
      {/* ... */}
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
```

---

## File 5: UPDATED → `components/auth/customer-sign-up-form.tsx`

**Changes:**
- ✅ Added Google OAuth button with onClick handler  
- ✅ Added query param error handling
- ✅ Added divider between OAuth and email form
- ✅ Same structure as sign-in form for consistency

**Pattern:** Same as sign-in-form.tsx above (Added Google button, divider, error handling)

---

## File 6: UPDATED → `app/api/checkout/initialize-payment/route.ts`

**Changes:**
- ✅ Improved Prisma error handling
- ✅ Different message for dev vs production
- ✅ Detailed logging in production (not shown to user)

### BEFORE (error handling):
```typescript
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          error:
            "Database connection failed. Verify Supabase pooled DATABASE_URL and DIRECT_URL configuration.",
        },
        { status: 503 }
      );
    }
```

### AFTER (error handling):
```typescript
    // Log the actual error for debugging
    console.error("Payment initialization error:", error);

    // Handle Prisma connection errors gracefully
    if (error instanceof Prisma.PrismaClientInitializationError) {
      // In development, provide detailed error message
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json(
          {
            error: "Database connection failed",
            details: "Check your DATABASE_URL and DIRECT_URL environment variables in .env.local",
            debug: error.message,
          },
          { status: 503 }
        );
      }

      // In production, log but show generic message
      console.error("[CRITICAL] Database initialization failed:", {
        timestamp: new Date().toISOString(),
        error: error.message,
      });

      return NextResponse.json(
        {
          error: "Temporary service unavailable. Please refresh and try again.",
        },
        { status: 503 }
      );
    }
```

---

## File 7: UPDATED → `app/api/checkout/confirm/route.ts`

**Changes:** Same pattern as initialize-payment route above

---

## Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| `lib/supabase.ts` | NEW | Enables OAuth with Supabase |
| `app/auth/callback/route.ts` | NEW | Handles OAuth redirects |
| `app/auth/customer-auth.ts` | UPDATED | Added Google actions + better errors |
| `components/auth/customer-sign-in-form.tsx` | UPDATED | Added Google button |
| `components/auth/customer-sign-up-form.tsx` | UPDATED | Added Google button |
| `app/api/checkout/initialize-payment/route.ts` | UPDATED | Better error handling |
| `app/api/checkout/confirm/route.ts` | UPDATED | Better error handling |

**Total Lines Changed:** ~400 lines of new/updated code
**Breaking Changes:** None - fully backward compatible

