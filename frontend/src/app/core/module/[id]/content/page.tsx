'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useRoadmapStore } from '@/store/roadmapStore';
import { LearningContentRenderer } from '@/components/Roadmap/LearningContentRenderer';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ContentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;
  const { modules, updateModule } = useRoadmapStore();

  const module = modules.find((m) => m.id === moduleId);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Redirect if module not found
  useEffect(() => {
    if (!module) {
      router.push('/core/roadmaps');
    }
  }, [module, router]);

  if (!module) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        Loading module content editor...
      </div>
    );
  }

  const slides = module.learningContent || [];
  const activeSlide = slides[activeSlideIndex] || slides[0] || null;

  const updateSlides = (updatedSlides: typeof slides) => {
    updateModule(moduleId, { learningContent: updatedSlides });
  };

  // Add Slide
  const handleAddSlide = () => {
    const newSlide = {
      title: 'New Cloud Concept',
      content: ['Introduce your first cloud concept bullet point here.'],
      layoutType: 'text-only' as const
    };
    updateSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  // Duplicate Slide
  const handleDuplicateSlide = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const slideToDuplicate = slides[idx];
    const duplicatedSlide = {
      ...slideToDuplicate,
      title: `${slideToDuplicate.title} Copy`,
      content: [...slideToDuplicate.content],
    };
    const updated = [...slides];
    updated.splice(idx + 1, 0, duplicatedSlide);
    updateSlides(updated);
    setActiveSlideIndex(idx + 1);
  };

  // Delete Slide
  const handleDeleteSlide = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return;
    const updated = slides.filter((_, i) => i !== idx);
    updateSlides(updated);
    setActiveSlideIndex(Math.max(0, idx - 1));
  };

  // Move Slide
  const handleMoveSlide = (idx: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'up' && idx > 0) {
      const updated = [...slides];
      const temp = updated[idx];
      updated[idx] = updated[idx - 1];
      updated[idx - 1] = temp;
      updateSlides(updated);
      setActiveSlideIndex(idx - 1);
    } else if (direction === 'down' && idx < slides.length - 1) {
      const updated = [...slides];
      const temp = updated[idx];
      updated[idx] = updated[idx + 1];
      updated[idx + 1] = temp;
      updateSlides(updated);
      setActiveSlideIndex(idx + 1);
    }
  };

  // Update Active Slide Fields
  const updateActiveSlide = (fields: Partial<(typeof slides)[0]>) => {
    if (!activeSlide) return;
    const updated = [...slides];
    updated[activeSlideIndex] = {
      ...activeSlide,
      ...fields
    };
    updateSlides(updated);
  };

  // Bullet CRUD inside active slide
  const handleUpdateBullet = (bulletIdx: number, val: string) => {
    if (!activeSlide) return;
    const updatedBullets = [...activeSlide.content];
    updatedBullets[bulletIdx] = val;
    updateActiveSlide({ content: updatedBullets });
  };

  const handleAddBullet = () => {
    if (!activeSlide) return;
    updateActiveSlide({
      content: [...activeSlide.content, 'New bullet point.']
    });
  };

  const handleDeleteBullet = (bulletIdx: number) => {
    if (!activeSlide || activeSlide.content.length <= 1) return;
    updateActiveSlide({
      content: activeSlide.content.filter((_, i) => i !== bulletIdx)
    });
  };

  // Base64 Image upload helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      updateActiveSlide({ imageUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    if (!activeSlide) return;
    const { imageUrl, ...rest } = activeSlide;
    const updated = [...slides];
    updated[activeSlideIndex] = rest;
    updateSlides(updated);
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between border-b border-slate-205 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/core/roadmaps"
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
          >
            <Icons.ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase text-cyan-600 tracking-widest bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded-md font-heading">
                {module.level}
              </span>
              <h2 className="text-base font-black text-slate-800 font-heading tracking-tight leading-tight">
                {module.name} Content Editor
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">
              Curate the slide deck that students view when launching this roadmap island.
            </p>
          </div>
        </div>
      </div>

      {/* Main workspace splits */}
      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Pane 1: SLIDE TIMELINE SIDEBAR (20% width) */}
        <div className="w-60 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col justify-between overflow-y-auto flex-shrink-0 shadow-sm">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block font-heading">
              Slides Timeline
            </span>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
              {slides.map((slide, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={cn(
                    "p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 relative group",
                    activeSlideIndex === idx
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400">
                      Slide {idx + 1}
                    </span>
                    
                    {/* Control Overlay for duplicate/delete/order */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => handleMoveSlide(idx, 'up', e)}
                        disabled={idx === 0}
                        className="p-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Icons.ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleMoveSlide(idx, 'down', e)}
                        disabled={idx === slides.length - 1}
                        className="p-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Icons.ChevronDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicateSlide(idx, e)}
                        className="p-0.5 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600"
                        title="Duplicate"
                      >
                        <Icons.Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSlide(idx, e)}
                        disabled={slides.length <= 1}
                        className="p-0.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 disabled:opacity-30 disabled:pointer-events-none"
                        title="Delete"
                      >
                        <Icons.Trash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <span className="text-xs font-black truncate pr-1">
                    {slide.title || 'Untitled Slide'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddSlide}
            className="w-full mt-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-slate-700"
          >
            <Icons.Plus className="w-4 h-4 font-bold" />
            Add Slide
          </button>
        </div>

        {/* Pane 2: SLIDE EDITOR (40% width) */}
        {activeSlide ? (
          <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-6 overflow-y-auto flex flex-col gap-5 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block font-heading border-b border-slate-100 pb-2">
              Slide Configuration
            </span>

            {/* Layout type selector */}
            <div className="space-y-1.5 font-bold">
              <label className="font-extrabold text-slate-500 text-xs block">Layout Structure</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'text-only', label: 'Text Only', icon: Icons.AlignLeft },
                  { value: 'text-image', label: 'Text + Image', icon: Icons.ImagePlay },
                  { value: 'image-only', label: 'Image Only', icon: Icons.Image }
                ].map((layout) => (
                  <button
                    key={layout.value}
                    type="button"
                    onClick={() => updateActiveSlide({ layoutType: layout.value as any })}
                    className={cn(
                      "py-2 px-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all font-bold text-[10px]",
                      activeSlide.layoutType === layout.value || (!activeSlide.layoutType && layout.value === 'text-only')
                        ? "bg-indigo-55/45 border-indigo-300 text-indigo-700"
                        : "bg-slate-50 border-slate-200 text-slate-550 hover:bg-slate-100 hover:text-slate-800"
                    )}
                  >
                    <layout.icon className="w-4 h-4" />
                    {layout.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title field */}
            <div className="space-y-1 font-bold">
              <label className="font-extrabold text-slate-550 text-xs">Slide Title</label>
              <input
                type="text"
                value={activeSlide.title}
                onChange={(e) => updateActiveSlide({ title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Bullet points editor */}
            {activeSlide.layoutType !== 'image-only' && (
              <div className="space-y-3 font-semibold">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-550 text-xs">Curriculum Bullet Points</label>
                  <button
                    type="button"
                    onClick={handleAddBullet}
                    className="text-[10px] font-black text-cyan-600 hover:underline flex items-center gap-1"
                  >
                    <Icons.Plus className="w-3.5 h-3.5" />
                    Add Bullet
                  </button>
                </div>

                <div className="space-y-2.5">
                  {activeSlide.content.map((bullet, bulletIdx) => (
                    <div key={bulletIdx} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 text-[10px] font-extrabold">
                        {bulletIdx + 1}
                      </div>
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => handleUpdateBullet(bulletIdx, e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteBullet(bulletIdx)}
                        disabled={activeSlide.content.length <= 1}
                        className="p-2 bg-slate-100 hover:bg-rose-55 border border-slate-200 hover:border-rose-100 text-slate-400 hover:text-rose-600 rounded-xl disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Icons.Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image selector */}
            {(activeSlide.layoutType === 'text-image' || activeSlide.layoutType === 'image-only') && (
              <div className="space-y-2 border-t border-slate-100 pt-4 mt-2 font-semibold">
                <label className="font-extrabold text-slate-550 text-xs block">Architectural Image Component</label>
                
                {activeSlide.imageUrl ? (
                  <div className="relative border border-slate-205 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center gap-3">
                    <img
                      src={activeSlide.imageUrl}
                      alt="Current Slide View"
                      className="max-h-[120px] object-contain rounded-lg border border-slate-200"
                    />
                    <div className="flex items-center gap-2 w-full">
                      <label className="flex-1 py-2 px-3 border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black rounded-xl cursor-pointer text-center">
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="py-2 px-3 border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-605 text-[11px] font-black rounded-xl"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/40 hover:bg-indigo-50/20 transition-all text-center">
                    <Icons.UploadCloud className="w-8 h-8 text-slate-400" />
                    <span className="text-[11px] font-black text-slate-600">Upload Concept Image</span>
                    <span className="text-[9px] text-slate-450">JPG, PNG, WebP (Converted to base64)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

          </div>
        ) : (
          <div className="flex-1 bg-white border border-slate-205 rounded-3xl p-6 flex items-center justify-center text-slate-400 text-xs shadow-sm">
            Select or create a slide to begin editing.
          </div>
        )}

        {/* Pane 3: STUDENT PREVIEW FRAME (40% width) */}
        <div className="w-[380px] border border-slate-200 rounded-3xl overflow-hidden flex flex-col bg-slate-50 flex-shrink-0 shadow-sm">
          <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-[10px] text-slate-500 font-extrabold tracking-wider">
            <Icons.Smartphone className="w-4 h-4 text-cyan-600" />
            STUDENT PREVIEW PANE
          </div>

          <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
            {/* Simulating the slide modal layout */}
            <div className="space-y-4">
              
              {/* Top progress indicator bar */}
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>Slide {activeSlideIndex + 1} of {slides.length}</span>
                <span className="text-emerald-600 font-bold">Curriculum Path</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                  style={{ width: `${((activeSlideIndex + 1) / slides.length) * 100}%` }}
                />
              </div>

              {/* Learning slide core */}
              {activeSlide ? (
                <div className="bg-white rounded-3xl p-5 shadow-xl text-slate-800 min-h-[340px] flex flex-col justify-between border border-slate-100 select-text">
                  <LearningContentRenderer
                    title={activeSlide.title}
                    bullets={activeSlide.layoutType === 'image-only' ? [] : activeSlide.content}
                    layout={activeSlide.layoutType || 'text-only'}
                    iconName={module.iconName || 'Boxes'}
                    imageUrl={activeSlide.imageUrl}
                  />
                </div>
              ) : (
                <div className="bg-slate-100 border border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-xs min-h-[300px] flex items-center justify-center">
                  No slide selected
                </div>
              )}
            </div>

            {/* Modal Bottom buttons simulation */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-6 flex-shrink-0">
              <button
                disabled={activeSlideIndex === 0}
                onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                className="px-4.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none text-xs font-black flex items-center gap-1.5 shadow-sm"
              >
                <Icons.ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              
              <button
                disabled={activeSlideIndex === slides.length - 1}
                onClick={() => setActiveSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-black flex items-center gap-1.5 shadow-sm"
              >
                Next Slide
                <Icons.ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
