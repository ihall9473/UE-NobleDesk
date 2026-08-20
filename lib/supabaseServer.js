import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Use this inside API routes and server components. It reads the logged-in
// user's session from cookies, so all queries are automatically scoped to
// that person (thanks to the Row Level Security policies in schema.sql).
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component - safe to ignore, middleware handles it.
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {}
        },
      },
    }
  );
}
