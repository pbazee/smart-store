import { redirect } from "next/navigation";
import { resolveSignedInRedirectPath } from "@/lib/auth-routing";
import { getSessionUser } from "@/lib/session-user";

function readFirst(
  value?: string | string[] | null
) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuthCompletePage({
  searchParams,
}: {
  searchParams: Promise<{
    flow?: string | string[];
    callbackUrl?: string | string[];
    redirect_url?: string | string[];
  }>;
}) {
  const sessionUser = await getSessionUser();
  const { flow, callbackUrl, redirect_url } = await searchParams;
  const flowValue = readFirst(flow);
  const redirectPath = readFirst(callbackUrl) ?? readFirst(redirect_url) ?? "/";

  if (!sessionUser) {
    redirect("/sign-in");
  }

  if (flowValue === "sign-up") {
    redirect(sessionUser.role === "admin" ? "/admin/dashboard" : "/");
  }

  redirect(resolveSignedInRedirectPath(sessionUser.role, redirectPath));
}
