'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { modulesService, slidesService, questionsService, progressService, mapLayoutTypeToFrontend, mapIndexToLetter } from '@/services/api';
import { ApiError } from '@/services/apiClient';
import { authService } from '@/services/auth.service';
import { cn } from '@/lib/utils';
import { LearningContentRenderer } from '@/components/Roadmap/LearningContentRenderer';
import { QuizEntry } from '@/components/Roadmap/QuizEntry';
import { QuizReview, QuizReviewData } from '@/components/Roadmap/QuizReview';
import { ModuleCompletionBanner } from '@/components/Roadmap/ModuleCompletionBanner';

interface Confetti {
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

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

export default function ModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') || 'reading';
  
  const { moduleId } = use(params);
  
  // State controllers
  const [module, setModule] = useState<{ id: string; name: string; level: string; dbId: string; points: number; iconName: string } | null>(null);
  const [slides, setSlides] = useState<any[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  
  const [step, setStep] = useState<'reading' | 'quiz-unlock' | 'quiz' | 'review'>('reading');
  const [slideIndex, setSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState(false);
  const [isCompletedModule, setIsCompletedModule] = useState(false);
  
  // Quiz states
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [shake, setShake] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizReview, setQuizReview] = useState<QuizReviewData | undefined>(undefined);
  
  // Confetti overlay state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const particles = useRef<Confetti[]>([]);

  const handleApiError = (err: any) => {
    const apiError = err as ApiError;
    if (apiError.status === 401) {
      authService.logout();
      router.push('/login');
    } else if (apiError.status === 403) {
      alert('Permission Denied: You do not have permission to access these roadmap services.');
    } else {
      alert(apiError.message || 'An unexpected error occurred.');
    }
  };

  useEffect(() => {
    const loadModuleData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSecurityError(false);

        // 1. Fetch all modules to find matching slug
        const dbModules = await modulesService.getModules();
        const activeModule = dbModules.find((m) => m.slug === moduleId);

        if (!activeModule) {
          router.replace('/roadmap');
          return;
        }

        const dbId = activeModule.id;

        // 2. Fetch learner progress profile to perform unlock validation & completed modules policy check
        const progress = await progressService.getMyProgress();

        const isCompleted = progress.completedModules.includes(dbId);
        const isUnlocked = progress.unlockedModules.includes(dbId);

        // Unlock Validation
        if (!isCompleted && !isUnlocked) {
          console.warn(`Module "${moduleId}" (ID: ${dbId}) is locked for this user.`);
          router.replace('/roadmap');
          return;
        }

        setIsCompletedModule(isCompleted);

        // 3. Fetch module slides
        const fetchedSlides = await slidesService.getSlides(dbId);
        
        // Runtime Slide validation
        for (const s of fetchedSlides) {
          if (!s.title || !s.layoutType || s.orderIndex === undefined) {
            throw new Error("API Contract Mismatch: Invalid slide schema detected.");
          }
        }

        // 4. Fetch questions
        const fetchedQuestions = await questionsService.getQuestions(dbId);

        // Runtime learner question contract validator
        for (const q of fetchedQuestions) {
          // Verify required fields
          if (!q.question || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.explanation || q.orderIndex === undefined) {
            throw new Error("API Contract Mismatch: Invalid question schema detected.");
          }
          // Check forbidden correctAnswer key
          if ('correctAnswer' in q || (q as any).correctAnswer !== undefined) {
            console.error("Security Alert: correctAnswer leaked on learner route. Halting render.");
            setSecurityError(true);
            setLoading(false);
            return;
          }
        }

        setModule({
          id: activeModule.slug,
          name: activeModule.name,
          level: tierToLevel(activeModule.tier),
          points: activeModule.xpPoints,
          dbId: activeModule.id,
          iconName: getIconForSlug(activeModule.slug),
        });

        // Map backend slides content
        const mappedSlides = fetchedSlides.map((s) => ({
          title: s.title,
          content: s.bullets || [],
          layoutType: mapLayoutTypeToFrontend(s.layoutType),
          imageUrl: s.imageUrl || undefined,
        }));

        setSlides(mappedSlides);
        setQuizQuestions(fetchedQuestions);

        // Initial step resolution
        if (initialMode === 'review' && isCompleted) {
          // Construct empty answers scoreboard for historical completed review (secure mode)
          const dummyReview: QuizReviewData = {
            moduleId: dbId,
            score: fetchedQuestions.length, // default display best
            totalQuestions: fetchedQuestions.length,
            percentage: 100,
            xpEarned: 0,
            answers: [],
            completedAt: new Date().toISOString(),
          };
          setQuizReview(dummyReview);
          setStep('review');
        } else {
          setStep('reading');
        }
      } catch (err: any) {
        console.error("Failed to load module player data:", err);
        setError(err.message || "An error occurred loading the learning module.");
      } finally {
        setLoading(false);
      }
    };

    loadModuleData();
  }, [moduleId, initialMode, router]);

  // Confetti loop
  useEffect(() => {
    if (!showConfetti || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];
    const list: Confetti[] = [];
    for (let i = 0; i < 120; i++) {
      list.push({
        x: canvas.width / 2,
        y: canvas.height / 2 - 80,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.7) * 18 - 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1
      });
    }
    particles.current = list;

    let frameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.36;
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.008;

        if (p.opacity > 0) {
          active = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
          ctx.restore();
        }
      });

      if (active) {
        frameId = requestAnimationFrame(render);
      } else {
        setShowConfetti(false);
      }
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [showConfetti]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-405 font-bold uppercase animate-pulse">
            Loading learning path...
          </span>
        </div>
      </div>
    );
  }

  // Fail fast security error page
  if (securityError) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-xl w-full bg-rose-950/20 border-2 border-rose-500/30 rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-650/30 animate-bounce">
            <Icons.ShieldAlert className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight text-white font-heading">
              Security Violation Detected
            </h2>
            <p className="text-xs text-rose-405 leading-relaxed max-w-md mx-auto">
              Correct answer keys were detected in the fetched client data. The assessment has been suspended to protect path integrity.
            </p>
          </div>
          <Link
            href="/roadmap"
            className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md border border-slate-800 transition-all font-heading"
          >
            Return to Journey Map
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-xl w-full bg-rose-500/10 border-2 border-rose-500/20 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <Icons.AlertTriangle className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight text-white font-heading">
              Failed to load module
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

  if (!module || slides.length === 0) return null;

  const handleNextSlide = () => {
    if (slideIndex + 1 < slides.length) {
      setSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (slideIndex > 0) {
      setSlideIndex((prev) => prev - 1);
    }
  };

  const handleMarkAsRead = () => {
    if (isCompletedModule) return;
    setStep('quiz-unlock');
  };

  const handleOptionSelect = (optIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuizIndex]: optIndex
    }));
  };

  const handleNextQuestion = () => {
    if (userAnswers[currentQuizIndex] === undefined) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (currentQuizIndex + 1 < quizQuestions.length) {
      setCurrentQuizIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex((prev) => prev - 1);
    }
  };

  const handleQuizSubmit = async () => {
    if (userAnswers[currentQuizIndex] === undefined) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const answersPayload = quizQuestions.map((q, idx) => ({
        questionOrder: q.orderIndex,
        selectedAnswer: mapIndexToLetter(userAnswers[idx] ?? 0),
      }));

      const res = await progressService.submitQuizAttempt(module.dbId, {
        answers: answersPayload,
      });

      // Show confetti
      setShowConfetti(true);

      // Construct QuizReviewData locally (stripped correctAnswers answers array for student security)
      const reviewResult: QuizReviewData = {
        moduleId: module.dbId,
        score: res.correctAnswers,
        totalQuestions: res.totalQuestions,
        percentage: res.percentage,
        xpEarned: res.xpEarned,
        answers: [],
        completedAt: new Date().toISOString(),
      };

      setQuizReview(reviewResult);
      setStep('review');
    } catch (err: any) {
      console.error("Failed to submit quiz attempt:", err);
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-[#E0F2FE] via-[#F0F9FF] to-[#FFFFFF] flex items-center justify-center p-4 font-sans select-none relative overflow-hidden text-slate-800">
      
      {/* Background Ambience */}
      <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-cyan-300/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-emerald-300/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Confetti canvas overlay */}
      {showConfetti && (
        <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[100]" />
      )}

      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-[32px] shadow-2xl p-6 md:p-8 flex flex-col min-h-[520px] relative z-10">
        
        {/* TOP STATUS BAR */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <Link 
              href="/roadmap"
              className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors flex items-center justify-center"
            >
              <Icons.ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                {module.level} Path
              </span>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight font-heading">
                {module.name}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Icons.Zap className="w-3.5 h-3.5 fill-current" />
              +{module.points} XP
            </span>
          </div>
        </div>

        {/* INTERACTIVE FLOW CONTENT VIEWPORTS */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: READING CONTENT SLIDES */}
            {step === 'reading' && (
              <motion.div
                key="reading-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex flex-col flex-1"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">
                      Page {slideIndex + 1} of {slides.length}
                    </span>
                  </div>

                  {/* Adaptive content model renderer */}
                  <LearningContentRenderer 
                    title={slides[slideIndex].title}
                    bullets={slides[slideIndex].content}
                    layout={slides[slideIndex].layoutType}
                    iconName={module.iconName}
                    imageUrl={slides[slideIndex].imageUrl}
                  />
                </div>

                {/* Completed module policy review banner vs standard block */}
                {slideIndex === slides.length - 1 && (
                  isCompletedModule ? (
                    <div className="flex flex-col gap-3">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-bold rounded-2xl p-4 flex items-center gap-2.5">
                        <Icons.CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span>You have already completed this module assessment. Duplicate attempts are disabled.</span>
                      </div>
                      
                      <div className="flex justify-center gap-1.5 py-2">
                        {slides.map((_, idx) => (
                          <div 
                            key={idx}
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-300",
                              idx === slideIndex ? "w-6 bg-emerald-500" : "w-2 bg-slate-200"
                            )}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
                        <button
                          disabled={slideIndex === 0}
                          onClick={handlePrevSlide}
                          className="border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent font-bold py-2.5 px-5 rounded-xl text-xs transition-all active:scale-[0.98]"
                        >
                          Previous Page
                        </button>
                        <button
                          onClick={() => router.push('/roadmap')}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
                        >
                          Return to Journey Map
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-bold rounded-2xl p-4 flex items-center gap-2.5 animate-pulse">
                        <Icons.CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span>You have completed all learning content. Click "Mark As Read" to unlock the validation quiz.</span>
                      </div>
                      
                      <div className="flex justify-center gap-1.5 py-2">
                        {slides.map((_, idx) => (
                          <div 
                            key={idx}
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-300",
                              idx === slideIndex ? "w-6 bg-emerald-500" : "w-2 bg-slate-200"
                            )}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
                        <button
                          disabled={slideIndex === 0}
                          onClick={handlePrevSlide}
                          className="border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent font-bold py-2.5 px-5 rounded-xl text-xs transition-all active:scale-[0.98]"
                        >
                          Previous Page
                        </button>
                        <button
                          onClick={handleMarkAsRead}
                          className="bg-emerald-600 hover:bg-emerald-550 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-emerald-600/15 transition-all active:scale-[0.98]"
                        >
                          Mark As Read
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* Navigation for non-final slides */}
                {slideIndex < slides.length - 1 && (
                  <div className="space-y-4">
                    <div className="flex justify-center gap-1.5 py-2">
                      {slides.map((_, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            idx === slideIndex ? "w-6 bg-emerald-500" : "w-2 bg-slate-200"
                          )}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
                      <button
                        disabled={slideIndex === 0}
                        onClick={handlePrevSlide}
                        className="border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent font-bold py-2.5 px-5 rounded-xl text-xs transition-all active:scale-[0.98]"
                      >
                        Previous Page
                      </button>
                      <button
                        onClick={handleNextSlide}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-emerald-600/15 transition-all active:scale-[0.98]"
                      >
                        Next Page
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: QUIZ UNLOCK SCREEN */}
            {step === 'quiz-unlock' && !isCompletedModule && (
              <ModuleCompletionBanner onTakeQuiz={() => setStep('quiz')} />
            )}

            {/* STEP 3: QUIZ SYSTEM */}
            {step === 'quiz' && quizQuestions.length > 0 && !isCompletedModule && (
              <QuizEntry
                question={quizQuestions[currentQuizIndex]}
                currentIndex={currentQuizIndex}
                totalQuestions={quizQuestions.length}
                selectedOption={userAnswers[currentQuizIndex]}
                onSelectOption={handleOptionSelect}
                onNext={handleNextQuestion}
                onPrev={handlePrevQuestion}
                isLast={currentQuizIndex === quizQuestions.length - 1}
                shake={shake}
                onSubmit={handleQuizSubmit}
                isSubmitting={isSubmitting}
              />
            )}

            {/* STEP 4: PERSISTENT QUIZ REVIEW VIEWPORT */}
            {step === 'review' && (
              <QuizReview
                review={quizReview}
                onReturn={() => router.push('/roadmap')}
              />
            )}

          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
