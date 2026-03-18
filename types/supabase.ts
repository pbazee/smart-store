// Placeholder for generated Supabase types
// Run: npx supabase gen types typescript --project-id <ref> --schema public > types/supabase.ts

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: "admin" | "customer";
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: "admin" | "customer";
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: "admin" | "customer";
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
