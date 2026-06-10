'use client';

import React from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsDashboardPage() {
  const { modules } = useRoadmapStore();

  // Simulated metrics and database values for curriculum analytics
  const metrics = {
    totalEnrollments: 148,
    completionRate: 74.2, // percentage
    averageQuizScore: 82.5, // percentage
    totalXpDistributed: 38450
  };

  // 1. Progress Histogram: Count of active learners in specific XP ranges
  const histogramData = [
    { range: '0-500', count: 12, percentage: 15 },
    { range: '500-1K', count: 24, percentage: 30 },
    { range: '1K-1.5K', count: 18, percentage: 22 },
    { range: '1.5K-2K', count: 14, percentage: 18 },
    { range: '2K-2.5K', count: 8, percentage: 10 },
    { range: '2.5K+', count: 4, percentage: 5 }
  ];

  // 2. XP Distribution Timeline coordinates for SVG chart (accumulated XP over 6 months)
  const xpTimeline = [
    { month: 'Jan', val: 5400, x: 20, y: 140 },
    { month: 'Feb', val: 12800, x: 100, y: 110 },
    { month: 'Mar', val: 19500, x: 180, y: 85 },
    { month: 'Apr', val: 26400, x: 260, y: 65 },
    { month: 'May', val: 32000, x: 340, y: 45 },
    { month: 'Jun', val: 38450, x: 420, y: 20 }
  ];

  // 3. Lowest scoring modules ranking
  const lowestScoringModules = [
    { id: 'iam', name: 'AWS IAM Policy Logic', avgScore: 68, failRate: 32 },
    { id: 'vpc', name: 'Amazon VPC Subnets & Route Tables', avgScore: 71, failRate: 26 },
    { id: 'rds', name: 'Amazon RDS Multi-AZ Replication', avgScore: 74, failRate: 21 },
    { id: 'ec2', name: 'Amazon EC2 Security Groups', avgScore: 78, failRate: 15 }
  ];

  // 4. Most completed modules ranking
  const mostCompletedModules = [
    { id: 'fundamentals', name: 'AWS Global Infrastructure', completedCount: 112, avgTime: '12m' },
    { id: 'ec2', name: 'Amazon EC2 Instances', completedCount: 94, avgTime: '16m' },
    { id: 's3', name: 'Amazon S3 Bucket Storage', completedCount: 88, avgTime: '14m' },
    { id: 'iam', name: 'AWS IAM Credentials', completedCount: 76, avgTime: '21m' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight font-heading">
          Analytics & Insights
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Track class-wide completion curves, telemetry trends, and curriculum bottleneck markers.
        </p>
      </div>

      {/* Numerical Metrics HUD Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Enrollments', value: metrics.totalEnrollments, change: '+12% this week', icon: Icons.Users, trendColor: 'text-emerald-600' },
          { label: 'Avg Completion Rate', value: `${metrics.completionRate}%`, change: '+3.4% vs last term', icon: Icons.Activity, trendColor: 'text-emerald-600' },
          { label: 'Avg Quiz Score', value: `${metrics.averageQuizScore}%`, change: '+1.2% overall', icon: Icons.HelpCircle, trendColor: 'text-emerald-600' },
          { label: 'Distributed XP', value: metrics.totalXpDistributed.toLocaleString(), change: 'Accumulated total', icon: Icons.Zap, trendColor: 'text-cyan-600' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block font-heading">
                {item.label}
              </span>
              <span className="text-xl font-black text-slate-800 block">
                {item.value}
              </span>
              <span className={cn("text-[9px] font-extrabold block pt-0.5", item.trendColor)}>
                {item.change}
              </span>
            </div>
            <item.icon className="w-8 h-8 text-slate-400 opacity-40" />
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Progress Histogram (Responsive SVG/HTML) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Icons.BarChart2 className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 font-heading">
                Explorer XP Distribution Histogram
              </h3>
            </div>
            <span className="text-[9px] font-bold text-slate-400">
              XP Range (X) vs User Count (Y)
            </span>
          </div>

          {/* Histogram bar charts */}
          <div className="flex-1 flex flex-col justify-between min-h-[200px] text-xs pt-4 space-y-3.5 font-semibold">
            {histogramData.map((bar, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-14 text-slate-500 text-right font-bold font-mono">
                  {bar.range}
                </span>
                
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${bar.percentage}%` }}
                  />
                </div>

                <span className="w-10 text-slate-800 font-black">
                  {bar.count} ({bar.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Cumulative XP Accumulation over time (SVG Line chart) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Icons.TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 font-heading">
                XP Velocity Growth Curve
              </h3>
            </div>
            <span className="text-[9px] font-bold text-slate-400 font-mono">
              Jan - Jun 2026 Telemetry
            </span>
          </div>

          {/* SVG line draw */}
          <div className="flex-1 flex flex-col justify-center items-center min-h-[200px] pt-2">
            <svg viewBox="0 0 450 180" className="w-full h-full max-h-[160px] overflow-visible">
              <defs>
                {/* Under-line fade gradient */}
                <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Background lines */}
              <line x1="20" y1="20" x2="420" y2="20" stroke="#F1F5F9" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="20" y1="60" x2="420" y2="60" stroke="#F1F5F9" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="20" y1="100" x2="420" y2="100" stroke="#F1F5F9" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="20" y1="140" x2="420" y2="140" stroke="#F1F5F9" strokeWidth="0.8" strokeDasharray="3 3" />

              {/* Draw Area below the line */}
              <path
                d={`M 20,140 
                    L ${xpTimeline[0].x},${xpTimeline[0].y} 
                    L ${xpTimeline[1].x},${xpTimeline[1].y} 
                    L ${xpTimeline[2].x},${xpTimeline[2].y} 
                    L ${xpTimeline[3].x},${xpTimeline[3].y} 
                    L ${xpTimeline[4].x},${xpTimeline[4].y} 
                    L ${xpTimeline[5].x},${xpTimeline[5].y} 
                    L 420,160 
                    Z`}
                fill="url(#areaGrad)"
              />

              {/* Draw Curve Line */}
              <path
                d={`M ${xpTimeline[0].x},${xpTimeline[0].y} 
                    C ${xpTimeline[0].x + 30},${xpTimeline[0].y - 10} ${xpTimeline[1].x - 30},${xpTimeline[1].y + 10} ${xpTimeline[1].x},${xpTimeline[1].y}
                    C ${xpTimeline[1].x + 30},${xpTimeline[1].y - 10} ${xpTimeline[2].x - 30},${xpTimeline[2].y + 10} ${xpTimeline[2].x},${xpTimeline[2].y}
                    C ${xpTimeline[2].x + 30},${xpTimeline[2].y - 10} ${xpTimeline[3].x - 30},${xpTimeline[3].y + 10} ${xpTimeline[3].x},${xpTimeline[3].y}
                    C ${xpTimeline[3].x + 30},${xpTimeline[3].y - 10} ${xpTimeline[4].x - 30},${xpTimeline[4].y + 10} ${xpTimeline[4].x},${xpTimeline[4].y}
                    C ${xpTimeline[4].x + 30},${xpTimeline[4].y - 10} ${xpTimeline[5].x - 30},${xpTimeline[5].y + 10} ${xpTimeline[5].x},${xpTimeline[5].y}`}
                fill="none"
                stroke="#6366F1"
                strokeWidth="2.5"
              />

              {/* Dot Indicators */}
              {xpTimeline.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="4.5" fill="#FFFFFF" stroke="#6366F1" strokeWidth="2.5" />
                  {/* Floating tooltip labels */}
                  <text x={pt.x} y={pt.y - 12} fill="#4F46E5" fontSize="8.5" fontWeight="black" textAnchor="middle" fontFamily="monospace">
                    {(pt.val / 1000).toFixed(1)}k
                  </text>
                  <text x={pt.x} y="170" fill="#64748B" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {pt.month}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

      </div>

      {/* Bottlenecks vs Completions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Module Performance Grid (Lowest Scoring Modules) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Icons.AlertTriangle className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 font-heading">
                Lowest Scoring Modules (Assessment Bottlenecks)
              </h3>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs font-semibold">
            {lowestScoringModules.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-800 block">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase block font-heading">
                    ID Slug: {item.id}
                  </span>
                </div>
                
                <div className="text-right flex items-center gap-6">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-heading block">
                      Avg Score
                    </span>
                    <span className="text-rose-600 font-black block">
                      {item.avgScore}% Correct
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-heading block">
                      Fail rate
                    </span>
                    <span className="text-slate-605 font-black block">
                      {item.failRate}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Completed Modules Grid */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Icons.CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 font-heading">
                Most Completed Modules (Active Velocity)
              </h3>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs font-semibold">
            {mostCompletedModules.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-800 block">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase block font-heading">
                    ID Slug: {item.id}
                  </span>
                </div>

                <div className="text-right flex items-center gap-6">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-heading block">
                      Completions
                    </span>
                    <span className="text-emerald-600 font-black block">
                      {item.completedCount} Users
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-heading block">
                      Avg Duration
                    </span>
                    <span className="text-slate-605 font-black block">
                      {item.avgTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
