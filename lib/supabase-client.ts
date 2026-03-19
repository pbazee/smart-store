import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
  );
}

/**
 * Client-side Supabase client
 * Use this in Client Components with "use client"
 * Automatically handles cookies for session persistence
 */
export function createSupabaseClientClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Direct Supabase client export (for client-side only)
 * Can be used in client components that don't need React hooks
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
