"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createMockSupabaseClient } from "./mock";

/** Supabase client for use inside Client Components (browser only). */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createMockSupabaseClient();
  }

  return createBrowserClient(url, anonKey);
}
