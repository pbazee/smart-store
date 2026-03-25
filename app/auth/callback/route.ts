/**
 * OAuth Callback Route
 * Handles Supabase auth redirects after Google OAuth
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { resolveAuthenticatedRole, resolveDatabaseUserRole } from "@/lib/admin-identity";
import { createSupabaseServerClient } from "@/lib/supabase-server";
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
    const normalizedEmail = supabaseUser.email?.toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.redirect(
        new URL(`/sign-in?error=missing_email&redirect_url=${encodeURIComponent(redirectUrl)}`, request.url)
      );
    }

    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Create new user from OAuth
      const displayName = supabaseUser.user_metadata?.name || normalizedEmail;
      const nameParts = displayName.split(" ");
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(" ") || "";
      const role = resolveDatabaseUserRole({ email: normalizedEmail });

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          firstName,
          lastName,
          fullName: displayName,
          role,
          // No password for OAuth users
        },
      });
    } else {
      const displayName = supabaseUser.user_metadata?.name || user.email || normalizedEmail;
      const nameParts = displayName.split(" ");
      const nextRole = resolveDatabaseUserRole({
        email: normalizedEmail,
        role: user.role,
      });

      if (!user.fullName || !user.firstName || user.role !== nextRole) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: user.firstName || nameParts[0] || "User",
            lastName: user.lastName || nameParts.slice(1).join(" ") || "",
            fullName: user.fullName || displayName,
            role: nextRole,
          },
        });
      }
    }

    const sessionRole = resolveAuthenticatedRole({
      email: user.email ?? normalizedEmail,
      role: user.role,
    });

    // Create our local auth token
    const token = await createLocalAuthToken({
      userId: user.id,
      email: user.email ?? normalizedEmail,
      name: user.fullName ?? (sessionRole === "admin" ? "Store Admin" : "Customer"),
      role: sessionRole,
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
    revalidatePath("/admin/users");

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
