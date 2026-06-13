'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/Layout/AppLayout';
import { RoadmapScreen } from '@/components/Roadmap/RoadmapScreen';
import { getAuthSession } from '@/lib/authHelper';
import { learningService } from '@/services/api';

export default function TopicRoadmapPage() {
  const router = useRouter();
  const params = useParams();
  const topicSlug = params.topicSlug as string;
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const session = getAuthSession();
    if (!session.isAuthenticated) {
      router.replace('/login');
      return;
    }

    let active = true;
    const checkAccess = async () => {
      try {
        const topics = await learningService.getTopicList();
        if (!active) return;
        const topic = topics.find((t) => t.slug === topicSlug);
        if (topic && !topic.unlocked) {
          router.replace('/learn');
          return;
        }
        setLoading(false);
      } catch {
        if (!active) return;
        setLoading(false);
      }
    };

    checkAccess();
    return () => { active = false; };
  }, [router, topicSlug]);

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
      <RoadmapScreen topicSlug={topicSlug} />
    </AppLayout>
  );
}
