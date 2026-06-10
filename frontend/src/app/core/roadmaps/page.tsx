'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRoadmapStore } from '@/store/roadmapStore';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

// Import high-fidelity visual assets
import { SkyBackground } from '@/components/Roadmap/SkyBackground';
import { RoadmapPath } from '@/components/Roadmap/RoadmapPath';
import { CloudIslandNode } from '@/components/Roadmap/CloudIslandNode';
import { BeginnerSummitLandmark, IntermediateSummitLandmark, CloudArchitectSummitLandmark } from '@/components/Roadmap/MilestoneLandmark';
import { IntermediateCloudsOverlay } from '@/components/Roadmap/IntermediateCloudsOverlay';
import { AdvancedCloudsOverlay } from '@/components/Roadmap/AdvancedCloudsOverlay';

const CANVAS_WIDTH = 900;

// Custom compact geometry calculation for CMS preview
const calculateCompactRoadmapGeometry = (modulesList: any[]) => {
  const coordinates: { [key: string]: { x: number; y: number } } = {};
  
  const beginnerList = modulesList.filter((m) => m.level === 'Beginner');
  const intermediateList = modulesList.filter((m) => m.level === 'Intermediate');
  const advancedList = modulesList.filter((m) => m.level === 'Advanced');
  
  const WAVE_X_PATTERN = [32, 58, 76, 62, 38, 25];
  
  // 1. Beginner Region (y starts at 100)
  let currentY = 100;
  beginnerList.forEach((mod, idx) => {
    coordinates[mod.id] = {
      x: WAVE_X_PATTERN[idx % WAVE_X_PATTERN.length],
      y: currentY
    };
    currentY += 135;
  });
  coordinates['summit_beginner'] = { x: 50, y: currentY };
  
  // 2. Intermediate Region
  currentY += 180;
  const startIntermediateY = currentY;
  intermediateList.forEach((mod, idx) => {
    coordinates[mod.id] = {
      x: WAVE_X_PATTERN[(idx + 1) % WAVE_X_PATTERN.length],
      y: currentY
    };
    currentY += 135;
  });
  coordinates['summit_intermediate'] = { x: 50, y: currentY };
  
  // 3. Advanced Region
  currentY += 180;
  const startAdvancedY = currentY;
  advancedList.forEach((mod, idx) => {
    coordinates[mod.id] = {
      x: WAVE_X_PATTERN[(idx + 2) % WAVE_X_PATTERN.length],
      y: currentY
    };
    currentY += 135;
  });
  coordinates['summit_advanced'] = { x: 50, y: currentY };
  
  return {
    coordinates,
    totalHeight: currentY + 120,
    intermediateStartY: startIntermediateY - 90,
    intermediateHeight: startAdvancedY - startIntermediateY + 60,
    advancedStartY: startAdvancedY - 90,
    advancedHeight: currentY - startAdvancedY + 60,
  };
};

export default function RoadmapsBuilderPage() {
  const router = useRouter();
  const {
    modules,
    addModule,
    updateModule,
    deleteModule,
    duplicateModule,
    reorderModule
  } = useRoadmapStore();

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for creating a module
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [estimatedTime, setEstimatedTime] = useState('20 Minutes');
  const [points, setPoints] = useState(50);

  // Preview panel sizing & scaling states
  const centerRef = useRef<HTMLDivElement>(null);
  const [centerSize, setCenterSize] = useState({ w: 700, h: 500 });

  // Auto-select first module
  useEffect(() => {
    if (modules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  // Measure preview canvas container size
  useEffect(() => {
    const el = centerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setCenterSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const selectedModule = modules.find((m) => m.id === selectedModuleId) || null;

  const beginnerList = modules.filter((m) => m.level === 'Beginner');
  const intermediateList = modules.filter((m) => m.level === 'Intermediate');
  const advancedList = modules.filter((m) => m.level === 'Advanced');

  // Compute compact preview geometry
  const {
    coordinates,
    totalHeight,
    intermediateStartY,
    intermediateHeight,
    advancedStartY,
    advancedHeight
  } = calculateCompactRoadmapGeometry(modules);

  const canvasHeight = totalHeight + 100;
  // Fit width to the preview container
  const scaleX = centerSize.w / CANVAS_WIDTH;
  const fitScale = Math.min(scaleX, 0.95);

  const visualNodesList = [
    ...beginnerList.map((m) => ({ ...m, type: 'module' as const })),
    { id: 'summit_beginner', name: 'Beginner Summit', level: 'Beginner' as const, type: 'summit' as const },
    ...intermediateList.map((m) => ({ ...m, type: 'module' as const })),
    { id: 'summit_intermediate', name: 'Intermediate Summit', level: 'Intermediate' as const, type: 'summit' as const },
    ...advancedList.map((m) => ({ ...m, type: 'module' as const })),
    { id: 'summit_advanced', name: 'Cloud Architect Summit', level: 'Advanced' as const, type: 'summit' as const }
  ];

  const pathNodes = visualNodesList.map((node) => {
    const coord = coordinates[node.id] || { x: 50, y: 150 };
    return { id: node.id, x: coord.x, y: coord.y, status: 'completed' as const };
  });

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addModule(name, description, level, estimatedTime, points);
    
    const baseId = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    let finalId = baseId || 'module';
    let counter = 1;
    while (modules.some((m) => m.id === finalId)) {
      finalId = `${baseId}_${counter}`;
      counter++;
    }
    
    setSelectedModuleId(finalId);
    setName('');
    setDescription('');
    setLevel('Beginner');
    setEstimatedTime('20 Minutes');
    setPoints(50);
    setIsCreateModalOpen(false);
  };

  const handleDeleteModule = () => {
    if (!selectedModule) return;
    if (confirm(`Delete "${selectedModule.name}"? This removes its island, slides, and quiz.`)) {
      const remaining = modules.filter((m) => m.id !== selectedModule.id);
      deleteModule(selectedModule.id);
      setSelectedModuleId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleDuplicateModule = () => {
    if (!selectedModule) return;
    duplicateModule(selectedModule.id);
  };

  const currentTierModules = selectedModule ? modules.filter((m) => m.level === selectedModule.level) : [];
  const tierIndex = selectedModule ? currentTierModules.findIndex((m) => m.id === selectedModule.id) : -1;
  const isFirstInTier = tierIndex === 0;
  const isLastInTier = tierIndex === currentTierModules.length - 1;

  const backgroundGradient = 'linear-gradient(to bottom, #bae6fd 0%, #e0f2fe 20%, #ffffff 40%, #e0f2fe 100%)';

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
      {/* ═══════════════ HEADER ROW (Visual Roadmap CMS) ═══════════════ */}
      <header className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0 select-none">
        <div className="flex items-center gap-3">
          <Link
            href="/core/learners"
            className="flex items-center gap-2 px-4.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-700 transition-all shadow-xs font-heading"
          >
            <Icons.Users className="w-4 h-4 text-indigo-600" />
            <span>Learners Directory</span>
          </Link>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-wider font-heading"
          >
            <Icons.LogOut className="w-3 h-3 rotate-180" />
            Exit
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#00cba9] hover:bg-[#00bda0] text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5 font-heading"
          >
            <Icons.Plus className="w-4 h-4 stroke-[3]" />
            Create Module
          </button>
        </div>
      </header>

      {/* ═══════════════ TWO-COLUMN WORKPANE ═══════════════ */}
      <div className="flex-1 flex min-h-0 overflow-hidden p-6 gap-6">
        
        {/* Left Column (72%): Live Preview Canvas */}
        <div className="w-[72%] bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-xs h-full flex flex-col">
          {/* Header tab badge */}
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
            <span className="text-[9px] font-black tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-lg font-heading">
              LIVE PREVIEW CANVAS
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              {modules.length} Modules Registered
            </span>
          </div>

          {/* Internally scrollable canvas viewport */}
          <div
            ref={centerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-50 rounded-b-[32px]"
          >
            {/* Scaled canvas */}
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{
                transform: `scale(${fitScale})`,
                width: CANVAS_WIDTH,
                height: canvasHeight,
                background: backgroundGradient,
              }}
            >
              <SkyBackground />

              <div className="relative w-full z-10" style={{ height: totalHeight }}>
                {/* Connection lines path */}
                <RoadmapPath nodes={pathNodes} width={CANVAS_WIDTH} />

                {/* Level 1 Beginner Header Info Box */}
                <div className="absolute left-[30px] top-[40px] z-20 pointer-events-none">
                  <div className="w-[220px] border rounded-[22px] bg-white/95 border-slate-200 shadow-sm text-slate-800 p-4">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-heading">
                      LEVEL 1
                    </span>
                    <h3 className="text-xs font-black tracking-tight mt-0.5 font-heading text-slate-900">
                      Beginner Track
                    </h3>
                    <p className="text-[9px] font-bold text-slate-450 mt-0.5">
                      {beginnerList.length} Modules Registered
                    </p>
                    <p className="text-[10px] leading-snug mt-1.5 font-medium text-slate-500">
                      Foundations of cloud computing and initial AWS core services.
                    </p>
                  </div>
                </div>

                {/* START HERE banner on first Beginner module */}
                {coordinates[beginnerList[0]?.id] && (
                  <div
                    className="absolute z-30 flex flex-col items-center pointer-events-none"
                    style={{
                      left: `calc(${coordinates[beginnerList[0].id].x}% - 60px)`,
                      top: `${coordinates[beginnerList[0].id].y - 80}px`
                    }}
                  >
                    <div className="bg-[#0dce88] text-slate-950 font-black text-[9px] px-3 py-1 rounded-full border border-white tracking-widest shadow-md flex items-center gap-1 font-heading">
                      START HERE
                    </div>
                    <div className="w-0.5 h-8 bg-rose-500 relative">
                      <div className="absolute top-0 right-0 w-2.5 h-2 bg-rose-500 rounded-sm" />
                    </div>
                  </div>
                )}

                {/* Level 2 Intermediate Header Info Box */}
                <div
                  className="absolute left-[30px] z-20 pointer-events-none"
                  style={{ top: `${intermediateStartY - 110}px` }}
                >
                  <div className="w-[220px] border rounded-[22px] bg-white/95 border-slate-200 shadow-sm text-slate-800 p-4">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-heading">
                      LEVEL 2
                    </span>
                    <h3 className="text-xs font-black tracking-tight mt-0.5 font-heading text-slate-900">
                      Intermediate Track
                    </h3>
                    <p className="text-[9px] font-bold text-slate-450 mt-0.5">
                      {intermediateList.length} Modules Registered
                    </p>
                    <p className="text-[10px] leading-snug mt-1.5 font-medium text-slate-500">
                      Complex databases, auto-scaling clusters, and core IAM security schemas.
                    </p>
                  </div>
                </div>

                {/* Level 3 Advanced Header Info Box */}
                <div
                  className="absolute left-[30px] z-20 pointer-events-none"
                  style={{ top: `${advancedStartY - 120}px` }}
                >
                  <div className="w-[220px] border rounded-[22px] bg-white/95 border-slate-200 shadow-sm text-slate-800 p-4">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-heading">
                      LEVEL 3
                    </span>
                    <h3 className="text-xs font-black tracking-tight mt-0.5 font-heading text-slate-900">
                      Advanced Track
                    </h3>
                    <p className="text-[9px] font-bold text-slate-450 mt-0.5">
                      {advancedList.length} Modules Registered
                    </p>
                    <p className="text-[10px] leading-snug mt-1.5 font-medium text-slate-500">
                      Distributed architectures, ECS container clusters, and analytics engines.
                    </p>
                  </div>
                </div>

                {/* Summits */}
                {coordinates['summit_beginner'] && (
                  <BeginnerSummitLandmark x={coordinates['summit_beginner'].x} y={coordinates['summit_beginner'].y} locked={false} />
                )}
                {coordinates['summit_intermediate'] && (
                  <IntermediateSummitLandmark x={coordinates['summit_intermediate'].x} y={coordinates['summit_intermediate'].y} locked={false} />
                )}
                {coordinates['summit_advanced'] && (
                  <CloudArchitectSummitLandmark x={coordinates['summit_advanced'].x} y={coordinates['summit_advanced'].y} locked={false} />
                )}

                {/* Cloud Overlays */}
                <IntermediateCloudsOverlay locked={false} top={intermediateStartY} height={intermediateHeight} />
                <AdvancedCloudsOverlay locked={false} top={advancedStartY} height={advancedHeight} />

                {/* Cloud Island Nodes */}
                {modules.map((module, idx) => {
                  const coord = coordinates[module.id];
                  if (!coord) return null;
                  return (
                    <CloudIslandNode
                      key={module.id}
                      id={module.id}
                      name={module.name}
                      points={module.points}
                      status={selectedModuleId === module.id ? 'current' : 'completed'}
                      iconName={module.iconName || 'Boxes'}
                      x={coord.x}
                      y={coord.y}
                      index={idx}
                      onClick={() => setSelectedModuleId(module.id)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (28%): Module Settings sidebar */}
        <div className="w-[28%] bg-white border border-slate-200 rounded-[32px] shadow-xs h-full flex flex-col overflow-hidden">
          {selectedModule ? (
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Icons.Settings className="w-4 h-4 text-cyan-600" />
                  <h3 className="text-xs font-black text-slate-800 tracking-tight font-heading uppercase">
                    Module Settings
                  </h3>
                </div>
                <span className="text-[9px] font-black font-heading text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  {selectedModule.id.slice(0, 5).toUpperCase()}
                </span>
              </div>

              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-semibold text-slate-655">
                
                {/* Module Name */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Module Name</label>
                  <input
                    type="text"
                    value={selectedModule.name}
                    onChange={(e) => updateModule(selectedModule.id, { name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Description</label>
                  <textarea
                    rows={3}
                    value={selectedModule.description}
                    onChange={(e) => updateModule(selectedModule.id, { description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* XP & Time Inline */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">XP Points</label>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      value={selectedModule.points}
                      onChange={(e) => updateModule(selectedModule.id, { points: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Estimated Time</label>
                    <input
                      type="text"
                      value={selectedModule.estimatedTime}
                      onChange={(e) => updateModule(selectedModule.id, { estimatedTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Tier Selection */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Curriculum Tier</label>
                  <div className="relative">
                    <select
                      value={selectedModule.level}
                      onChange={(e) => updateModule(selectedModule.id, { level: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none font-bold"
                    >
                      <option value="Beginner">Beginner Level</option>
                      <option value="Intermediate">Intermediate Level</option>
                      <option value="Advanced">Advanced Level</option>
                    </select>
                    <Icons.ChevronDown className="absolute right-3.5 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Path Order Controls */}
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <label className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider block">Path Order Control</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => reorderModule(selectedModule.id, 'up')}
                      disabled={isFirstInTier}
                      className={cn(
                        "py-2 rounded-xl border font-bold flex items-center justify-center gap-1 transition-all text-[11px]",
                        isFirstInTier
                          ? "bg-slate-50 border-slate-200/50 text-slate-400 cursor-not-allowed"
                          : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 shadow-xs"
                      )}
                    >
                      <Icons.ArrowUp className="w-3.5 h-3.5" />
                      Move Up
                    </button>
                    <button
                      onClick={() => reorderModule(selectedModule.id, 'down')}
                      disabled={isLastInTier}
                      className={cn(
                        "py-2 rounded-xl border font-bold flex items-center justify-center gap-1 transition-all text-[11px]",
                        isLastInTier
                          ? "bg-slate-50 border-slate-200/50 text-slate-400 cursor-not-allowed"
                          : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 shadow-xs"
                      )}
                    >
                      <Icons.ArrowDown className="w-3.5 h-3.5" />
                      Move Down
                    </button>
                  </div>
                </div>

                {/* Edit content & quiz buttons */}
                <div className="space-y-2 border-t border-slate-100 pt-3.5">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/core/module/${selectedModule.id}/content`}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-black text-slate-700 py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <Icons.FileText className="w-3.5 h-3.5 text-cyan-600" />
                      Edit Slides
                    </Link>
                    <Link
                      href={`/core/module/${selectedModule.id}/quiz`}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-black text-slate-700 py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <Icons.HelpCircle className="w-3.5 h-3.5 text-cyan-600" />
                      Edit Quiz
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDuplicateModule}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-black text-slate-600 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <Icons.Copy className="w-3.5 h-3.5" />
                      Duplicate
                    </button>
                    <button
                      onClick={handleDeleteModule}
                      className="bg-rose-50 hover:bg-rose-100 border border-rose-100 text-[11px] font-black text-rose-600 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <Icons.Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                <Icons.Map className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">No Module Selected</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
                  Select a module from the canvas preview to configure settings.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ═══════════════ CREATE MODULE MODAL ═══════════════ */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl relative text-slate-800"
            >
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <Icons.X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-black text-slate-900 font-heading tracking-tight mb-1">
                Create Learning Module
              </h3>
              <p className="text-[10px] text-slate-550 mb-5 leading-normal">
                Register a new module to automatically generate a cloud island on the preview canvas.
              </p>

              <form onSubmit={handleCreateModule} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 block">Module Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon CloudFront CDN"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-550 block">Description</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Provide module objectives overview..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-550 block">Curriculum Level</label>
                    <div className="relative">
                      <select
                        value={level}
                        onChange={(e: any) => setLevel(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none font-bold"
                      >
                        <option value="Beginner">Beginner Level</option>
                        <option value="Intermediate">Intermediate Level</option>
                        <option value="Advanced">Advanced Level</option>
                      </select>
                      <Icons.ChevronDown className="absolute right-3.5 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-550 block">Estimated Time</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 20 Minutes"
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-550 block">XP Reward Points</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={500}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 mt-5">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="bg-transparent hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold px-4 py-2.5 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#00cba9] hover:bg-[#00bda0] text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-lg transition-all"
                  >
                    Register Module
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
