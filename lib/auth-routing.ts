export function getAuthRedirectPath(input: {
  path: string;
  userId?: string | null;
  role?: string | null;
}) {
  const { path, userId, role } = input;

  if (path === "/admin-login" || path.startsWith("/admin-login/")) {
    if (!userId) {
      return null;
    }

    return role === "admin" ? "/admin/dashboard" : "/";
  }

  if (path.startsWith("/admin")) {
    if (!userId) {
      return `/sign-in?redirect_url=${encodeURIComponent(path)}`;
    }
  }

  if (
    path.startsWith("/orders") ||
    path.startsWith("/order-confirmation") ||
    path.startsWith("/account") ||
    path.startsWith("/wishlist")
  ) {
    if (!userId) {
      return `/sign-in?redirect_url=${encodeURIComponent(path)}`;
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
  redirectUrl?: string | string[] | null,
  fallback: string = "/"
) {
  if (role === "admin") {
    return "/admin/dashboard";
  }

  return resolveAuthRedirectPath(redirectUrl, fallback);
}
