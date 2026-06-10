'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const stats = [
    { label: 'Cloud Architecture Score', value: '94%', icon: Icons.Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Provisioned Services', value: '18 Active', icon: Icons.Box, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Monthly Cost Estimator', value: '$142.80', icon: Icons.DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'VPC Subnets Peered', value: '4 Region Grid', icon: Icons.Network, color: 'text-amber-600', bg: 'bg-amber-50' }
  ];

  const recentAlerts = [
    { title: 'S3 security review required', time: '10 mins ago', desc: 'Verify IAM cross-account access rules.', type: 'warning' },
    { title: 'Auto Scaling Triggered', time: '2 hours ago', desc: 'EC2 count expanded horizontally to absorb mock request spikes.', type: 'info' },
    { title: 'KMS Key Rotated Successfully', time: 'Yesterday', desc: 'Primary master key rotated securely.', type: 'success' }
  ];

  return (
    <div className="space-y-6 p-6 overflow-y-auto h-full scrollbar-thin">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-50/60 via-slate-50/40 to-white border border-slate-200 rounded-[32px] p-6 relative overflow-hidden shadow-xs">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-heading leading-none">
              Welcome back, Instructor ☁️
            </h1>
            <p className="text-xs text-slate-500 mt-2 max-w-xl leading-relaxed font-semibold">
              The AWS Cloud Club learning environments are operating within nominal limits. Review curriculum progress and telemetry trends to support student explorers.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 select-none">
            <button
              onClick={() => alert("CMS settings are preconfigured.")}
              className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Icons.Sliders className="w-3.5 h-3.5" />
              Configure Hub
            </button>
            <button
              onClick={() => alert("Initiating student telemetry sync...")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
            >
              <Icons.ShieldCheck className="w-3.5 h-3.5" />
              Telemetry Sync
            </button>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const StatIcon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden flex items-center gap-4 shadow-xs"
            >
              <div className={`p-3.5 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <StatIcon className="w-5.5 h-5.5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider font-heading">{stat.label}</span>
                <span className="text-lg font-black text-slate-800 tracking-tight mt-0.5 block">{stat.value}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Mock Line Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 lg:col-span-2 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 font-heading">
                Student Portal API Endpoint Traffic
              </h3>
              <p className="text-[11px] text-slate-450 mt-0.5 font-bold">Network request activity timeline</p>
            </div>
            <select
              defaultValue="Last 24 Hours"
              onChange={(e) => alert(`Telemetry filter adjusted to: ${e.target.value}`)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-600 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
            >
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last Month</option>
            </select>
          </div>

          {/* SVG Line Chart */}
          <div className="h-44 w-full relative pt-4 flex items-end">
            <svg className="w-full h-full text-indigo-500" viewBox="0 0 600 200">
              <defs>
                <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Background Horizontal lines */}
              <line x1="0" y1="50" x2="600" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="#f1f5f9" strokeWidth="1" />

              {/* Area path */}
              <path
                d="M0 200 C50 160, 100 170, 150 110 C200 50, 250 80, 300 40 C350 20, 400 90, 450 70 C500 50, 550 120, 600 80 L600 200 Z"
                fill="url(#chart-glow)"
              />
              {/* Line path */}
              <path
                d="M0 200 C50 160, 100 170, 150 110 C200 50, 250 80, 300 40 C350 20, 400 90, 450 70 C500 50, 550 120, 600 80"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Active Node markers */}
              <circle cx="300" cy="40" r="5.5" fill="#818cf8" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="450" cy="70" r="4" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>

          <div className="flex justify-between items-center text-[9px] text-slate-400 font-extrabold uppercase px-1">
            <span>08:00 AM</span>
            <span>12:00 PM</span>
            <span>04:00 PM</span>
            <span>08:00 PM</span>
            <span>12:00 AM</span>
          </div>
        </div>

        {/* Right Side: Security Center */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 font-heading flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Icons.ShieldAlert className="w-4.5 h-4.5 text-amber-500 fill-current/10" />
            Security & Alerts
          </h3>

          <div className="space-y-2.5 flex-1 py-1">
            {recentAlerts.map((alert, idx) => (
              <div key={idx} className="bg-slate-50/60 border border-slate-200/50 rounded-xl p-3 flex gap-3 font-semibold">
                <div className="mt-0.5 flex-shrink-0">
                  {alert.type === 'warning' && <Icons.AlertTriangle className="w-4 h-4 text-amber-500" />}
                  {alert.type === 'info' && <Icons.Info className="w-4 h-4 text-sky-500" />}
                  {alert.type === 'success' && <Icons.CheckCircle className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex justify-between items-center w-full gap-2">
                    <span className="text-[11px] font-extrabold text-slate-800 truncate">{alert.title}</span>
                    <span className="text-[8.5px] text-slate-400 font-bold whitespace-nowrap">{alert.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{alert.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => alert("Opening IAM Security Analyzer...")}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Icons.Shield className="w-4 h-4 text-slate-500" />
            Launch IAM Analyzer
          </button>
        </div>
      </div>
    </div>
  );
};
