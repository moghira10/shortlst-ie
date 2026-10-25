import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface PracticeUser {
  userId: string;
  email: string | null;
  name: string;
}

/**
 * Verifies the Bearer token with Supabase Auth. Unlike asparagus, a practice
 * user needs no profile/organization — any signed-in account can practise.
 */
export async function getPracticeUser(req: NextRequest): Promise<PracticeUser | null> {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
  if (!token) return null;

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: { user } } = await authClient.auth.getUser(token);
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const name = String(meta.full_name || meta.name || user.email?.split('@')[0] || 'there');
  return { userId: user.id, email: user.email ?? null, name };
}

/** Loads a practice interview by engine session id, scoped to its owner. */
export async function getOwnedPractice(sessionId: string, userId: string) {
  const { data } = await supabaseAdmin()
    .from('practice_interviews')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function notFound() {
  return NextResponse.json({ error: 'not found' }, { status: 404 });
}
