/**
 * Supabase Client Setup for App Router
 * Uses @supabase/ssr for proper Next.js integration with cookies
 */

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️  Supabase environment variables not configured. OAuth will not work.");
}

/**
 * Server-side Supabase client
 * Use this in Server Components and Server Actions
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // If the callback throws an error, it's probably because we're
          // in a Server Component or a Route Handler. In that case, we would
          // need to use the `UnsafeLocalStorage` adapter instead.
        }
      },
    },
  });
}

/**
 * Client-side Supabase client
 * Use this in Client Components with "use client"
 */
export function createSupabaseClientClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
