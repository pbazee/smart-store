/**
 * OAuth Callback Route
 * Handles Supabase auth redirects after Google OAuth
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

    // Revalidate cache to ensure session is fresh
    revalidatePath("/", "layout");

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
