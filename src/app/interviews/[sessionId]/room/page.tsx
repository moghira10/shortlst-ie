'use client';

import { useParams } from 'next/navigation';
import PracticeRoom from '@/components/PracticeRoom';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function PracticeRoomPage() {
  const session = useRequireAuth();
  const { sessionId } = useParams<{ sessionId: string }>();
  if (!session) return null;
  return <PracticeRoom sessionId={sessionId} />;
}
