import type { SessionUser } from "@/types";
import { resolveAuthenticatedRole } from "@/lib/admin-identity";
import { getLocalAuthSession } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeUserRole } from "@/lib/user-role";

export async function getSessionUser(): Promise<SessionUser | null> {
  const localAuthSession = await getLocalAuthSession();
  if (localAuthSession) {
    return {
      id: localAuthSession.userId,
      fullName: localAuthSession.name,
      email: localAuthSession.email,
      role: resolveAuthenticatedRole({
        email: localAuthSession.email,
        role: localAuthSession.role,
      }),
      isDemo: false,
      authProvider: "local",
    };
  }

  // Check Supabase session
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const userEmail = user.email?.toLowerCase() ?? null;
  let role: "admin" | "customer" | "guest" = "customer";

  // Check user metadata for role
  const metadataRole = user.user_metadata?.role;
  if (metadataRole === "admin" || metadataRole === "customer") {
    role = metadataRole;
  }

  // Check database for role if not admin
  if (role !== "admin" && userEmail) {
    try {
      const persistedUser = await prisma.user.findUnique({
        where: {
          email: userEmail,
        },
        select: {
          role: true,
        },
      });

      if (persistedUser?.role) {
        role = normalizeUserRole(persistedUser.role);
      }
    } catch (error) {
      console.error("Failed to resolve persisted Supabase role:", error);
    }
  }

  role = resolveAuthenticatedRole({
    email: userEmail,
    role,
  });

  return {
    id: user.id,
    firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(" ")[0],
    lastName: user.user_metadata?.last_name,
    fullName: user.user_metadata?.full_name,
    email: user.email ?? null,
    imageUrl: user.user_metadata?.avatar_url ?? null,
    role,
    isDemo: false,
    authProvider: "supabase",
  };
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireAdminSession() {
  const user = await getSessionUser();
  return !!user && user.role === "admin";
}
