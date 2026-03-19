"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseClientClient } from "@/lib/supabase-client";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
  session: Session | null;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  const [supabase] = useState(() => createSupabaseClientClient());
  const [session, setSession] = useState<Session | null>(initialSession);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (newSession) {
        setSession(newSession);
      } else {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <Context.Provider value={{ supabase, session }}>
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
