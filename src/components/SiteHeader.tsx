'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { withBase } from '@/lib/paths';

export default function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={signedIn ? '/dashboard' : '/'} className="flex items-center gap-2">
          <img src={withBase('/logo.svg')} alt="Shortlst" className="h-6" />
          <span className="text-xl font-bold tracking-tight text-black">shortlst</span>
          <span className="ml-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
            Practice
          </span>
        </Link>
        {signedIn ? (
          <div className="flex items-center gap-5 text-sm">
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
            <button onClick={signOut} className="text-slate-500 hover:text-slate-800">Sign out</button>
          </div>
        ) : (
          <Link
            href="/signin"
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            Start practising
          </Link>
        )}
      </div>
    </header>
  );
}
