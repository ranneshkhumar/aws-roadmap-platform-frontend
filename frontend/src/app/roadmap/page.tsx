'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RoadmapRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/learn');
  }, [router]);

  return (
    <div className="min-h-screen w-screen bg-[#020617] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-400 font-bold tracking-wider uppercase animate-pulse">
          Redirecting to learning tracks...
        </span>
      </div>
    </div>
  );
}
