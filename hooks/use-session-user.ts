"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import type { SessionUser } from "@/types";
import { useDemoAuthStore } from "@/lib/demo-auth";
import { getRoleFromClerkUser } from "@/lib/user-role";

export function useSessionUser() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const demoUser = useDemoAuthStore((state) => state.user);
  const demoSignOut = useDemoAuthStore((state) => state.signOut);
  const [serverUser, setServerUser] = useState<SessionUser | null>(null);
  const [hasLoadedServerSession, setHasLoadedServerSession] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/session", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { data?: SessionUser | null }
          | null;

        if (!isActive) {
          return;
        }

        setServerUser(payload?.data ?? null);
      } catch {
        if (isActive) {
          setServerUser(null);
        }
      } finally {
        if (isActive) {
          setHasLoadedServerSession(true);
        }
      }
    };

    void loadSession();

    return () => {
      isActive = false;
    };
  }, [demoUser, isLoaded, isSignedIn, user?.id]);

  const clerkSessionUser = useMemo<SessionUser | null>(() => {
    if (!isLoaded || !isSignedIn || !user) {
      return null;
    }

    const roleFromMetadata = getRoleFromClerkUser(user);
    const role =
      roleFromMetadata === "guest" ? (serverUser?.role ?? "customer") : roleFromMetadata;

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      imageUrl: user.imageUrl ?? null,
      role,
      isDemo: false,
      authProvider: "clerk",
    };
  }, [isLoaded, isSignedIn, serverUser?.role, user]);

  const sessionUser = useMemo<SessionUser | null>(() => {
    if (demoUser?.isDemo) {
      return demoUser;
    }

    if (serverUser?.authProvider === "local") {
      return serverUser;
    }

    if (clerkSessionUser) {
      return clerkSessionUser;
    }

    if (isLoaded && !isSignedIn) {
      return null;
    }

    return serverUser;
  }, [clerkSessionUser, demoUser, isLoaded, isSignedIn, serverUser]);

  return {
    isLoaded: hasLoadedServerSession && isLoaded,
    isSignedIn: !!sessionUser,
    sessionUser,
    signOut: async () => {
      if (sessionUser?.isDemo) {
        demoSignOut();
        setServerUser(null);
        return;
      }

      if (sessionUser?.authProvider === "local") {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        setServerUser(null);
        return;
      }

      setServerUser(null);
      await clerkSignOut({ redirectUrl: "/" });
    },
  };
}
