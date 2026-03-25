"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseClientClient } from "@/lib/supabase-client";
import type { SessionUser } from "@/types";
import type { User } from "@supabase/supabase-js";

function getRoleFromSupabaseUser(user: User): "admin" | "customer" | "guest" {
  const userEmail = user.email?.toLowerCase();
  if (userEmail === "peterkinuthia726@gmail.com") {
    return "admin";
  }

  const role = user.user_metadata?.role;
  if (role === "admin" || role === "customer") {
    return role;
  }
  return "customer";
}

export function useSessionUser() {
  const [supabase] = useState(() => createSupabaseClientClient());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverUser, setServerUser] = useState<SessionUser | null>(null);
  const [hasLoadedServerSession, setHasLoadedServerSession] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

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
  }, [user?.id]);

  const supabaseSessionUser = useMemo<SessionUser | null>(() => {
    if (!user) {
      return null;
    }

    const role = getRoleFromSupabaseUser(user);

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
  }, [user]);

  const sessionUser = useMemo<SessionUser | null>(() => {
    if (serverUser?.authProvider === "local") {
      return serverUser;
    }

    if (supabaseSessionUser) {
      return supabaseSessionUser;
    }

    if (!isLoading && !user) {
      return null;
    }

    return serverUser;
  }, [supabaseSessionUser, isLoading, user, serverUser]);

  return {
    isLoaded: hasLoadedServerSession && !isLoading,
    isLoading,
    hasLoadedServerSession,
    isSignedIn: !!sessionUser,
    sessionUser,
    signOut: async () => {
      if (sessionUser?.authProvider === "local") {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        setServerUser(null);
        return;
      }

      await supabase.auth.signOut();
      setServerUser(null);
    },
  };
}
