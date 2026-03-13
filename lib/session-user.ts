import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import type { SessionUser } from "@/types";
import { getLocalAuthSession } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import {
  DEMO_AUTH_COOKIE,
  getRoleFromClerkUser,
  getRoleFromSessionClaims,
  normalizeUserRole,
  parseDemoAuthCookie,
} from "@/lib/user-role";
import { shouldUseMockData } from "@/lib/live-data-mode";

export async function getSessionUser(): Promise<SessionUser | null> {
  const useMockData = shouldUseMockData();
  const cookieStore = await cookies();
  const demoAuth = useMockData
    ? parseDemoAuthCookie(cookieStore.get(DEMO_AUTH_COOKIE)?.value)
    : null;

  if (demoAuth) {
    return {
      id: `demo-${demoAuth.role}`,
      firstName: "Demo",
      lastName: demoAuth.role === "admin" ? "Admin" : "Customer",
      fullName: demoAuth.label,
      email:
        demoAuth.role === "admin"
          ? "admin@demo.smartest.ke"
          : "customer@demo.smartest.ke",
      role: demoAuth.role,
      isDemo: true,
      authProvider: "demo",
    };
  }

  const localAuthSession = await getLocalAuthSession();
  if (localAuthSession) {
    return {
      id: localAuthSession.userId,
      fullName: localAuthSession.name,
      email: localAuthSession.email,
      role: localAuthSession.role,
      isDemo: false,
      authProvider: "local",
    };
  }

  const authResult = await auth();
  if (!authResult.userId) {
    return null;
  }

  const user = await currentUser();
  const roleFromMetadata = getRoleFromClerkUser(user);
  let role = roleFromMetadata;

  if (role === "guest" && user?.primaryEmailAddress?.emailAddress) {
    try {
      const persistedUser = await prisma.user.findUnique({
        where: {
          email: user.primaryEmailAddress.emailAddress.toLowerCase(),
        },
        select: {
          role: true,
        },
      });

      if (persistedUser?.role) {
        role = normalizeUserRole(persistedUser.role);
      }
    } catch (error) {
      console.error("Failed to resolve persisted Clerk role:", error);
    }
  }

  if (role === "guest") {
    role = getRoleFromSessionClaims(authResult.sessionClaims);
  }

  return {
    id: authResult.userId,
    firstName: user?.firstName,
    lastName: user?.lastName,
    fullName: user?.fullName,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
    imageUrl: user?.imageUrl ?? null,
    role,
    isDemo: false,
    authProvider: "clerk",
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
