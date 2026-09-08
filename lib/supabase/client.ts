"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createMockSupabaseClient } from "./mock";
import { getSupabasePublicKey, getSupabaseUrl } from "./env";

/** Supabase client for use inside Client Components (browser only). */
export function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();

  if (!url || !key) {
    return createMockSupabaseClient();
  }

  return createBrowserClient(url, key);
}
