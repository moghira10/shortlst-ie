import { supabase } from '@/lib/supabaseClient';
import { withBase } from '@/lib/paths';

/** Calls one of this app's API routes (path relative to the base path) with the user's token. */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const authHeaders: Record<string, string> = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
  return fetch(withBase(path), {
    ...options,
    headers: { ...authHeaders, ...(options.headers as Record<string, string> | undefined) },
  });
}
