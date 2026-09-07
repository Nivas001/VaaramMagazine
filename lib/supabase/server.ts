import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createMockSupabaseClient } from "./mock";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Reads and refreshes the logged-in admin's session from cookies.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createMockSupabaseClient();
  }

  const cookieStore = await cookies();

  return createServerClient(
    url,
    anonKey,
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return createMockSupabaseClient();
  }

  return createSupabaseClient(
    url,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
