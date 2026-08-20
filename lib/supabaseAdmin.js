import { createClient } from "@supabase/supabase-js";

// Uses the service_role key - full access, server-side only. Never expose this to the browser.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
