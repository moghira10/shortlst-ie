import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { withBase } from '@/lib/paths';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shortlst Practice — Mock PM interviews with an AI interviewer',
  description: 'Practise realistic Product Manager interviews with Jane, the AI interviewer companies use on Shortlst, and get rubric-based feedback in minutes.',
  icons: { icon: withBase('/favicon.ico') },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
