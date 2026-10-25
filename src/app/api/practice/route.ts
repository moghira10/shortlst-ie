import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getPracticeUser, unauthorized } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createEngineSession, engineConfigured } from '@/lib/engine';
import {
  PRACTICE_GUIDELINES,
  buildJobDescription,
  findInterviewType,
  findLevel,
  findRole,
} from '@/lib/practiceConfig';

const WINDOW_DAYS = 30;

function monthlyLimit(): number {
  const n = parseInt(process.env.PRACTICE_MONTHLY_LIMIT ?? '3', 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

async function usedInWindow(userId: string): Promise<number> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin()
    .from('practice_interviews')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'failed') // engine/setup failures don't burn a credit
    .gte('created_at', since);
  return count ?? 0;
}

// ── GET: the signed-in user's practice history + remaining quota ─────────────
export async function GET(req: NextRequest) {
  const user = await getPracticeUser(req);
  if (!user) return unauthorized();

  const { data, error } = await supabaseAdmin()
    .from('practice_interviews')
    .select('id, session_id, job_role, interview_type, level, target_company, status, created_at, completed_at, evaluation->overall_score')
    .eq('user_id', user.userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[practice] list failed:', error);
    return NextResponse.json({ error: 'Could not load practice history' }, { status: 500 });
  }

  const used = await usedInWindow(user.userId);
  return NextResponse.json({
    interviews: data ?? [],
    quota: { used, limit: monthlyLimit(), windowDays: WINDOW_DAYS },
    name: user.name,
  });
}

// ── POST: create a new practice session on the interview engine ──────────────
const CreateSchema = z.object({
  role: z.string(),
  interview_type: z.string(),
  level: z.string(),
  target_company: z.string().max(80).optional().nullable(),
  candidate_name: z.string().max(80).optional().nullable(),
  resume: z.string().max(12000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const user = await getPracticeUser(req);
  if (!user) return unauthorized();

  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const input = parsed.data;

  const role = findRole(input.role);
  const type = role && findInterviewType(role, input.interview_type);
  const level = role && findLevel(role, input.level);
  if (!role || !type || !level) {
    return NextResponse.json({ error: 'Unsupported role, interview type or level' }, { status: 400 });
  }

  if (!engineConfigured()) {
    return NextResponse.json({ error: 'Interview engine not configured' }, { status: 503 });
  }

  const limit = monthlyLimit();
  if (await usedInWindow(user.userId) >= limit) {
    return NextResponse.json(
      { error: `You've used all ${limit} practice interviews for the last ${WINDOW_DAYS} days.`, code: 'quota_exceeded' },
      { status: 429 },
    );
  }

  const sessionId = uuidv4();
  const candidateName = input.candidate_name?.trim() || user.name;
  const targetCompany = input.target_company?.trim() || null;
  const sb = supabaseAdmin();

  const { error: insertError } = await sb.from('practice_interviews').insert({
    user_id: user.userId,
    session_id: sessionId,
    job_role: role.id,
    interview_type: type.id,
    level: level.id,
    target_company: targetCompany,
    candidate_name: candidateName,
    status: 'created',
  });
  if (insertError) {
    console.error('[practice] insert failed:', insertError);
    return NextResponse.json({ error: 'Could not create practice interview' }, { status: 500 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  let engineRes: Response;
  try {
    engineRes = await createEngineSession({
      session_id: sessionId,
      candidate_id: sessionId,
      job_id: `practice:${role.id}`,
      job_role: role.title,
      level: level.id,
      interview_type: type.id,
      job_description: buildJobDescription(role, level, targetCompany),
      candidate_name: candidateName,
      candidate_resume: input.resume?.trim() ?? '',
      recruiter_id: process.env.PRACTICE_RECRUITER_ID ?? 'shortlst-practice',
      callback_url: `${appUrl}/api/webhooks/interview-complete`,
      custom_questions: [],
      interview_guidelines: PRACTICE_GUIDELINES,
    });
  } catch (e) {
    console.error('[practice] engine unreachable:', e);
    await sb.from('practice_interviews').update({ status: 'failed' }).eq('session_id', sessionId);
    return NextResponse.json({ error: 'Interview engine unavailable. Please try again shortly.' }, { status: 502 });
  }

  if (!engineRes.ok) {
    console.error(`[practice] engine create failed (${engineRes.status}): ${await engineRes.text()}`);
    await sb.from('practice_interviews').update({ status: 'failed' }).eq('session_id', sessionId);
    return NextResponse.json({ error: 'Could not set up your interview. Please try again.' }, { status: 502 });
  }

  return NextResponse.json({ session_id: sessionId }, { status: 201 });
}
