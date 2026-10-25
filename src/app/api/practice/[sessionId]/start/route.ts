import { NextRequest, NextResponse } from 'next/server';
import { getOwnedPractice, getPracticeUser, notFound, unauthorized } from '@/lib/apiAuth';
import { engineConfigured, engineSessionCall } from '@/lib/engine';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Starts the AI interviewer bot (lazy — it isn't running until the candidate joins).
export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const user = await getPracticeUser(req);
  if (!user) return unauthorized();

  const practice = await getOwnedPractice(params.sessionId, user.userId);
  if (!practice) return notFound();
  if (practice.status === 'completed' || practice.status === 'failed') {
    return NextResponse.json({ error: 'session not active' }, { status: 410 });
  }
  if (!engineConfigured()) {
    return NextResponse.json({ error: 'Engine not configured' }, { status: 503 });
  }

  if (practice.status === 'created') {
    await supabaseAdmin()
      .from('practice_interviews')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('session_id', params.sessionId);
  }

  const res = await engineSessionCall(params.sessionId, 'start');
  return new NextResponse(await res.text(), { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
