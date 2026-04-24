import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEMO_AUTH_COOKIE = "ske_demo_auth";
const LOCAL_AUTH_COOKIE = "ske_local_auth";

type SessionRole = "admin" | "customer" | "guest";

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}

function parseDemoRole(value?: string) {
  const role = value?.split(":")[0]?.trim().toLowerCase();
  return role === "admin" || role === "customer" ? role : "guest";
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(`${normalized}${padding}`);
}

function parseLocalAuthRole(value?: string): SessionRole {
  if (!value) {
    return "guest";
  }

  const [payload] = value.split(".");
  if (!payload) {
    return "guest";
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as { role?: string; exp?: number };
    if (parsed.exp && parsed.exp <= Math.floor(Date.now() / 1000)) {
      return "guest";
    }

    return parsed.role === "admin" || parsed.role === "customer" ? parsed.role : "guest";
  } catch {
    return "guest";
  }
}

function isSignedIn(request: NextRequest) {
  return (
    parseDemoRole(request.cookies.get(DEMO_AUTH_COOKIE)?.value) !== "guest" ||
    parseLocalAuthRole(request.cookies.get(LOCAL_AUTH_COOKIE)?.value) !== "guest" ||
    hasSupabaseSessionCookie(request)
  );
}

function getKnownRole(request: NextRequest): SessionRole {
  const demoRole = parseDemoRole(request.cookies.get(DEMO_AUTH_COOKIE)?.value);
  if (demoRole !== "guest") {
    return demoRole;
  }

  const localRole = parseLocalAuthRole(request.cookies.get(LOCAL_AUTH_COOKIE)?.value);
  if (localRole !== "guest") {
    return localRole;
  }

  return "guest";
}

function buildSignInRedirect(request: NextRequest) {
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return new URL(`/sign-in?redirect_url=${encodeURIComponent(requestedPath)}`, request.url);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const signedIn = isSignedIn(request);
  const knownRole = getKnownRole(request);

  if (pathname === "/admin-login" || pathname.startsWith("/admin-login/")) {
    if (!signedIn) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(knownRole === "admin" ? "/admin/dashboard" : "/", request.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!signedIn) {
      return NextResponse.redirect(buildSignInRedirect(request));
    }

    if (knownRole !== "guest" && knownRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (
    pathname.startsWith("/orders") ||
    pathname.startsWith("/order-confirmation") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/checkout")
  ) {
    if (!signedIn) {
      return NextResponse.redirect(buildSignInRedirect(request));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|public/).*)'],
};
