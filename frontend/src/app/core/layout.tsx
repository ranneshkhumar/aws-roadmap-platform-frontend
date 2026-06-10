'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoreLayoutProps {
  children: React.ReactNode;
}

const navGroups = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/core/dashboard', icon: Icons.LayoutDashboard },
    ]
  },
  {
    title: 'Curriculum',
    items: [
      { label: 'Roadmap Builder', href: '/core/roadmaps', icon: Icons.Map },
      { label: 'Modules', href: '/core/modules', icon: Icons.BookOpen, placeholder: true },
      { label: 'Categories', href: '/core/categories', icon: Icons.FolderHeart, placeholder: true },
      { label: 'Content Library', href: '/core/content', icon: Icons.FileText, placeholder: true },
      { label: 'Quizzes', href: '/core/quizzes', icon: Icons.HelpCircle, placeholder: true },
    ]
  },
  {
    title: 'Learners',
    items: [
      { label: 'Learners Directory', href: '/core/learners', icon: Icons.Users },
      { label: 'Progress Tracking', href: '/core/progress', icon: Icons.TrendingUp, placeholder: true },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Analytics Insights', href: '/core/analytics', icon: Icons.BarChart3 },
      { label: 'Reports', href: '/core/reports', icon: Icons.FilePieChart, placeholder: true },
      { label: 'Activity Logs', href: '/core/logs', icon: Icons.ClipboardList, placeholder: true },
    ]
  },
  {
    title: 'Settings',
    items: [
      { label: 'Tags & Labels', href: '/core/tags', icon: Icons.Tags, placeholder: true },
      { label: 'General Settings', href: '/core/settings', icon: Icons.Sliders, placeholder: true },
    ]
  }
];

const topTabs = [
  { label: 'Dashboard', href: '/core/dashboard' },
  { label: 'Roadmap', href: '/core/roadmaps' },
  { label: 'Learners', href: '/core/learners' },
  { label: 'Analytics', href: '/core/analytics' },
];

export default function CoreLayout({ children }: CoreLayoutProps) {
  const pathname = usePathname();

  const isItemActive = (href: string, isPlaceholder?: boolean) => {
    if (isPlaceholder) return false;
    if (href === '/core/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const isTabActive = (href: string) => {
    if (href === '/core/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

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

        {/* Grouped Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-heading px-2 block">
                {group.title}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.href, item.placeholder);
                  const contentClasses = cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left",
                    active
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/15"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  );

                  if (item.placeholder) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => alert(`${item.label} is a dashboard module placeholder under development.`)}
                        className={contentClasses}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  }

                  return (
                    <Link key={item.label} href={item.href} className={contentClasses}>
                      <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-slate-700")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Panel Actions */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-1 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all"
          >
            <Icons.LogOut className="w-4 h-4 text-rose-500" />
            <span>Exit to Student view</span>
          </Link>
          <button
            type="button"
            onClick={() => alert("Sidebar collapse is currently in placeholder mode.")}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Icons.ChevronLeftSquare className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </div>
          </button>
        </div>
      </aside>

      {/* ═══════════════ MAIN CONTENT PANEL (Right) ═══════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header Navbar */}
        <nav className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
          
          {/* Left Side: Navigation Tabs */}
          <div className="flex items-center gap-6 h-full text-xs font-bold">
            {topTabs.map((tab) => {
              const active = isTabActive(tab.href);
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={cn(
                    "transition-all duration-150 h-full flex items-center px-1 border-b-2",
                    active
                      ? "text-indigo-650 font-extrabold border-indigo-600"
                      : "text-slate-400 border-transparent hover:text-slate-700"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side: Bell + Profile details */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button
              onClick={() => alert("Notifications are clear.")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Icons.Bell className="w-4.5 h-4.5" />
            </button>
            
            <div className="h-4 w-[1px] bg-slate-200" />

            {/* User Profile */}
            <div className="flex items-center gap-2.5 select-text">
              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-650 flex items-center justify-center font-black text-xs select-none">
                LC
              </div>
              <div className="text-[10px] text-left hidden sm:block">
                <p className="font-extrabold text-slate-800 leading-tight">Lead Architect</p>
                <p className="text-slate-400 font-bold mt-0.5">AWS Cloud Club Staff</p>
              </div>
            </div>
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
