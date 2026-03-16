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

const signUpSchema = z.object({
  email: z.string().trim().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().trim().min(2, "First name required"),
  lastName: z.string().trim().min(2, "Last name required"),
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
  try {
    const payload = signUpSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      redirectUrl: formData.get("redirectUrl"),
    });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (existingUser) {
      return { error: "Email already registered", success: false };
    }

    // Hash password
    const passwordHash = await hashPassword(payload.password);

    // Create user
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

    // Create authentication token
    const token = await createLocalAuthToken({
      userId: user.id,
      email: user.email ?? payload.email.toLowerCase(),
      name: user.fullName ?? `${payload.firstName} ${payload.lastName}`,
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

    // Redirect to dashboard or requested URL
    const redirectPath = payload.redirectUrl && payload.redirectUrl.startsWith("/") 
      ? payload.redirectUrl 
      : "/";
    redirect(redirectPath);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { error: firstError.message || "Validation failed", success: false };
    }

    if (error instanceof TypeError && error.message.includes("Cannot set property httpOnly")) {
      // Redirect error in server action - this is expected and means we're redirecting
      throw error;
    }

    console.error("Sign up failed:", error);
    return { error: "Sign up failed. Please try again.", success: false };
  }
}

export async function signInCustomerAction(
  _previousState: CustomerSignInActionState,
  formData: FormData
): Promise<CustomerSignInActionState> {
  try {
    const payload = signInSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      redirectUrl: formData.get("redirectUrl"),
    });

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

    // Create authentication token
    const token = await createLocalAuthToken({
      userId: user.id,
      email: user.email ?? payload.email.toLowerCase(),
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

    // Redirect
    const redirectPath = payload.redirectUrl && payload.redirectUrl.startsWith("/") 
      ? payload.redirectUrl 
      : "/";
    redirect(redirectPath);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { error: firstError.message || "Validation failed", success: false };
    }

    if (error instanceof TypeError && error.message.includes("Cannot set property httpOnly")) {
      // Redirect error in server action - expected
      throw error;
    }

    console.error("Sign in failed:", error);
    return { error: "Sign in failed. Please try again.", success: false };
  }
}
