import { supabase } from '@/lib/supabaseClient';

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const authHeaders: Record<string, string> = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
  return fetch(url, {
    ...options,
    headers: { ...authHeaders, ...(options.headers as Record<string, string> | undefined) },
  });
}
