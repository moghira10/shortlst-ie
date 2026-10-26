import { NextRequest, NextResponse } from 'next/server';
import { getOwnedPractice, getPracticeUser, notFound, unauthorized } from '@/lib/apiAuth';
import { engineConfigured, engineSessionCall } from '@/lib/engine';

export const dynamic = 'force-dynamic';

const TTL_MS = 48 * 60 * 60 * 1000;

export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const user = await getPracticeUser(req);
  if (!user) return unauthorized();

  const practice = await getOwnedPractice(params.sessionId, user.userId);
  if (!practice) return notFound();

  if (practice.status === 'completed') {
    return NextResponse.json({ error: 'interview completed' }, { status: 410 });
  }
  if (practice.status === 'failed' || Date.now() - new Date(practice.created_at).getTime() > TTL_MS) {
    return NextResponse.json({ error: 'session expired' }, { status: 410 });
  }

  if (!engineConfigured()) {
    return NextResponse.json({ error: 'Engine not configured' }, { status: 503 });
  }

  const res = await engineSessionCall(params.sessionId, 'join');
  const bodyText = await res.text();
  if (!res.ok) {
    return new NextResponse(bodyText, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Bad engine response' }, { status: 502 });
  }

  return NextResponse.json({
    ...body,
    candidate_name: body.candidate_name ?? practice.candidate_name,
    practice: {
      interview_type: practice.interview_type,
      level: practice.level,
      target_company: practice.target_company,
    },
  });
}
