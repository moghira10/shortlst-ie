'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { supabase } from '@/lib/supabaseClient';
import { withBase } from '@/lib/paths';

function safeNext(next: string | null): string {
  // Only allow same-origin relative paths
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next);
    });
  }, [router, next]);

  const redirectTo = () =>
    `${window.location.origin}${withBase('/auth/callback')}?next=${encodeURIComponent(next)}`;

  async function withGoogle() {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setError(error.message);
      setState('error');
    }
  }

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setError(error.message);
      setState('error');
    } else {
      setState('sent');
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
      <div className="mb-6 flex items-center gap-3">
        <img src={withBase('/jane.png')} alt="Jane" className="h-12 w-12 rounded-full object-cover object-top" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sign in to practise</h1>
          <p className="text-sm text-slate-500">Your sessions and feedback are saved to your account.</p>
        </div>
      </div>

      {state === 'sent' ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-700">
          Check <strong>{email}</strong> for a sign-in link. You can close this tab.
        </div>
      ) : (
        <>
          <button
            onClick={withGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
            </svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-100" /> or <span className="h-px flex-1 bg-slate-100" />
          </div>

          <form onSubmit={withEmail} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <button
              type="submit"
              disabled={state === 'sending'}
              className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              {state === 'sending' ? 'Sending link…' : 'Email me a sign-in link'}
            </button>
          </form>
        </>
      )}

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Suspense>
          <SignInForm />
        </Suspense>
      </main>
    </div>
  );
}
