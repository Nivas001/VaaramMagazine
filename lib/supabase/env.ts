/**
 * Supabase key resolution — new and old formats.
 *
 * Supabase migrated from JWT-based `anon` / `service_role` keys to opaque
 * `publishable` / `secret` keys. Both formats work as drop-in replacements
 * with the same SDK calls, and Supabase is not forcing a cutover, so a
 * project dashboard may hand out either pair depending on when it was
 * created. Reading both means this code keeps working regardless of which
 * one a given `.env.local` happens to contain.
 */

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

/** The public, RLS-respecting key — safe in the browser. */
export function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

/** The privileged, RLS-bypassing key — server only, never expose this. */
export function getSupabaseSecretKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}
