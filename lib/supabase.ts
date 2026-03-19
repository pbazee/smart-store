// Re-export client-safe functions from supabase-client
// For server-side functions, use @/lib/supabase-server instead
export {
  createSupabaseClientClient,
  supabase,
} from "@/lib/supabase-client";