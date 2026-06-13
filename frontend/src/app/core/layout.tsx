'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAuthSession } from '@/lib/authHelper';
import { authService } from '@/services/auth.service';

interface CoreLayoutProps {
  children: React.ReactNode;
}

export default function CoreLayout({ children }: CoreLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const session = getAuthSession();

    if (!session.isAuthenticated || !session.role) {
      router.replace('/login');
      return;
    }

    setUserRole(session.role);

    // Core Protection rules
    if (session.role === 'core') {
      setLoading(false);
    } else if (session.role === 'crew') {
      // Crew can only access Learners directory (/core/learners)
      if (pathname.startsWith('/core/learners')) {
        setLoading(false);
      } else {
        router.replace('/learn');
      }
    } else {
      // Enthusiasts redirected out
      router.replace('/learn');
    }
  }, [router, pathname]);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen bg-slate-50 text-slate-800 font-sans items-center justify-center select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400 font-bold tracking-wider uppercase animate-pulse">
            Verifying Core Clearance...
          </span>
        </div>
      </div>
    );
  }

  const isCore = userRole === 'core';

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 font-sans overflow-hidden select-none">
      
      {/* ═══════════════ PERMANENT LIGHT SIDEBAR (Left) ═══════════════ */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 h-full">
        {/* Branding Logo */}
        <div className="px-6 py-4.5 flex items-center gap-2.5 border-b border-slate-100 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-650 text-white flex items-center justify-center">
            <Icons.Cloud className="w-4.5 h-4.5 fill-current" />
          </div>
          <span className="text-[12px] font-black tracking-wider uppercase text-slate-900 font-heading">
            AWS Cloud Club
          </span>
        </div>

        {/* Empty Sidebar Content Spacer */}
        <div className="flex-1 bg-slate-50/10" />

        {/* Bottom Panel Actions (Simulated Role profile & Logout) */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-2.5 flex-shrink-0">
          
          {/* Dynamic simulated profile card */}
          <div className="flex items-center gap-2.5 px-3 py-2 border border-slate-150 bg-slate-50/55 rounded-xl select-none">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-650 flex items-center justify-center font-black text-xs flex-shrink-0">
              {isCore ? 'CO' : 'CR'}
            </div>
            <div className="text-[10px] text-left">
              <p className="font-extrabold text-slate-800 leading-tight">
                {isCore ? 'CORE STAFF' : 'CREW MEMBER'}
              </p>
              <p className="text-slate-450 font-bold mt-0.5">
                {isCore ? 'Administrator Hub' : 'Chapter Facilitator'}
              </p>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer text-left w-full"
          >
            <Icons.LogOut className="w-4 h-4 text-rose-500" />
            <span>Logout to Login</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════ MAIN CONTENT PANEL (Right) ═══════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header Navbar */}
        <nav className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
          
          {/* Navigation Tabs based on role - replaced with a neutral title */}
          <div className="flex items-center gap-6 h-full text-xs font-bold text-slate-800">
            <span className="text-sm font-extrabold tracking-tight text-slate-700 select-none">
              Roadmaps
            </span>
          </div>

          {/* Right Side: Bell action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Notifications are clear.")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-450 hover:text-slate-650 transition-colors"
            >
              <Icons.Bell className="w-4.5 h-4.5" />
            </button>
          </div>
        </nav>

        {/* Page Content viewport */}
        <main className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
      
    </div>
  );
}

