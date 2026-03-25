/**
 * Customer Sign-In and Sign-Up Server Actions
 * Handles email/password and OAuth authentication for customers
 */

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { resolveAuthenticatedRole } from "@/lib/admin-identity";
import { subscribeToNewsletter } from "@/lib/newsletter-service";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createLocalAuthToken, getLocalAuthCookieMaxAge, LOCAL_AUTH_COOKIE } from "@/lib/local-auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAppUrl } from "@/lib/app-url";

const signUpSchema = z.object({
  email: z.string().trim().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().trim().min(1, "First name required"),
  lastName: z.string().trim().min(1, "Last name required"),
  subscribeNewsletter: z.string().optional(),
  redirectUrl: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().trim().email("Valid email required"),
  password: z.string().min(6, "Password required"),
  redirectUrl: z.string().optional(),
});

export type CustomerSignUpActionState = {
  error: string | null;
  success: boolean;
};

export type CustomerSignInActionState = {
  error: string | null;
  success: boolean;
};

export async function signUpCustomerAction(
  _previousState: CustomerSignUpActionState,
  formData: FormData
): Promise<CustomerSignUpActionState> {
  // Keep redirect path outside try-catch — redirect() must not be caught
  let redirectPath = "/";

  try {
    const payload = signUpSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      subscribeNewsletter: formData.get("subscribeNewsletter"),
      redirectUrl: formData.get("redirectUrl"),
    });

    redirectPath =
      payload.redirectUrl && payload.redirectUrl.startsWith("/")
        ? payload.redirectUrl
        : "/";

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (existingUser) {
      return { error: "Email already registered. Please sign in instead.", success: false };
    }

    // Hash password
    const passwordHash = await hashPassword(payload.password);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: payload.email.toLowerCase(),
        firstName: payload.firstName,
        lastName: payload.lastName,
        fullName: `${payload.firstName} ${payload.lastName}`.trim(),
        passwordHash,
        role: "CUSTOMER",
      },
    });

    if (payload.subscribeNewsletter) {
      try {
        await subscribeToNewsletter(payload.email);
      } catch (newsletterError) {
        console.error("Newsletter subscription failed during signup:", newsletterError);
      }
    }

    // Create authentication token
    const token = await createLocalAuthToken({
      userId: user.id,
      email: user.email ?? payload.email.toLowerCase(),
      name: user.fullName ?? `${payload.firstName} ${payload.lastName}`,
      role: "customer",
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(LOCAL_AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getLocalAuthCookieMaxAge(),
    });

    // Revalidate layout and admin users list
    revalidatePath("/", "layout");
    revalidatePath("/admin/users");
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { error: firstError.message || "Validation failed", success: false };
    }

    console.error("Sign up failed:", error instanceof Error ? error.message : error);

    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL") || error.message.includes("connection")) {
        return { error: "Service temporarily unavailable. Please try again in a moment.", success: false };
      }
      if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
        return { error: "Email already registered. Please sign in instead.", success: false };
      }
      return { error: error.message || "Failed to create account. Please try again.", success: false };
    }

    return { error: "Failed to create account. Please try again.", success: false };
  }

  // redirect() must be called OUTSIDE try-catch per Next.js docs
  redirect(redirectPath);
}

export async function signInCustomerAction(
  _previousState: CustomerSignInActionState,
  formData: FormData
): Promise<CustomerSignInActionState> {
  let redirectPath = "/";

  try {
    const payload = signInSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      redirectUrl: formData.get("redirectUrl"),
    });

    redirectPath =
      payload.redirectUrl && payload.redirectUrl.startsWith("/")
        ? payload.redirectUrl
        : "/";

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return { error: "Invalid email or password", success: false };
    }

    // Verify password
    const passwordMatches = await verifyPassword(payload.password, user.passwordHash);
    if (!passwordMatches) {
      return { error: "Invalid email or password", success: false };
    }
    const sessionRole = resolveAuthenticatedRole({
      email: user.email ?? payload.email.toLowerCase(),
      role: user.role,
    });

    // Create authentication token
    const token = await createLocalAuthToken({
      userId: user.id,
      email: user.email ?? payload.email.toLowerCase(),
      name: user.fullName ?? (sessionRole === "admin" ? "Store Admin" : "Customer"),
      role: sessionRole,
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(LOCAL_AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getLocalAuthCookieMaxAge(),
    });

    // Revalidate layout
    revalidatePath("/", "layout");
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { error: firstError.message || "Validation failed", success: false };
    }

    console.error("Sign in failed:", error instanceof Error ? error.message : error);

    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL") || error.message.includes("connection")) {
        return { error: "Service temporarily unavailable. Please try again in a moment.", success: false };
      }
      return { error: error.message || "Failed to sign in. Please try again.", success: false };
    }

    return { error: "Failed to sign in. Please try again.", success: false };
  }

  // redirect() must be called OUTSIDE try-catch per Next.js docs
  redirect(redirectPath);
}

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
    // Re-throw Next.js redirect (redirect() is called above, outside try-catch for sign-in/up)
    if ((error as any)?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

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
          prompt: "consent",
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
    if ((error as any)?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Google sign up failed:", error);
    const message = error instanceof Error ? error.message : "Google sign up failed";
    return { error: message, success: false };
  }
}
