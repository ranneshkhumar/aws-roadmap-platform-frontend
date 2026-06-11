'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthSession } from '@/lib/authHelper';
import { ApiError } from '@/services/apiClient';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect immediately
  useEffect(() => {
    const session = getAuthSession();
    if (session.isAuthenticated && session.role) {
      if (session.role === 'core') {
        router.replace('/core/roadmaps');
      } else {
        router.replace('/roadmap');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normEmail = email.trim();
    const pwd = password.trim();

    try {
      await login({ email: normEmail, password: pwd });
      
      const session = getAuthSession();
      if (session.role === 'core') {
        router.push('/core/roadmaps');
      } else {
        router.push('/roadmap');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Invalid simulated credentials. Please use one of the demo credentials below.');
    }
  };

  const autofill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#020617] flex items-center justify-center p-4 font-sans select-none relative overflow-hidden text-slate-100">
      {/* Background Ambience */}
      <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 backdrop-blur-md flex flex-col gap-6">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-650 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <Icons.Cloud className="w-6 h-6 fill-current" />
          </div>
          <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase font-heading">
            AWS Cloud Club
          </span>
          <h1 className="text-xl font-extrabold text-white tracking-tight font-heading mt-1">
            Learning Platform
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed max-w-[280px]">
            Development Role Access Simulator
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex items-start gap-2.5 leading-relaxed"
            >
              <Icons.AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-1">
            <label className="text-slate-400 font-extrabold block uppercase tracking-wider text-[10px]">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="e.g. core@cloudclub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              />
              <Icons.Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-extrabold block uppercase tracking-wider text-[10px]">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              />
              <Icons.Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:brightness-110 active:scale-[0.99] text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-indigo-650/15 flex items-center justify-center gap-1.5 font-heading text-xs tracking-wider"
          >
            <span>Simulate Login</span>
            <Icons.ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Panel */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block font-heading">
            Simulated Demo Accounts
          </span>

          <div className="grid grid-cols-1 gap-2 text-[11px] font-medium text-slate-400">
            {[
              {
                title: 'Core Team',
                desc: 'Full Core Admin & CMS Access',
                email: 'core@cloudclub.com',
                pass: 'core123',
                badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              },
              {
                title: 'Crew Member',
                desc: 'Roadmap & Learners Directory',
                email: 'crew@cloudclub.com',
                pass: 'crew123',
                badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              },
              {
                title: 'Cloud Enthusiast',
                desc: 'Student Roadmap access only',
                email: 'user@cloudclub.com',
                pass: 'user123',
                badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }
            ].map((account, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => autofill(account.email, account.pass)}
                className="w-full text-left p-3 bg-slate-950/40 border border-slate-850 hover:border-slate-700 rounded-xl transition-all duration-200 flex items-center justify-between group cursor-pointer active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {account.title}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${account.badgeColor}`}>
                      {account.title.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{account.desc}</p>
                </div>
                <Icons.MousePointerClick className="w-4 h-4 text-slate-650 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
