/**
 * Safe fallback Supabase client when NEXT_PUBLIC_SUPABASE_URL is not yet configured.
 * Prevents local development from crashing with 500 errors before the user connects their database.
 */

function createChainableQuery(): any {
  const defaultResult = { data: [], error: null, count: 0 };
  const promise = Promise.resolve(defaultResult);

  return new Proxy(promise, {
    get(target, prop) {
      if (prop === "then" || prop === "catch" || prop === "finally") {
        return (target as any)[prop].bind(target);
      }
      if (prop === "maybeSingle" || prop === "single") {
        return () => Promise.resolve({ data: null, error: null });
      }
      return () => createChainableQuery();
    },
  });
}

export function createMockSupabaseClient(): any {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error(
          "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
        ),
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => createChainableQuery(),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: new Error("Storage not configured") }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        createSignedUrl: async () => ({ data: null, error: new Error("Storage not configured") }),
      }),
    },
  };
}
