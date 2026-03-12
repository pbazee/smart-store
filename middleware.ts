import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAuthRedirectPath } from "@/lib/auth-routing";
import { LOCAL_AUTH_COOKIE, verifyLocalAuthToken } from "@/lib/local-auth";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { DEMO_AUTH_COOKIE, getRoleFromSessionClaims, parseDemoAuthCookie } from "@/lib/user-role";

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  if (/^\/sign-(in|up)(?:\/.*)?$/.test(path)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();
  const useMockData = shouldUseMockData();
  const demoAuth = useMockData
    ? parseDemoAuthCookie(req.cookies.get(DEMO_AUTH_COOKIE)?.value)
    : null;
  const localAuth = await verifyLocalAuthToken(req.cookies.get(LOCAL_AUTH_COOKIE)?.value);
  const effectiveUserId =
    demoAuth ? `demo-${demoAuth.role}` : localAuth?.userId ?? userId ?? null;
  const effectiveRole =
    demoAuth?.role ?? localAuth?.role ?? getRoleFromSessionClaims(sessionClaims);
  const redirectPath = getAuthRedirectPath({
    path,
    userId: effectiveUserId,
    role: effectiveRole,
  });

  if (!redirectPath) {
    return;
  }

  return NextResponse.redirect(new URL(redirectPath, req.url));
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
