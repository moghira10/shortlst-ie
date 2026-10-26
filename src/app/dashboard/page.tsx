'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { authFetch } from '@/lib/authFetch';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { PRODUCT_MANAGER, type EngineLevel } from '@/lib/practiceConfig';
import type { PracticeStatus } from '@/lib/types';

interface HistoryRow {
  session_id: string;
  interview_type: string;
  level: string;
  target_company: string | null;
  status: PracticeStatus;
  created_at: string;
  overall_score?: number | null;
}

interface Quota { used: number; limit: number; windowDays: number }

const role = PRODUCT_MANAGER;

export default function PracticeDashboard() {
  const session = useRequireAuth();
  const router = useRouter();

  const [history, setHistory] = useState<HistoryRow[] | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [name, setName] = useState('');

  const [interviewType, setInterviewType] = useState(role.interviewTypes[0].id);
  const [level, setLevel] = useState<EngineLevel>('mid');
  const [targetCompany, setTargetCompany] = useState('');
  const [resume, setResume] = useState('');
  const [showResume, setShowResume] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    authFetch('/api/interviews')
      .then(r => r.json())
      .then(d => {
        setHistory(d.interviews ?? []);
        setQuota(d.quota ?? null);
        setName(prev => prev || d.name || '');
      })
      .catch(() => setHistory([]));
  }, [session]);

  const remaining = quota ? Math.max(0, quota.limit - quota.used) : null;
  const selectedType = role.interviewTypes.find(t => t.id === interviewType)!;

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await authFetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role.id,
          interview_type: interviewType,
          level,
          target_company: targetCompany || null,
          candidate_name: name || null,
          resume: resume || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Could not start your interview');
      router.push(`/interviews/${body.session_id}/room`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setCreating(false);
    }
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader signedIn />

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1.5fr_1fr]">
        {/* ── New session ─────────────────────────────────────────────── */}
        <form onSubmit={start} className="flex flex-col gap-7 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-slate-900">New Product Manager mock interview</h1>
            <p className="text-sm text-slate-500">Jane will run a realistic ~20 minute round and score you on the same rubric hiring teams use.</p>
          </div>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-700">Interview round</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {role.interviewTypes.map(t => {
                const active = t.id === interviewType;
                return (
                  <label
                    key={t.id}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      active ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input type="radio" name="interview_type" value={t.id} checked={active} onChange={() => setInterviewType(t.id)} className="sr-only" />
                    <p className={`text-sm font-semibold ${active ? 'text-brand-700' : 'text-slate-900'}`}>{t.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{t.tagline}</p>
                  </label>
                );
              })}
            </div>
            <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="mb-2">{selectedType.description}</p>
              <p className="text-xs text-slate-400">e.g. &ldquo;{selectedType.sampleQuestions[0]}&rdquo; · &ldquo;{selectedType.sampleQuestions[1]}&rdquo;</p>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-700">Level you&rsquo;re interviewing for</legend>
            <div className="grid grid-cols-3 gap-3">
              {role.levels.map(l => {
                const active = l.id === level;
                return (
                  <label
                    key={l.id}
                    className={`cursor-pointer rounded-xl border px-3 py-3 text-center transition-all ${
                      active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input type="radio" name="level" value={l.id} checked={active} onChange={() => setLevel(l.id)} className="sr-only" />
                    <p className="text-sm font-semibold">{l.name}</p>
                    <p className="text-xs text-slate-400">{l.years}</p>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Your name</label>
              <input
                type="text"
                value={name}
                maxLength={80}
                onChange={e => setName(e.target.value)}
                placeholder="How Jane should address you"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Target company <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={targetCompany}
                maxLength={80}
                onChange={e => setTargetCompany(e.target.value)}
                placeholder="e.g. Spotify, Swiggy, Stripe"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          <div>
            {showResume ? (
              <>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Resume / background <span className="font-normal text-slate-400">(optional — Jane uses it for your intro question)</span>
                </label>
                <textarea
                  value={resume}
                  maxLength={12000}
                  onChange={e => setResume(e.target.value)}
                  rows={5}
                  placeholder="Paste your resume or a short summary of your experience"
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </>
            ) : (
              <button type="button" onClick={() => setShowResume(true)} className="text-sm font-medium text-brand-600 hover:underline">
                + Add your resume so Jane can tailor the intro
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={creating || remaining === 0}
              className="w-full rounded-xl bg-brand-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-purple-200 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creating ? 'Setting up your interview…' : 'Continue to lobby →'}
            </button>
            {quota && (
              <p className="text-center text-xs text-slate-400">
                {remaining === 0
                  ? `You've used all ${quota.limit} practice interviews for the last ${quota.windowDays} days.`
                  : `${remaining} of ${quota.limit} free practice interviews left this month`}
              </p>
            )}
            {error && <p className="text-center text-sm text-red-500">{error}</p>}
          </div>
        </form>

        {/* ── History ─────────────────────────────────────────────────── */}
        <aside className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your practice history</h2>
          {history === null ? (
            <div className="h-24 animate-pulse rounded-2xl bg-white" />
          ) : history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              No sessions yet. Your first report will show up here.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {history.map(h => <HistoryItem key={h.session_id} row={h} />)}
            </ul>
          )}
        </aside>
      </main>
    </div>
  );
}

function HistoryItem({ row }: { row: HistoryRow }) {
  const type = role.interviewTypes.find(t => t.id === row.interview_type);
  const lvl = role.levels.find(l => l.id === row.level);
  const date = new Date(row.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const expired = row.status !== 'completed' && Date.now() - new Date(row.created_at).getTime() > 48 * 3600 * 1000;

  const href =
    row.status === 'completed' ? `/interviews/${row.session_id}` :
    row.status === 'created' && !expired ? `/interviews/${row.session_id}/room` :
    row.status === 'in_progress' ? `/interviews/${row.session_id}` : null;

  const badge =
    row.status === 'completed' ? (
      <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-bold text-brand-700">
        {typeof row.overall_score === 'number' ? row.overall_score.toFixed(1) : '—'}
        <span className="text-xs font-normal text-brand-500">/10</span>
      </span>
    ) : row.status === 'in_progress' ? (
      <span className="text-xs font-medium text-amber-600">Processing</span>
    ) : row.status === 'failed' || expired ? (
      <span className="text-xs text-slate-400">{row.status === 'failed' ? 'Failed' : 'Expired'}</span>
    ) : (
      <span className="text-xs font-medium text-brand-600">Resume →</span>
    );

  const content = (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm transition hover:border-slate-200">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{type?.name ?? row.interview_type}</p>
        <p className="truncate text-xs text-slate-500">
          {lvl?.name ?? row.level}{row.target_company ? ` · ${row.target_company}` : ''} · {date}
        </p>
      </div>
      {badge}
    </div>
  );

  return <li>{href ? <Link href={href}>{content}</Link> : content}</li>;
}
