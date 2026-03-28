export function getAuthRedirectPath(input: {
  pathname: string;
  redirectPath?: string;
  userId?: string | null;
  role?: string | null;
}) {
  const { pathname, redirectPath, userId, role } = input;
  const requestedPath = redirectPath ?? pathname;

  if (pathname === "/admin-login" || pathname.startsWith("/admin-login/")) {
    if (!userId) {
      return null;
    }

    return role === "admin" ? "/admin/dashboard" : "/";
  }

  if (pathname.startsWith("/admin")) {
    if (!userId) {
      return `/sign-in?redirect_url=${encodeURIComponent(requestedPath)}`;
    }

    if (role !== "admin") {
      return "/";
    }
  }

  if (
    pathname.startsWith("/orders") ||
    pathname.startsWith("/order-confirmation") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/checkout")
  ) {
    if (!userId) {
      return `/sign-in?redirect_url=${encodeURIComponent(requestedPath)}`;
    }
  }

  return null;
}

export function resolveRequestedRedirectPath(
  redirectUrl?: string | string[] | null,
  fallback: string = "/"
) {
  const candidate = Array.isArray(redirectUrl) ? redirectUrl[0] : redirectUrl;

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}

export function resolveAuthRedirectPath(
  redirectUrl?: string | string[] | null,
  fallback: string = "/"
) {
  const candidate = resolveRequestedRedirectPath(redirectUrl, fallback);

  if (candidate.startsWith("/admin")) {
    return fallback;
  }

  return candidate;
}

export function resolveAdminRedirectPath(
  redirectUrl?: string | string[] | null,
  fallback: string = "/admin/dashboard"
) {
  const candidate = Array.isArray(redirectUrl) ? redirectUrl[0] : redirectUrl;

  if (
    !candidate ||
    !candidate.startsWith("/admin") ||
    candidate.startsWith("//") ||
    candidate.startsWith("/admin-login")
  ) {
    return fallback;
  }

  return candidate;
}

export function resolveSignedInRedirectPath(
  role: string | null | undefined,
  fallback: string = "/"
) {
  if (role === "admin") {
    return "/admin/dashboard";
  }

  return fallback;
}
