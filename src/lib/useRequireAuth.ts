'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

/** Redirects to /signin (returning here afterwards) when there is no session. */
export function useRequireAuth(): Session | null {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (!data.session) {
        router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
      } else {
        setSession(data.session);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!cancelled && s) setSession(s);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router, pathname]);

  return session;
}
