'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { withBase } from '@/lib/paths';

function Callback() {
  const router = useRouter();
  const params = useSearchParams();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const raw = params.get('next');
    const next = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard';

    // supabase-js picks up the session from the URL (hash tokens or ?code=)
    // on load; wait for it, then continue.
    const go = () => router.replace(next);
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go();
    });
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) return go();
      const code = params.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) return go();
      }
      setTimeout(() => setFailed(true), 4000);
    });
    return () => sub.subscription.unsubscribe();
  }, [params, router]);

  return failed ? (
    <p className="text-sm text-slate-500">
      That sign-in link didn&rsquo;t work. <a href={withBase('/signin')} className="text-brand-600 underline">Try again</a>
    </p>
  ) : (
    <p className="text-sm text-slate-500">Signing you in…</p>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Suspense>
        <Callback />
      </Suspense>
    </div>
  );
}
