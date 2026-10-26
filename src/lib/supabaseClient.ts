import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Browser client — anon key, sessions persisted in localStorage.
//
// Lazy proxy: the real client is created on first use, not at import, so that
// static prerendering at build time (which imports every page) doesn't need the
// Supabase env vars. NEXT_PUBLIC_* values are inlined at build time, though, so
// they must still be set in the build environment for the deployed app to work.
let instance: SupabaseClient | undefined;

function getInstance(): SupabaseClient {
  if (!instance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set at build time. ' +
        'Add them to the project environment variables and redeploy.'
      );
    }
    instance = createClient(url, key);
  }
  return instance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    const real = getInstance();
    const value = (real as any)[prop];
    // Bind functions to the real instance so internal `this` references resolve correctly
    return typeof value === 'function' ? value.bind(real) : value;
  },
});
