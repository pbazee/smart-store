"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import type { SessionUser } from "@/types";
import { useDemoAuthStore } from "@/lib/demo-auth";

export function useSessionUser() {
  const { isLoaded } = useUser();
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
  }, [demoUser]);

  const sessionUser = useMemo<SessionUser | null>(() => {
    if (demoUser?.isDemo) {
      return demoUser;
    }

    return serverUser;
  }, [demoUser, serverUser]);

  return {
    isLoaded: hasLoadedServerSession && isLoaded,
    isSignedIn: !!sessionUser,
    sessionUser,
    signOut: async () => {
      if (sessionUser?.isDemo) {
        demoSignOut();
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

      await clerkSignOut({ redirectUrl: "/" });
    },
  };
}
