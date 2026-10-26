import { NextRequest, NextResponse } from 'next/server';
import { getOwnedPractice, getPracticeUser, notFound, unauthorized } from '@/lib/apiAuth';
import { engineConfigured, engineSessionCall } from '@/lib/engine';

// Tells the engine the candidate hung up, so it skips the reconnect grace period
// and moves straight to evaluation.
export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const user = await getPracticeUser(req);
  if (!user) return unauthorized();

  const practice = await getOwnedPractice(params.sessionId, user.userId);
  if (!practice) return notFound();
  if (!engineConfigured()) {
    return NextResponse.json({ error: 'Engine not configured' }, { status: 503 });
  }

  const res = await engineSessionCall(params.sessionId, 'end');
  return new NextResponse(await res.text(), { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
