import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { PRODUCT_MANAGER } from '@/lib/practiceConfig';

const STEPS = [
  { n: '1', title: 'Pick your round', body: 'Product sense, execution, metrics or behavioural — at APM, PM or Senior PM level.' },
  { n: '2', title: 'Interview with Jane', body: 'A 20-minute live voice interview with realistic follow-ups. Ask clarifying questions, think out loud.' },
  { n: '3', title: 'Get scored feedback', body: 'See how you did on each rubric dimension, with evidence from your own answers and what to work on next.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-16 md:grid-cols-[1.15fr_1fr] md:pt-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-600">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
            Now open for Product Manager interviews
          </div>
          <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
            Practise your PM interview with the AI interviewer companies actually use
          </h1>
          <p className="mb-8 max-w-xl text-lg text-slate-500">
            Jane runs first-round interviews for hiring teams on Shortlst. Now you can sit the same
            interview, scored on the same rubric — and see exactly where you&rsquo;d land before the real thing.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/signin"
              className="rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-purple-200 transition-colors hover:bg-brand-600"
            >
              Start a free mock interview →
            </Link>
            <span className="text-sm text-slate-400">No credit card · ~20 minutes</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="overflow-hidden rounded-3xl bg-[#0d1117] shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
              <span className="rounded-full border border-brand-500/40 bg-brand-500/15 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-purple-300">PRACTICE</span>
              <span className="font-mono text-xs text-white/60">14:32</span>
            </div>
            <div className="relative aspect-[4/3]">
              <img src="/jane.png" alt="Jane, the AI interviewer" className="h-full w-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="mb-1 text-xs font-semibold text-purple-300">Jane · AI interviewer</p>
                <p className="text-sm leading-relaxed text-white/90">
                  &ldquo;Good — you&rsquo;ve picked commuters as your segment. Which of those pain points
                  would you solve first, and why?&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rounds */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Every PM round, one place</h2>
        <p className="mb-8 text-slate-500">Each round is scored on the rubric hiring teams configure for real candidates.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_MANAGER.interviewTypes.map(t => (
            <div key={t.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="mb-1 text-sm font-semibold text-brand-600">{t.tagline}</p>
              <h3 className="mb-2 text-lg font-bold text-slate-900">{t.name}</h3>
              <p className="mb-4 text-sm leading-relaxed text-slate-500">{t.description}</p>
              <p className="text-xs italic text-slate-400">&ldquo;{t.sampleQuestions[0]}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-8 text-2xl font-bold text-slate-900">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(s => (
            <div key={s.n} className="flex gap-4">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-sm font-bold text-brand-600">{s.n}</span>
              <div>
                <h3 className="mb-1 font-semibold text-slate-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-12 border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        Hiring? <a href="https://shortlst.me" className="text-brand-600 hover:underline">Shortlst for teams</a> · help@shortlst.me
      </footer>
    </div>
  );
}
