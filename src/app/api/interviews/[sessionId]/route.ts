import { NextRequest, NextResponse } from 'next/server';
import { getOwnedPractice, getPracticeUser, notFound, unauthorized } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// Full practice interview (evaluation + transcript) for the report page.
export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const user = await getPracticeUser(req);
  if (!user) return unauthorized();

  const practice = await getOwnedPractice(params.sessionId, user.userId);
  if (!practice) return notFound();

  const { user_id: _omit, ...rest } = practice;
  return NextResponse.json(rest);
}
