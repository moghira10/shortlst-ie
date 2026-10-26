'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { authFetch } from '@/lib/authFetch';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { PRODUCT_MANAGER } from '@/lib/practiceConfig';
import type { Evaluation, ParameterScore, PracticeInterview, TranscriptTurn } from '@/lib/types';
import { withBase } from '@/lib/paths';

const POLL_MS = 5000;
// Evaluation normally lands within a couple of minutes of hanging up
const SLOW_AFTER_MS = 4 * 60 * 1000;

function scoreTheme(score: number) {
  if (score >= 7.5) return { text: 'text-emerald-600', bar: 'bg-emerald-500', ring: '#10b981', soft: 'bg-emerald-50' };
  if (score >= 5) return { text: 'text-amber-600', bar: 'bg-amber-500', ring: '#f59e0b', soft: 'bg-amber-50' };
  return { text: 'text-rose-600', bar: 'bg-rose-500', ring: '#f43f5e', soft: 'bg-rose-50' };
}

export default function PracticeReportPage() {
  const session = useRequireAuth();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [practice, setPractice] = useState<PracticeInterview | null>(null);
  const [missing, setMissing] = useState(false);
  const [waitingSince] = useState(() => Date.now());
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!session) return;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const load = async () => {
      const res = await authFetch(`/api/interviews/${sessionId}`).catch(() => null);
      if (cancelled) return;
      if (res?.status === 404) return setMissing(true);
      if (res?.ok) {
        const data: PracticeInterview = await res.json();
        setPractice(data);
        if (data.status === 'completed' || data.status === 'failed') return;
      }
      setSlow(Date.now() - waitingSince > SLOW_AFTER_MS);
      timer = setTimeout(load, POLL_MS);
    };
    load();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [session, sessionId, waitingSince]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader signedIn />
      <main className="mx-auto max-w-4xl px-6 py-10">
        {missing ? (
          <Centered title="Report not found" body="This practice session doesn't exist on your account." />
        ) : !practice ? (
          <Centered spinner title="Loading your report…" />
        ) : practice.status === 'created' ? (
          <Centered
            title="You haven't taken this interview yet"
            body="Head to the lobby when you're ready."
            action={<Link href={`/interviews/${sessionId}/room`} className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Go to lobby →</Link>}
          />
        ) : practice.status === 'failed' ? (
          <Centered title="We couldn't score this session" body="Something went wrong on our side. This session didn't count towards your monthly limit." action={<PracticeAgain />} />
        ) : practice.status !== 'completed' || !practice.evaluation ? (
          <Centered
            spinner
            title="Jane is writing up your feedback…"
            body={slow
              ? "This is taking longer than usual. You can leave this page — your report will be on your dashboard when it's ready."
              : 'This usually takes a minute or two. Keep this tab open.'}
          />
        ) : (
          <Report practice={practice} evaluation={practice.evaluation} />
        )}
      </main>
    </div>
  );
}

function Centered({ title, body, spinner, action }: { title: string; body?: string; spinner?: boolean; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      {spinner && (
        <div className="relative">
          <img src={withBase('/jane.png')} alt="Jane" className="h-20 w-20 rounded-full object-cover object-top" />
          <svg className="absolute -inset-2 h-24 w-24 animate-spin text-brand-500/40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="30 70" />
          </svg>
        </div>
      )}
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {body && <p className="max-w-md text-slate-500">{body}</p>}
      {action}
    </div>
  );
}

function PracticeAgain() {
  return (
    <Link href="/dashboard" className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600">
      Practise again →
    </Link>
  );
}

function Report({ practice, evaluation }: { practice: PracticeInterview; evaluation: Evaluation }) {
  const type = PRODUCT_MANAGER.interviewTypes.find(t => t.id === practice.interview_type);
  const level = PRODUCT_MANAGER.levels.find(l => l.id === practice.level);
  const overall = typeof evaluation.overall_score === 'number' ? evaluation.overall_score : null;
  const params = evaluation.parameter_scores ?? [];
  const feedback = evaluation.candidate_feedback ?? {};
  const summary = feedback.summary || evaluation.summary;
  const date = new Date(practice.completed_at ?? practice.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-brand-600">
            {type?.name ?? practice.interview_type} · {level?.name ?? practice.level}
            {practice.target_company ? ` · ${practice.target_company}` : ''}
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Your feedback report</h1>
          <p className="text-sm text-slate-400">{date}</p>
        </div>
        <PracticeAgain />
      </div>

      {/* Score + summary */}
      <section className="grid gap-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm md:grid-cols-[auto_1fr]">
        {overall !== null && <ScoreRing score={overall} />}
        <div className="flex flex-col justify-center gap-3">
          {evaluation.comparable_level && (
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold first-letter:uppercase ${scoreTheme(overall ?? 0).soft} ${scoreTheme(overall ?? 0).text}`}>
              {evaluation.comparable_level} for {level?.name ?? 'this level'}
            </span>
          )}
          {summary && <p className="leading-relaxed text-slate-700">{summary}</p>}
        </div>
      </section>

      {/* Rubric */}
      {params.length > 0 && (
        <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <h2 className="mb-1 text-lg font-bold text-slate-900">How you scored</h2>
          <p className="mb-6 text-sm text-slate-500">The same rubric hiring teams use to evaluate real {type?.name ?? 'PM'} rounds.</p>
          <div className="flex flex-col gap-6">
            {params.map(p => <RubricRow key={p.key ?? p.label} p={p} />)}
          </div>
        </section>
      )}

      {/* Strengths / improvements */}
      <div className="grid gap-6 md:grid-cols-2">
        <ListCard title="What went well" tone="good" items={evaluation.strengths} extra={feedback.strengths_to_highlight} />
        <ListCard title="What to work on" tone="work" items={evaluation.areas_for_improvement} />
      </div>

      {feedback.tip && (
        <section className="flex gap-4 rounded-3xl border border-brand-200 bg-brand-50 p-6">
          <span className="text-2xl" aria-hidden>💡</span>
          <div>
            <p className="mb-1 text-sm font-semibold text-brand-700">Jane&rsquo;s tip for your next round</p>
            <p className="text-sm leading-relaxed text-slate-700">{feedback.tip}</p>
          </div>
        </section>
      )}

      {practice.transcript && practice.transcript.length > 0 && <Transcript turns={practice.transcript} />}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const theme = scoreTheme(score);
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(10, score)) / 10;
  return (
    <div className="relative mx-auto h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={theme.ring} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-extrabold ${theme.text}`}>{score.toFixed(1)}</span>
        <span className="text-xs text-slate-400">out of 10</span>
      </div>
    </div>
  );
}

function RubricRow({ p }: { p: ParameterScore }) {
  const theme = scoreTheme(p.score);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">
          {p.label}
          {typeof p.weight === 'number' && <span className="ml-2 text-xs font-normal text-slate-400">{Math.round(p.weight * 100)}% weight</span>}
        </p>
        <p className={`text-sm font-bold ${theme.text}`}>{p.score.toFixed(1)}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${Math.max(0, Math.min(10, p.score)) * 10}%` }} />
      </div>
      {(p.verdict || p.evidence) && (
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {p.verdict && <span className="font-medium text-slate-700">{p.verdict}. </span>}
          {p.evidence}
        </p>
      )}
    </div>
  );
}

function ListCard({ title, tone, items, extra }: { title: string; tone: 'good' | 'work'; items?: string[]; extra?: string }) {
  const list = (items ?? []).filter(Boolean);
  if (!list.length && !extra) return null;
  const mark = tone === 'good'
    ? <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">✓</span>
    : <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">→</span>;
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-slate-900">{title}</h2>
      <ul className="flex flex-col gap-3">
        {list.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-600">{mark}{s}</li>
        ))}
      </ul>
      {extra && <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">{extra}</p>}
    </section>
  );
}

function Transcript({ turns }: { turns: TranscriptTurn[] }) {
  const [open, setOpen] = useState(false);
  const isJane = (t: TranscriptTurn) => {
    const who = (t.role || t.speaker || '').toLowerCase();
    return who === 'assistant' || who === 'interviewer' || who === 'ai' || who === 'jane' || who === 'bot';
  };
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between text-left">
        <h2 className="text-base font-bold text-slate-900">Full transcript</h2>
        <span className="text-sm text-brand-600">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-5 flex flex-col gap-4">
          {turns.filter(t => t.content?.trim()).map((t, i) => (
            <div key={i} className={`flex gap-3 ${isJane(t) ? '' : 'flex-row-reverse text-right'}`}>
              {isJane(t)
                ? <img src={withBase('/jane.png')} alt="Jane" className="h-8 w-8 flex-shrink-0 rounded-full object-cover object-top" />
                : <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">You</span>}
              <p className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isJane(t) ? 'bg-slate-50 text-slate-700' : 'bg-brand-50 text-slate-800'}`}>
                {t.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
