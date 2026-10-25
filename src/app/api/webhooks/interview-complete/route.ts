import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyEngineWebhook } from '@/lib/webhook';

export const dynamic = 'force-dynamic';

// Completion webhook from the interview engine. Same payload and signature
// scheme as asparagus /api/interviews/complete, but results land in
// practice_interviews and go only to the candidate.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    console.error('[practice-webhook] WEBHOOK_SECRET env var is not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const check = verifyEngineWebhook(
    rawBody,
    req.headers.get('x-interview-signature'),
    req.headers.get('x-interview-timestamp'),
    secret,
  );
  if (!check.ok) {
    console.warn(`[practice-webhook] rejected: ${check.reason}`);
    return NextResponse.json({ error: check.reason }, { status: 401 });
  }

  let payload: {
    event?: string;
    session_id?: string;
    candidate_id?: string;
    transcript?: unknown[];
    evaluation?: Record<string, unknown>;
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (payload.event !== 'interview.completed') {
    return NextResponse.json({ received: true });
  }

  // candidate_id is set to the session id when we create the engine session
  const sessionId = payload.candidate_id || payload.session_id;
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing candidate_id / session_id' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from('practice_interviews')
    .update({
      status: 'completed',
      transcript: payload.transcript ?? [],
      evaluation: payload.evaluation ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)
    .select('id');

  if (error) {
    console.error(`[practice-webhook] update failed for ${sessionId}:`, error);
    return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
  }
  if (!data?.length) {
    console.warn(`[practice-webhook] no practice interview for session ${sessionId}`);
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  console.log(`[practice-webhook] practice interview ${sessionId} completed`);
  return NextResponse.json({ received: true });
}
