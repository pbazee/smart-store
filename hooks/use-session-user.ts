"use client";

import { useSupabase } from "@/components/supabase-provider";

export function useSessionUser() {
  const { session, sessionUser, isSessionResolved, isSessionUserLoaded, signOut } =
    useSupabase();
  const isLoading = !isSessionResolved || (!session?.user && !isSessionUserLoaded);

  return {
    isLoaded: isSessionResolved && isSessionUserLoaded,
    isLoading,
    hasLoadedServerSession: isSessionUserLoaded,
    isSignedIn: !!sessionUser,
    sessionUser,
    signOut,
  };
}
