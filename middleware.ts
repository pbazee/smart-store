import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareSupabaseClient } from "@/lib/supabase";
import { getAuthRedirectPath } from "@/lib/auth-routing";
import { LOCAL_AUTH_COOKIE, verifyLocalAuthToken } from "@/lib/local-auth";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { DEMO_AUTH_COOKIE, normalizeUserRole, parseDemoAuthCookie } from "@/lib/user-role";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow sign-in/sign-up pages
  if (/^\/(sign-in|sign-up)(?:\/.*)?$/.test(path)) {
    return NextResponse.next();
  }

  // Check for demo auth
  const useMockData = shouldUseMockData();
  const demoAuth = useMockData
    ? parseDemoAuthCookie(request.cookies.get(DEMO_AUTH_COOKIE)?.value)
    : null;

  // Check for local auth
  const localAuth = await verifyLocalAuthToken(request.cookies.get(LOCAL_AUTH_COOKIE)?.value);

  // Check Supabase session
  const supabase = createMiddlewareSupabaseClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Determine effective user ID and role
  const effectiveUserId = demoAuth
    ? `demo-${demoAuth.role}`
    : localAuth?.userId ?? user?.id ?? null;

  let effectiveRole: "admin" | "customer" | "guest" = "guest";
  if (demoAuth) {
    effectiveRole = demoAuth.role;
  } else if (localAuth) {
    effectiveRole = localAuth.role;
  } else if (user) {
    // Check user metadata for role
    const metadataRole = user.user_metadata?.role;
    if (metadataRole === "admin" || metadataRole === "customer") {
      effectiveRole = metadataRole;
    } else {
      effectiveRole = "customer";
    }

    // Check for hardcoded admin email
    if (effectiveRole !== "admin" && user.email === "peterkinuthia726@gmail.com") {
      effectiveRole = "admin";
    }
  }

  // Check auth redirect path
  const redirectPath = getAuthRedirectPath({
    path,
    userId: effectiveUserId,
    role: effectiveRole,
  });

  if (!redirectPath) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(redirectPath, request.url));
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
