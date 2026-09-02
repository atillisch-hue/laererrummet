import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Student access deliberately uses a separate anonymous client.
// The real student authorization is the high-entropy token stored in sessionStorage,
// not a shared Supabase Auth session from a teacher/parent/admin using the same browser.
export const studentSupabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
