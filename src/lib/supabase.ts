import { createClient, SupabaseClient } from "@supabase/supabase-js";

// These are public values — safe to hardcode.
// The anon key only allows operations permitted by Row Level Security policies.
const SUPABASE_URL = "https://yuyqsaayocbtdesubkbr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eXFzYWF5b2NidGRlc3Via2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1MjU1MjUsImV4cCI6MjA0OTEwMTUyNX0.o5WgLc-VlEJ30wGack1UrAtDQNsjl1DRew9ANMcsiYk";

export { SUPABASE_URL };

let anonClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client using the public anon key.
 * Used for auth operations (signUp, signInWithPassword).
 */
export function getSupabaseClient(): SupabaseClient {
  if (!anonClient) {
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return anonClient;
}
