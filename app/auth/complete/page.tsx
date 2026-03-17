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
    redirect_url?: string | string[];
  }>;
}) {
  const sessionUser = await getSessionUser();
  const { flow } = await searchParams;
  const flowValue = readFirst(flow);

  if (!sessionUser) {
    redirect("/sign-in");
  }

  if (flowValue === "sign-up") {
    redirect(sessionUser.role === "admin" ? "/admin/dashboard" : "/");
  }

  redirect(resolveSignedInRedirectPath(sessionUser.role, "/"));
}
