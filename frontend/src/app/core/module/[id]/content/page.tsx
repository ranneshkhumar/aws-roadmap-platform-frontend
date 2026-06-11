'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { modulesService, slidesService, mapLayoutTypeToFrontend, mapLayoutTypeToBackend } from '@/services/api';
import { ApiError } from '@/services/apiClient';
import { authService } from '@/services/auth.service';
import { LearningContentRenderer } from '@/components/Roadmap/LearningContentRenderer';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

const tierToLevel = (tier: string): 'Beginner' | 'Intermediate' | 'Advanced' => {
  const map: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
    Fundamentals: 'Beginner',
    Associate: 'Intermediate',
    Professional: 'Advanced',
  };
  return map[tier] || 'Beginner';
};

const getIconForSlug = (slug: string): string => {
  const map: Record<string, string> = {
    fundamentals: 'Globe',
    ec2: 'Cpu',
    s3: 'Database',
    iam: 'Shield',
    vpc: 'Network',
    rds: 'Server',
    route53: 'Compass',
    elasticloadbalancing: 'Shuffle',
    autoscaling: 'ArrowUpCircle',
    lambda: 'Zap',
    dynamodb: 'HardDrive',
    cloudwatch: 'Eye',
    sns_sqs: 'Mail',
    cloudtrail: 'FileText',
    cloudfront: 'Tv',
    ecs_eks: 'Box',
    iam_advanced: 'Lock',
    transit_gateway: 'GitMerge',
  };
  return map[slug] || 'Boxes';
};

export default function ContentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;

  const [module, setModule] = useState<{ id: string; name: string; level: string; dbId: string; iconName: string } | null>(null);
  const [slides, setSlides] = useState<any[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  // References for debounced save
  const isDirtyRef = useRef(false);
  const slidesRef = useRef<any[]>([]);
  const dbIdRef = useRef<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveVersionRef = useRef(0);

  // Keep slidesRef.current and dbIdRef.current synchronized
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  useEffect(() => {
    if (module) {
      dbIdRef.current = module.dbId;
    } else {
      dbIdRef.current = null;
    }
  }, [module]);

  const handleApiError = (err: any) => {
    const apiError = err as ApiError;
    if (apiError.status === 401) {
      authService.logout();
      router.push('/login');
    } else if (apiError.status === 403) {
      alert('Permission Denied: You do not have the required core privileges to make curriculum changes.');
    } else {
      alert(apiError.message || 'An unexpected error occurred.');
    }
  };

  useEffect(() => {
    const loadModuleAndSlides = async () => {
      try {
        setLoading(true);
        const res = await modulesService.getModuleBySlug(moduleId);
        
        // Runtime Contract Guard: Verify module detail structure
        if (!res || !res.id || !res.name || !res.tier) {
          throw new Error('API Contract Mismatch: Invalid module metadata received.');
        }

        // Runtime Contract Guard for Slides
        if (!Array.isArray(res.slides)) {
          throw new Error('API Contract Mismatch: Slides data is missing or not an array.');
        }
        
        for (const slide of res.slides) {
          const missing = [];
          if (slide.title === undefined || slide.title === null) missing.push('title');
          if (slide.layoutType === undefined || slide.layoutType === null) missing.push('layoutType');
          if (slide.orderIndex === undefined || slide.orderIndex === null) missing.push('orderIndex');
          if (missing.length > 0) {
            throw new Error(`API Contract Mismatch: Slide is missing required fields: ${missing.join(', ')}`);
          }
        }

        setModule({
          id: res.slug,
          name: res.name,
          level: tierToLevel(res.tier),
          dbId: res.id,
          iconName: getIconForSlug(res.slug),
        });

        // Map backend slides to frontend slides structure
        const mappedSlides = res.slides.map((s) => ({
          title: s.title,
          content: s.bullets || [], // Rename bullets -> content
          layoutType: mapLayoutTypeToFrontend(s.layoutType),
          imageUrl: s.imageUrl || undefined,
        }));
        
        setSlides(mappedSlides);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load slides:', err);
        setError(err.message || 'An error occurred loading slide content.');
      } finally {
        setLoading(false);
      }
    };

    loadModuleAndSlides();
  }, [moduleId]);

  const flushSlides = async (): Promise<void> => {
    if (!isDirtyRef.current || !dbIdRef.current) return Promise.resolve();

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    const version = ++saveVersionRef.current;
    isDirtyRef.current = false;
    setSaveStatus('saving');

    try {
      // Map slides to backend shape, generating orderIndex = array index
      const mapped = slidesRef.current.map((s, index) => ({
        title: s.title,
        layoutType: mapLayoutTypeToBackend(s.layoutType),
        imageUrl: s.imageUrl || null,
        bullets: s.content || [],
        orderIndex: index,
      }));

      await slidesService.syncSlides(dbIdRef.current, mapped);

      if (version === saveVersionRef.current) {
        setSaveStatus('saved');
      }
    } catch (err: any) {
      console.error('Failed to sync slides:', err);
      if (version === saveVersionRef.current) {
        setSaveStatus('failed');
        isDirtyRef.current = true;
      }
      handleApiError(err);
      throw err;
    }
  };

  const updateSlidesLocally = (updatedSlides: any[]) => {
    setSlides(updatedSlides);
    isDirtyRef.current = true;
    setSaveStatus('idle');

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      flushSlides().catch(console.error);
    }, 1000);
  };

  const activeSlide = slides[activeSlideIndex] || slides[0] || null;

  // Add Slide
  const handleAddSlide = async () => {
    try {
      await flushSlides();
      const newSlide = {
        title: 'New Cloud Concept',
        content: ['Introduce your first cloud concept bullet point here.'],
        layoutType: 'text-only' as const
      };
      const updated = [...slides, newSlide];
      
      // Perform immediate sync
      isDirtyRef.current = true;
      setSlides(updated);
      slidesRef.current = updated; // Update ref immediately for flush
      await flushSlides();
      
      setActiveSlideIndex(updated.length - 1);
    } catch (err) {
      console.error(err);
    }
  };

  // Duplicate Slide
  const handleDuplicateSlide = async (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await flushSlides();
      const slideToDuplicate = slides[idx];
      const duplicatedSlide = {
        ...slideToDuplicate,
        title: `${slideToDuplicate.title} Copy`,
        content: [...slideToDuplicate.content],
      };
      const updated = [...slides];
      updated.splice(idx + 1, 0, duplicatedSlide);
      
      isDirtyRef.current = true;
      setSlides(updated);
      slidesRef.current = updated;
      await flushSlides();
      
      setActiveSlideIndex(idx + 1);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Slide
  const handleDeleteSlide = async (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return;
    try {
      await flushSlides();
      const updated = slides.filter((_, i) => i !== idx);
      
      isDirtyRef.current = true;
      setSlides(updated);
      slidesRef.current = updated;
      await flushSlides();
      
      setActiveSlideIndex(Math.max(0, idx - 1));
    } catch (err) {
      console.error(err);
    }
  };

  // Move Slide
  const handleMoveSlide = async (idx: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'up' && idx > 0) {
      try {
        await flushSlides();
        const updated = [...slides];
        const temp = updated[idx];
        updated[idx] = updated[idx - 1];
        updated[idx - 1] = temp;
        
        isDirtyRef.current = true;
        setSlides(updated);
        slidesRef.current = updated;
        await flushSlides();
        
        setActiveSlideIndex(idx - 1);
      } catch (err) {
        console.error(err);
      }
    } else if (direction === 'down' && idx < slides.length - 1) {
      try {
        await flushSlides();
        const updated = [...slides];
        const temp = updated[idx];
        updated[idx] = updated[idx + 1];
        updated[idx + 1] = temp;
        
        isDirtyRef.current = true;
        setSlides(updated);
        slidesRef.current = updated;
        await flushSlides();
        
        setActiveSlideIndex(idx + 1);
      } catch (err) {
        console.error(err);
      }
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
    updateSlidesLocally(updated);
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
      content: activeSlide.content.filter((_: string, i: number) => i !== bulletIdx)
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
    updateSlidesLocally(updated);
  };

  // beforeunload handler to prevent losing unsaved data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in slides settings. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (isDirtyRef.current && dbIdRef.current) {
        const mapped = slidesRef.current.map((s, index) => ({
          title: s.title,
          layoutType: mapLayoutTypeToBackend(s.layoutType),
          imageUrl: s.imageUrl || null,
          bullets: s.content || [],
          orderIndex: index,
        }));
        slidesService.syncSlides(dbIdRef.current, mapped).catch(console.error);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // CMS Error Banner render block
  if (error) {
    return (
      <div className="min-h-screen w-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-xl w-full bg-rose-500/10 border-2 border-rose-500/20 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 animate-bounce">
            <Icons.AlertTriangle className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight text-white font-heading">
              CMS Runtime Contract Mismatch
            </h2>
            <p className="text-xs text-rose-400 leading-relaxed max-w-md mx-auto">
              {error}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-rose-600 hover:bg-rose-550 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md transition-all font-heading"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-405 font-bold uppercase animate-pulse">
            Loading slide content editor...
          </span>
        </div>
      </div>
    );
  }

  if (!module) return null;

  return (
    <div className="space-y-6 flex flex-col h-full">
      
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-shrink-0">
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
            <p className="text-[11px] text-slate-550 mt-1 font-semibold">
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
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-heading">
                Slide Configuration
              </span>
              <div className="flex items-center gap-1.5">
                {saveStatus === 'saving' && <span className="text-[9px] text-indigo-500 font-bold animate-pulse font-heading lowercase tracking-normal">(saving...)</span>}
                {saveStatus === 'saved' && <span className="text-[9px] text-emerald-600 font-bold font-heading lowercase tracking-normal">(saved)</span>}
                {saveStatus === 'failed' && <span className="text-[9px] text-rose-500 font-bold font-heading lowercase tracking-normal">(failed to save)</span>}
              </div>
            </div>

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
                        ? "bg-indigo-55/45 border-indigo-300 text-indigo-705 font-bold"
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
                  {(activeSlide.content || []).map((bullet: string, bulletIdx: number) => (
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
                        className="p-2 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 text-slate-400 hover:text-rose-600 rounded-xl disabled:opacity-30 disabled:pointer-events-none"
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
                  <div className="relative border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center gap-3">
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
                        className="py-2 px-3 border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-black rounded-xl"
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
          <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-center text-slate-400 text-xs shadow-sm">
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
                  style={{ width: `${((activeSlideIndex + 1) / (slides.length || 1)) * 100}%` }}
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
