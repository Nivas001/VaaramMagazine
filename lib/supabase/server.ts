import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createMockSupabaseClient } from "./mock";
import { getSupabasePublicKey, getSupabaseSecretKey, getSupabaseUrl } from "./env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Reads and refreshes the logged-in admin's session from cookies.
 */
export async function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();

  if (!url || !key) {
    return createMockSupabaseClient();
  }

  const cookieStore = await cookies();

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware refreshes the session
            // instead, so this is safe to ignore.
          }
        },
      },
    }
  );
}

/**
 * Privileged client that bypasses Row Level Security.
 * Only ever import this from server-side code that has already verified the
 * caller is a signed-in admin.
 */
export function createAdminClient() {
  const url = getSupabaseUrl();
  const secretKey = getSupabaseSecretKey();

  if (!url || !secretKey) {
    return createMockSupabaseClient();
  }

  return createSupabaseClient(
    url,
    secretKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
