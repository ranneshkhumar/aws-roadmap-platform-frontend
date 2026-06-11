'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useRoadmapStore } from '@/store/roadmapStore';
import { cn } from '@/lib/utils';

interface RoadmapProgressUpdaterProps {
  className?: string;
  showReset?: boolean;
  xp?: number;
  streak?: number;
  modules?: any[];
  moduleStates?: Record<string, 'completed' | 'current' | 'locked'>;
}

export const RoadmapProgressUpdater: React.FC<RoadmapProgressUpdaterProps> = ({
  className,
  showReset = true,
  xp: propXp,
  streak: propStreak,
  modules: propModules,
  moduleStates: propModuleStates
}) => {
  const store = useRoadmapStore();
  const xp = propXp !== undefined ? propXp : store.xp;
  const streak = propStreak !== undefined ? propStreak : store.streak;
  const modules = propModules !== undefined ? propModules : store.modules;
  const moduleStates = propModuleStates !== undefined ? propModuleStates : store.moduleStates;
  
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const completedCount = modules.filter((m) => moduleStates[m.id] === 'completed').length;
  const totalCount = modules.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleReset = () => {
    store.resetProgress();
    setShowConfirmReset(false);
    // Reload page to reset internal react states
    window.location.reload();
  };

  return (
    <div className={cn("bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-heading">
            ROADMAP PROGRESS
          </span>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
            Explorer Stats
          </h3>
        </div>
        
        {/* Streak element */}
        <div className="flex items-center gap-1 text-orange-600 bg-orange-50 border border-orange-200/50 px-2.5 py-1 rounded-full text-xs font-bold font-heading">
          <Icons.Flame className="w-4 h-4 fill-current animate-pulse" />
          <span>{streak} Days</span>
        </div>
      </div>

      {/* Progress metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Icons.CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-slate-450 uppercase block">Completed</span>
            <span className="text-sm font-black text-slate-800">
              {completedCount} / {totalCount}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Icons.Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-slate-450 uppercase block">XP Score</span>
            <span className="text-sm font-black text-slate-800">
              {xp} XP
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Overall Completion</span>
          <span className="text-emerald-700">{percentage}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Developer Reset actions */}
      {showReset && (
        <div className="pt-2 border-t border-slate-100">
          {!showConfirmReset ? (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 transition-all"
            >
              <Icons.RotateCcw className="w-3 h-3" />
              Reset Journey Progress
            </button>
          ) : (
            <div className="flex items-center justify-between bg-rose-50 border border-rose-100 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-rose-800">Are you sure?</span>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] px-2.5 py-1 rounded-lg shadow-sm"
                >
                  Yes, Reset
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="bg-white border border-slate-200 text-slate-600 font-bold text-[9px] px-2.5 py-1 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
