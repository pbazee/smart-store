export function getAuthRedirectPath(input: {
  path: string;
  userId?: string | null;
  role?: string | null;
}) {
  const { path, userId, role } = input;

  if (path.startsWith("/admin")) {
    if (!userId) {
      return `/login?redirect_url=${encodeURIComponent(path)}`;
    }

    if (role !== "admin") {
      return "/";
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

export function resolveAuthRedirectPath(
  redirectUrl?: string | string[] | null,
  fallback: string = "/account"
) {
  const candidate = Array.isArray(redirectUrl) ? redirectUrl[0] : redirectUrl;

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}
