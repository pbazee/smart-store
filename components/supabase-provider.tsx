"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createSupabaseClientClient } from "@/lib/supabase-client";
import type { SessionUser } from "@/types";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
  session: Session | null;
  sessionUser: SessionUser | null;
  isSessionResolved: boolean;
  isSessionUserLoaded: boolean;
  signOut: () => Promise<void>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

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

function buildSupabaseSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(" ")[0],
    lastName: user.user_metadata?.last_name,
    fullName: user.user_metadata?.full_name,
    email: user.email ?? null,
    imageUrl: user.user_metadata?.avatar_url ?? null,
    role: getRoleFromSupabaseUser(user),
    isDemo: false,
    authProvider: "supabase",
  };
}

export function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession?: Session | null;
}) {
  const [supabase] = useState(() => createSupabaseClientClient());
  const [session, setSession] = useState<Session | null>(initialSession ?? null);
  const [serverUser, setServerUser] = useState<SessionUser | null>(null);
  const [isSessionResolved, setIsSessionResolved] = useState(initialSession !== undefined);
  const [isSessionUserLoaded, setIsSessionUserLoaded] = useState(initialSession !== undefined);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: resolvedSession } }) => {
      if (!isMounted) {
        return;
      }

      setSession(resolvedSession);
      setIsSessionResolved(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        setSession(newSession);
      } else {
        setSession(null);
      }
      setIsSessionResolved(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!isSessionResolved) {
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    setIsSessionUserLoaded(false);

    const loadSessionUser = async () => {
      try {
        const response = await fetch("/api/session", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as
          | { data?: SessionUser | null }
          | null;

        if (!isActive) {
          return;
        }

        setServerUser(payload?.data ?? null);
      } catch (error) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        console.error("Failed to load server session user:", error);
        setServerUser(null);
      } finally {
        if (isActive) {
          setIsSessionUserLoaded(true);
        }
      }
    };

    void loadSessionUser();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isSessionResolved, session?.user?.id]);

  const supabaseSessionUser = useMemo(
    () => (session?.user ? buildSupabaseSessionUser(session.user) : null),
    [session?.user]
  );

  const sessionUser = useMemo(() => {
    if (serverUser?.authProvider === "local") {
      return serverUser;
    }

    if (supabaseSessionUser) {
      return supabaseSessionUser;
    }

    if (isSessionResolved && !session?.user) {
      return serverUser;
    }

    return serverUser ?? supabaseSessionUser;
  }, [isSessionResolved, serverUser, session?.user, supabaseSessionUser]);

  const handleSignOut = async () => {
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
  };

  return (
    <Context.Provider
      value={{
        supabase,
        session,
        sessionUser,
        isSessionResolved,
        isSessionUserLoaded,
        signOut: handleSignOut,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }
  return context;
};
