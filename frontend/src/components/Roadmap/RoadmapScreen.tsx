'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { SkyBackground } from './SkyBackground';
import { RoadmapPath, PathNode } from './RoadmapPath';
import { CloudIslandNode } from './CloudIslandNode';
import { MissionDetailsDrawer } from './MissionDetailsDrawer';
import { BeginnerSummitLandmark, IntermediateSummitLandmark, CloudArchitectSummitLandmark } from './MilestoneLandmark';
import { IntermediateCloudsOverlay } from './IntermediateCloudsOverlay';
import { AdvancedCloudsOverlay } from './AdvancedCloudsOverlay';
import { RoadmapProgressUpdater } from './RoadmapProgressUpdater';
import { useRoadmapStore } from '@/store/roadmapStore';
import { calculateRoadmapGeometry } from '@/lib/roadmapGeometry';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const LevelIslandHeader: React.FC<{
  number: string;
  title: string;
  completed: number;
  total: number;
  description: string;
  levelColor: 'beginner' | 'intermediate' | 'advanced';
  locked: boolean;
}> = ({ number, title, completed, total, description, levelColor, locked }) => {
  const containerClasses = cn(
    "w-[260px] border transition-all duration-300 select-none rounded-[22px]",
    !locked
      ? "gradient-container border-slate-200/50 shadow-md hover:shadow-xl hover:-translate-y-0.5 text-slate-800"
      : levelColor === 'intermediate'
        ? "bg-slate-700/70 border-slate-600/50 shadow-none text-slate-350"
        : "bg-slate-900/80 border-slate-800/50 shadow-none text-slate-400"
  );

  return (
    <div className={containerClasses}>
      <div className={cn(locked ? "p-5" : "gradient-overlay p-5")}>
        <div className="relative z-10 flex flex-col">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest block font-heading",
            !locked ? "text-slate-500" : "text-slate-400"
          )}>
            LEVEL {number}
          </span>
          <h2 className={cn(
            "text-base font-black leading-tight mt-0.5 tracking-tight font-heading",
            !locked ? "text-slate-950" : "text-slate-100"
          )}>
            {title}
          </h2>
          <span className={cn(
            "text-[10px] font-bold mt-1 font-heading",
            !locked ? "text-slate-650" : "text-slate-400"
          )}>
            {completed} / {total} Completed
          </span>
          <p className={cn(
            "text-[11px] leading-snug mt-2 font-medium",
            !locked ? "text-slate-650" : "text-slate-300"
          )}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

interface VisualNode {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  type: 'module' | 'summit';
  points?: number;
  iconName?: string;
}

export const RoadmapScreen: React.FC = () => {
  const router = useRouter();
  const { modules, moduleStates, xp, streak } = useRoadmapStore();

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [boardWidth, setBoardWidth] = useState(1000);
  const [activeTab, setActiveTab] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Viewport refs for scrolling and path rendering
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Measure dynamic geometry based on store modules list
  const {
    coordinates,
    totalHeight,
    intermediateStartY,
    intermediateHeight,
    advancedStartY,
    advancedHeight
  } = calculateRoadmapGeometry(modules);

  // Resize handler to measure container width
  useEffect(() => {
    if (!boardRef.current) return;
    const handleResize = () => {
      setBoardWidth(boardRef.current?.offsetWidth || 1000);
    };
    
    handleResize();
    
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (boardRef.current) {
      resizeObserver.observe(boardRef.current);
    }
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  // Split modules list by level dynamically
  const beginnerList = modules.filter((m) => m.level === 'Beginner');
  const intermediateList = modules.filter((m) => m.level === 'Intermediate');
  const advancedList = modules.filter((m) => m.level === 'Advanced');

  // Check completions of each region to unlock milestones
  const beginnerCompleted = beginnerList.filter((m) => moduleStates[m.id] === 'completed').length;
  const intermediateCompleted = intermediateList.filter((m) => moduleStates[m.id] === 'completed').length;
  const advancedCompleted = advancedList.filter((m) => moduleStates[m.id] === 'completed').length;
  const totalCompleted = modules.filter((m) => moduleStates[m.id] === 'completed').length;

  const isIntermediateLocked = beginnerCompleted < beginnerList.length;
  const isAdvancedLocked = intermediateCompleted < intermediateList.length;

  let backgroundGradient = '';
  if (isIntermediateLocked && isAdvancedLocked) {
    backgroundGradient = 'linear-gradient(to bottom, #bae6fd 0%, #e0f2fe 20%, #ffffff 25%, #5a6578 38%, #202735 48%, #1b202e 65%, #05070a 80%, #000000 100%)';
  } else if (isAdvancedLocked) {
    backgroundGradient = 'linear-gradient(to bottom, #bae6fd 0%, #e0f2fe 20%, #ffffff 30%, #f0f9ff 45%, #ffffff 58%, #1f2430 68%, #05070a 76%, #000000 100%)';
  } else {
    backgroundGradient = 'linear-gradient(to bottom, #bae6fd 0%, #e0f2fe 20%, #ffffff 40%, #f0f9ff 70%, #e0f2fe 100%)';
  }

  // Build visual node list
  const visualNodesList: VisualNode[] = [
    ...beginnerList.map((m) => ({ ...m, type: 'module' as const })),
    { id: 'summit_beginner', name: 'Beginner Summit', level: 'Beginner' as const, type: 'summit' as const },
    ...intermediateList.map((m) => ({ ...m, type: 'module' as const })),
    { id: 'summit_intermediate', name: 'Intermediate Summit', level: 'Intermediate' as const, type: 'summit' as const },
    ...advancedList.map((m) => ({ ...m, type: 'module' as const })),
    { id: 'summit_advanced', name: 'Cloud Architect Summit', level: 'Advanced' as const, type: 'summit' as const }
  ];

  // Map coordinates and statuses for paths
  const pathNodes: PathNode[] = visualNodesList.map((node) => {
    const coord = coordinates[node.id] || { x: 50, y: 200 };
    const nodeStatus = node.type === 'summit'
      ? (node.id === 'summit_beginner'
        ? (beginnerCompleted === beginnerList.length ? 'completed' as const : 'locked' as const)
        : node.id === 'summit_intermediate'
          ? (intermediateCompleted === intermediateList.length ? 'completed' as const : 'locked' as const)
          : (totalCompleted === modules.length ? 'completed' as const : 'locked' as const))
      : (moduleStates[node.id] || 'locked');

    return {
      id: node.id,
      x: coord.x,
      y: coord.y,
      status: nodeStatus,
    };
  });

  // Scroll to active node or beginner on mount
  useEffect(() => {
    if (!mapContainerRef.current || modules.length === 0) return;
    const activeNode = modules.find((m) => moduleStates[m.id] === 'current') || modules[0];
    const activeCoord = coordinates[activeNode.id];
    if (activeCoord && mapContainerRef.current) {
      const scrollPos = activeCoord.y - window.innerHeight / 2 + 200;
      mapContainerRef.current.scrollTop = Math.max(0, scrollPos);
    }
  }, [moduleStates, modules, coordinates]);

  const selectedModule = modules.find((m) => m.id === selectedModuleId) || null;
  const activeNode = modules.find((m) => moduleStates[m.id] === 'current') || modules[0] || { id: '', name: 'Start', level: 'Beginner', points: 50 };

  useEffect(() => {
    if (activeNode) {
      setActiveTab(activeNode.level.toLowerCase() as 'beginner' | 'intermediate' | 'advanced');
    }
  }, [activeNode]);

  const isActiveBeginner = activeTab === 'beginner';
  const isActiveIntermediate = activeTab === 'intermediate';
  const isActiveAdvanced = activeTab === 'advanced';

  // Ambient Particles definition for sky depth
  const particles = [
    { id: 'p1', left: '15%', top: '350px', duration: 18, delay: 0 },
    { id: 'p2', left: '80%', top: '750px', duration: 25, delay: 2 },
    { id: 'p3', left: '20%', top: '1250px', duration: 21, delay: 1 },
    { id: 'p4', left: '75%', top: '1750px', duration: 29, delay: 3 },
    { id: 'p5', left: '25%', top: '2200px', duration: 23, delay: 0.5 },
    { id: 'p6', left: '85%', top: '2500px', duration: 27, delay: 1.5 },
  ];

  // Drifting foreground clouds (above nodes, z-35) for parallax effect
  const fgClouds = [
    { id: 'fg-c1', top: '350px', width: 280, duration: 48, direction: 1, blur: 'blur-xs' },
    { id: 'fg-c2', top: '980px', width: 340, duration: 58, direction: -1, blur: 'blur-sm' },
    { id: 'fg-c3', top: '1620px', width: 300, duration: 52, direction: 1, blur: 'blur-xs' },
    { id: 'fg-c4', top: '2250px', width: 370, duration: 62, direction: -1, blur: 'blur-md' },
  ];

  // Dynamic values for intermediate / advanced card positioning
  const intermediateCardTop = intermediateStartY - 140;
  const advancedCardTop = advancedStartY - 160;

  return (
    <div className="flex-1 flex flex-col h-screen w-screen relative overflow-hidden select-none font-sans text-slate-800 bg-transparent">
      
      {/* 1. FIXED TOP HEADER PANEL (Matches screenshot) */}
      <header className="absolute top-4 left-6 right-6 z-50 bg-white/95 border border-slate-200/50 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-md w-auto pointer-events-auto">
        {/* Left Side: Current Mission Info */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Green circle with > icon */}
          <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Icons.ChevronRight className="w-6 h-6 stroke-[3]" />
          </div>
          <div className="flex flex-col text-slate-800">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-heading">
              CONTINUE YOUR JOURNEY
            </span>
            <span className="text-base font-black text-slate-900 block leading-tight font-heading mt-0.5 animate-pulse">
              Current Mission: {activeNode.name}
            </span>
            <div className="flex items-center gap-3 mt-1 text-[11px] font-extrabold text-slate-500">
              <span className="flex items-center gap-1 text-emerald-650">
                <Icons.Layers className="w-3.5 h-3.5" /> Level: {activeNode.level}
              </span>
              <span className="text-slate-200">|</span>
              <span className="flex items-center gap-1 text-cyan-600">
                <Icons.CheckCircle2 className="w-3.5 h-3.5" /> Progress: {totalCompleted} / {modules.length} Modules
              </span>
              <span className="text-slate-200">|</span>
              <span className="flex items-center gap-1 text-amber-600">
                <Icons.Award className="w-3.5 h-3.5" /> Total XP: {xp} XP
              </span>
              <span className="text-slate-200">|</span>
              <span className="flex items-center gap-1 text-orange-650">
                <Icons.Flame className="w-3.5 h-3.5 text-orange-500 fill-current animate-pulse" /> {streak} Day Streak
              </span>
              <span className="text-slate-200">|</span>
              <Link 
                href="/core"
                className="flex items-center gap-1 text-indigo-650 hover:underline font-bold"
              >
                <Icons.Sliders className="w-3.5 h-3.5" /> CMS Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side: Reward & Resume */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          {/* Streak Badge */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <Icons.Flame className="w-5 h-5 text-orange-500 fill-current animate-pulse" />
            <div>
              <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider block font-heading">
                STREAK
              </span>
              <span className="text-xs font-black text-slate-850 block leading-tight">
                {streak} Days
              </span>
            </div>
          </div>

          {/* Total XP Badge */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <Icons.Trophy className="w-5 h-5 text-indigo-600 fill-current" />
            <div>
              <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider block font-heading">
                TOTAL SCORE
              </span>
              <span className="text-xs font-black text-slate-850 block leading-tight">
                {xp} XP
              </span>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <Icons.Zap className="w-5 h-5 text-amber-500 fill-current animate-pulse" />
            <div>
              <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider block font-heading">
                MISSION REWARD
              </span>
              <span className="text-xs font-black text-slate-850 block leading-tight">
                +{activeNode.points || 50} XP
              </span>
            </div>
          </div>

          <button 
            onClick={() => {
              // Scroll to active node
              const activeCoord = coordinates[activeNode.id];
              if (activeCoord && mapContainerRef.current) {
                const scrollPos = activeCoord.y - window.innerHeight / 2 + 200;
                mapContainerRef.current.scrollTo({ top: Math.max(0, scrollPos), behavior: 'smooth' });
              }
              // Open active node drawer
              setSelectedModuleId(activeNode.id);
              setIsDrawerOpen(true);
            }}
            className="bg-[#00cba9] hover:bg-[#00bda0] text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 tracking-wider font-heading"
          >
            Resume Learning
          </button>
        </div>
      </header>

      {/* 2. LEVEL NAVIGATION BADGES (PILLS) WITH PREMIUM GRADIENTS */}
      <div className="absolute top-[106px] left-0 right-0 z-40 flex justify-center gap-3 pointer-events-auto">
        <button 
          onClick={() => {
            if (mapContainerRef.current) {
              mapContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
            setActiveTab('beginner');
          }}
          className={cn(
            "flex items-center gap-1.5 px-6 py-2.5 rounded-full text-[11px] font-black tracking-wider transition-all duration-300 font-heading border border-white/40 hover:scale-105 active:scale-95 text-slate-900",
            isActiveBeginner 
              ? "shadow-[0_8px_25px_rgba(80,201,153,0.5),0_0_12px_rgba(80,201,153,0.25)] scale-105" 
              : "shadow-[0_4px_12px_rgba(0,0,0,0.06)] opacity-90"
          )}
          style={{
            background: 'linear-gradient(90deg, #50C999 0%, #7EE8A8 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <Icons.Cloud className="w-4 h-4 fill-current text-emerald-900" />
          BEGINNER LEVEL
        </button>

        <button 
          onClick={() => {
            if (mapContainerRef.current) {
              mapContainerRef.current.scrollTo({ top: intermediateStartY - 120, behavior: 'smooth' });
            }
            setActiveTab('intermediate');
          }}
          className={cn(
            "flex items-center gap-1.5 px-6 py-2.5 rounded-full text-[11px] font-black tracking-wider transition-all duration-300 font-heading border border-white/40 hover:scale-105 active:scale-95 text-slate-900",
            isActiveIntermediate 
              ? "shadow-[0_8px_25px_rgba(78,168,255,0.5),0_0_12px_rgba(110,247,255,0.25)] scale-105" 
              : "shadow-[0_4px_12px_rgba(0,0,0,0.06)] opacity-90"
          )}
          style={{
            background: 'linear-gradient(90deg, #6EF7FF 0%, #4EA8FF 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {isIntermediateLocked ? (
            <Icons.Lock className="w-4 h-4 text-blue-900" />
          ) : (
            <Icons.Zap className="w-4 h-4 fill-current text-blue-900" />
          )}
          INTERMEDIATE LEVEL
        </button>

        <button 
          onClick={() => {
            if (mapContainerRef.current) {
              mapContainerRef.current.scrollTo({ top: advancedStartY - 140, behavior: 'smooth' });
            }
            setActiveTab('advanced');
          }}
          className={cn(
            "flex items-center gap-1.5 px-6 py-2.5 rounded-full text-[11px] font-black tracking-wider transition-all duration-300 font-heading border border-white/40 hover:scale-105 active:scale-95 text-slate-900",
            isActiveAdvanced 
              ? "shadow-[0_8px_25px_rgba(243,179,68,0.5),0_0_12px_rgba(255,221,148,0.25)] scale-105" 
              : "shadow-[0_4px_12px_rgba(0,0,0,0.06)] opacity-90"
          )}
          style={{
            background: 'linear-gradient(90deg, #FFDD94 0%, #F3B344 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {isAdvancedLocked ? (
            <Icons.Lock className="w-4 h-4 text-amber-950" />
          ) : (
            <Icons.Trophy className="w-4 h-4 fill-current text-amber-950" />
          )}
          ADVANCED LEVEL
        </button>
      </div>

      {/* 3. SCROLLABLE ADVENTURE CANVAS CONTAINER */}
      <div 
        ref={mapContainerRef}
        className="w-full flex-1 overflow-y-auto overflow-x-hidden scrollbar-none relative z-10"
        style={{ background: backgroundGradient }}
      >
        {/* Animated Sky background */}
        <SkyBackground />

        {/* Board container shifted down to not collide with header at scroll top */}
        <div 
          ref={boardRef}
          className="relative w-full z-10 mt-[140px]"
          style={{ height: `${totalHeight}px` }}
        >
          {/* Connected Curves dynamic path generator */}
          <RoadmapPath nodes={pathNodes} width={boardWidth} />

          {/* Ambient Floating Sky Particles (z-18) */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute w-2 h-2 rounded-full bg-cyan-200/40 shadow-[0_0_8px_rgba(56,189,248,0.5)] pointer-events-none z-18"
              style={{ left: p.left, top: p.top }}
              animate={{
                x: [0, 35, -35, 0],
                y: [0, -90, -180, 0],
                opacity: [0.1, 0.75, 0.4, 0.1],
                scale: [0.8, 1.25, 0.9, 0.8]
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut'
              }}
            />
          ))}

          {/* Parallax Foreground Drifting Clouds (z-35) */}
          {fgClouds.map((cloud) => (
            <motion.div
              key={cloud.id}
              className={cn("absolute pointer-events-none z-35 text-white/25 select-none", cloud.blur)}
              style={{
                top: cloud.top,
                width: cloud.width,
              }}
              animate={{
                x: cloud.direction === 1 ? ['-30%', '110%'] : ['110%', '-30%'],
              }}
              transition={{
                duration: cloud.duration,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <svg viewBox="0 0 200 100" fill="currentColor">
                <path d="M 30,70 A 20,20 0 0,1 60,40 A 25,25 0 0,1 110,30 A 22,22 0 0,1 150,45 A 18,18 0 0,1 180,70 A 10,10 0 0,1 170,80 L 30,80 A 10,10 0 0,1 30,70 Z" />
              </svg>
            </motion.div>
          ))}

          {/* CANVAS REGION TITLE: LEVEL 1 BEGINNER */}
          <div className="absolute left-[20px] top-[40px] z-20">
            <LevelIslandHeader
              number="1"
              title="Beginner"
              completed={beginnerCompleted}
              total={beginnerList.length}
              description="Build your foundation and learn the core of AWS Cloud."
              levelColor="beginner"
              locked={false}
            />
          </div>

          {/* START HERE BADGE WITH FLAG */}
          {coordinates['fundamentals'] && (
            <div 
              className="absolute z-30 flex flex-col items-center"
              style={{
                left: `calc(${coordinates['fundamentals'].x}% - 60px)`,
                top: `${coordinates['fundamentals'].y - 80}px`
              }}
            >
              <div className="bg-[#0dce88] text-slate-950 font-black text-[9px] px-3 py-1 rounded-full border border-white tracking-widest shadow-[0_0_15px_rgba(13,206,136,0.3)] animate-pulse flex items-center gap-1 font-heading">
                START HERE
              </div>
              {/* Tiny red flag flagpost */}
              <div className="w-0.5 h-8 bg-rose-500 relative">
                <div className="absolute top-0 right-0 w-2.5 h-2 bg-rose-500 rounded-sm" />
              </div>
            </div>
          )}

          {/* CANVAS REGION TITLE: LEVEL 2 INTERMEDIATE */}
          <div 
            className="absolute left-[20px] z-20 transition-all duration-1000"
            style={{ top: `${intermediateCardTop}px` }}
          >
            <LevelIslandHeader
              number="2"
              title="Intermediate"
              completed={intermediateCompleted}
              total={intermediateList.length}
              description="Deepen your knowledge and build real-world cloud solutions."
              levelColor="intermediate"
              locked={isIntermediateLocked}
            />
          </div>

          {/* CANVAS REGION TITLE: LEVEL 3 ADVANCED */}
          <div 
            className="absolute left-[20px] z-20 transition-all duration-1000"
            style={{ top: `${advancedCardTop}px` }}
          >
            <LevelIslandHeader
              number="3"
              title="Advanced"
              completed={advancedCompleted}
              total={advancedList.length}
              description="Master advanced services and become a cloud architect."
              levelColor="advanced"
              locked={isAdvancedLocked}
            />
          </div>

          {/* RENDER SUMMITS & CASTLE LANDMARKS */}
          
          {/* Beginner Summit */}
          {coordinates['summit_beginner'] && (
            <BeginnerSummitLandmark 
              x={coordinates['summit_beginner'].x} 
              y={coordinates['summit_beginner'].y} 
              locked={isIntermediateLocked} 
            />
          )}

          {/* Intermediate Summit */}
          {coordinates['summit_intermediate'] && (
            <IntermediateSummitLandmark 
              x={coordinates['summit_intermediate'].x} 
              y={coordinates['summit_intermediate'].y} 
              locked={isAdvancedLocked} 
            />
          )}

          {/* Intermediate region cloud cover overlay */}
          <IntermediateCloudsOverlay 
            locked={isIntermediateLocked} 
            top={intermediateStartY} 
            height={intermediateHeight} 
          />

          {/* Advanced region cloud cover overlay */}
          <AdvancedCloudsOverlay 
            locked={isAdvancedLocked} 
            top={advancedStartY} 
            height={advancedHeight} 
          />

          {/* Advanced Castle Summit */}
          {coordinates['summit_advanced'] && (
            <CloudArchitectSummitLandmark 
              x={coordinates['summit_advanced'].x} 
              y={coordinates['summit_advanced'].y} 
              locked={totalCompleted < modules.length} 
            />
          )}

          {/* RENDER ISLAND NODES */}
          {modules.map((module, idx) => {
            const coord = coordinates[module.id];
            if (!coord) return null;
            const status = moduleStates[module.id] || 'locked';

            return (
              <CloudIslandNode
                key={module.id}
                id={module.id}
                name={module.name}
                points={module.points}
                status={status}
                iconName={module.iconName}
                x={coord.x}
                y={coord.y}
                index={idx}
                onClick={() => {
                  setSelectedModuleId(module.id);
                  setIsDrawerOpen(true);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Dynamic slide drawer */}
      <MissionDetailsDrawer
        module={selectedModule}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        status={selectedModuleId ? moduleStates[selectedModuleId] : 'locked'}
      />

      {/* Collapsible Stats Dashboard */}
      <div className="fixed bottom-6 left-6 z-40 pointer-events-auto">
        <button
          onClick={() => setIsStatsOpen(!isStatsOpen)}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-xs px-4.5 py-3 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center gap-2 font-heading"
        >
          <Icons.BarChart2 className="w-4 h-4 text-emerald-650" />
          {isStatsOpen ? 'Hide Stats' : 'View Stats'}
        </button>
        
        <AnimatePresence>
          {isStatsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-16 left-0 w-80 mt-2"
            >
              <RoadmapProgressUpdater showReset={true} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
