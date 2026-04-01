import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveAuthenticatedRole } from "@/lib/admin-identity";
import { createMiddlewareSupabaseClient } from "@/lib/supabase-server";
import { getAuthRedirectPath } from "@/lib/auth-routing";
import { LOCAL_AUTH_COOKIE, verifyLocalAuthToken } from "@/lib/local-auth";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { DEMO_AUTH_COOKIE, parseDemoAuthCookie } from "@/lib/user-role";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestedPath = `${pathname}${request.nextUrl.search}`;

  // Allow public auth pages
  if (/^\/(sign-in|sign-up|forgot-password|reset-password)(?:\/.*)?$/.test(pathname)) {
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
    effectiveRole = resolveAuthenticatedRole({
      email: localAuth.email,
      role: localAuth.role,
    });
  } else if (user) {
    effectiveRole = resolveAuthenticatedRole({
      email: user.email,
      role: user.user_metadata?.role,
    });
  }

  // Check auth redirect path
  const redirectPath = getAuthRedirectPath({
    pathname,
    redirectPath: requestedPath,
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
