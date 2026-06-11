'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthSession } from '@/lib/authHelper';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getAuthSession();

    if (!session.isAuthenticated || !session.role) {
      router.replace('/login');
    } else {
      if (session.role === 'core') {
        router.replace('/core/roadmaps');
      } else {
        router.replace('/roadmap');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen w-screen bg-[#020617] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-400 font-bold tracking-wider uppercase animate-pulse">
          Redirecting to learning track...
        </span>
      </div>
    </div>
  );
}
