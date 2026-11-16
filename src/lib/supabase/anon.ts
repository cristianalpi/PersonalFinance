import { createClient } from "@supabase/supabase-js";

/**
 * Sessionless client for requests that arrive without a browser session (the
 * iPhone Shortcut, calendar apps). It can only call the token-gated functions.
 */
export function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
