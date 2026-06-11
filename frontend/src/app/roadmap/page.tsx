'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/Layout/AppLayout';
import { RoadmapScreen } from '@/components/Roadmap/RoadmapScreen';
import { getAuthSession } from '@/lib/authHelper';

export default function RoadmapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getAuthSession();
    if (!session.isAuthenticated) {
      router.replace('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400 font-bold tracking-wider uppercase animate-pulse">
            Verifying Explorer Access...
          </span>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <RoadmapScreen />
    </AppLayout>
  );
}
