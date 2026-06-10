'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CorePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/core/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-400 font-bold tracking-wider uppercase animate-pulse">
          Redirecting to Dashboard...
        </span>
      </div>
    </div>
  );
}
