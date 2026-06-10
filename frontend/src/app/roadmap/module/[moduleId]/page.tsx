'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { ROADMAP_MODULES, QuizQuestion } from '@/constants/roadmapData';
import { useRoadmapStore, QuizQuestionReview } from '@/store/roadmapStore';
import { cn } from '@/lib/utils';
import { LearningContentRenderer } from '@/components/Roadmap/LearningContentRenderer';
import { QuizEntry } from '@/components/Roadmap/QuizEntry';
import { QuizReview } from '@/components/Roadmap/QuizReview';
import { ModuleCompletionBanner } from '@/components/Roadmap/ModuleCompletionBanner';
import { generateQuizQuestionsForModule } from '@/lib/quizHelpers';

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

// ----------------------------------------------------
// 4. MAIN ROUTE CONTROLLER
// ----------------------------------------------------

export default function ModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') || 'reading';
  
  // Unwrap dynamic params
  const { moduleId } = use(params);
  
  // Zustand global states
  const { modules, userResourceProgress, quizReviews, markAsRead, submitQuizScore } = useRoadmapStore();
  
  // Find module details
  const moduleData = modules.find((m) => m.id === moduleId);
  
  // State controllers
  const [step, setStep] = useState<'reading' | 'quiz-unlock' | 'quiz' | 'review'>('reading');
  const [slideIndex, setSlideIndex] = useState(0);
  const [hasSyncedMode, setHasSyncedMode] = useState(false);
  
  // Quiz states
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [quizChecked, setQuizChecked] = useState(false);
  const [shake, setShake] = useState(false);
  
  // Confetti overlay state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const particles = useRef<Confetti[]>([]);

  useEffect(() => {
    setHasSyncedMode(false);
  }, [moduleId]);

  useEffect(() => {
    if (!moduleData) {
      router.push('/');
    } else {
      // Build questions from custom quiz questions pool, or fallback to generated templates
      const pool = moduleData.quizQuestions && moduleData.quizQuestions.length > 0
        ? moduleData.quizQuestions
        : generateQuizQuestionsForModule(moduleData.id, moduleData.name);
      
      // Shuffle helper that randomizes both questions and their options
      const shuffled = [...pool]
        .map((q) => {
          const optionsWithIndices = q.options.map((option, index) => ({
            option,
            isCorrect: index === q.answerIndex
          }));
          const shuffledOptionsWithIndices = [...optionsWithIndices]
            .map((item) => ({ item, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ item }) => item);
          
          return {
            ...q,
            options: shuffledOptionsWithIndices.map((item) => item.option),
            answerIndex: shuffledOptionsWithIndices.findIndex((item) => item.isCorrect)
          };
        })
        .map((q) => ({ q, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ q }) => q)
        .slice(0, Math.min(pool.length, 15));
      
      setQuizQuestions(shuffled);
    }
  }, [moduleData, router]);

  useEffect(() => {
    // Mode routing synchronization
    if (hasSyncedMode) return;
    if (initialMode === 'review') {
      if (quizReviews[moduleId]) {
        setStep('review');
        setHasSyncedMode(true);
      }
    } else {
      setStep('reading');
      setHasSyncedMode(true);
    }
  }, [initialMode, moduleId, quizReviews, hasSyncedMode]);

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

  if (!moduleData) return null;

  // Sync slides with image/text layouts dynamically
  const getSlideLayout = (index: number): 'text-only' | 'text-image' | 'image-only' => {
    const slide = moduleData.learningContent[index];
    if (slide && slide.layoutType) {
      return slide.layoutType;
    }
    if (index === 1) return 'text-image';
    if (index === 2) return 'image-only';
    return 'text-only';
  };

  const handleNextSlide = () => {
    if (slideIndex + 1 < moduleData.learningContent.length) {
      setSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (slideIndex > 0) {
      setSlideIndex((prev) => prev - 1);
    }
  };

  const handleMarkAsRead = () => {
    markAsRead(moduleData.id);
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

  const handleQuizSubmit = () => {
    if (userAnswers[currentQuizIndex] === undefined) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Calculate score
    let score = 0;
    const reviewData: QuizQuestionReview[] = quizQuestions.map((q, idx) => {
      const isCorrect = userAnswers[idx] === q.answerIndex;
      if (isCorrect) score += 1;
      return {
        question: q.question,
        options: q.options,
        userAnswerIndex: userAnswers[idx],
        correctAnswerIndex: q.answerIndex,
        explanation: q.explanation
      };
    });

    submitQuizScore(moduleData.id, score, reviewData, moduleData.points);
    setShowConfetti(true);
    setStep('review');
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
              href="/"
              className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors flex items-center justify-center"
            >
              <Icons.ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                {moduleData.level} Path
              </span>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight font-heading">
                {moduleData.name}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Icons.Zap className="w-3.5 h-3.5 fill-current" />
              +{moduleData.points} XP
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
                      Page {slideIndex + 1} of {moduleData.learningContent.length}
                    </span>
                  </div>

                  {/* Adaptive content model renderer */}
                  <LearningContentRenderer 
                    title={moduleData.learningContent[slideIndex].title}
                    bullets={moduleData.learningContent[slideIndex].content}
                    layout={getSlideLayout(slideIndex)}
                    iconName={moduleData.iconName}
                    imageUrl={moduleData.learningContent[slideIndex].imageUrl}
                  />
                </div>

                {/* Mark as read instructions for final slide */}
                {slideIndex === moduleData.learningContent.length - 1 && (
                  <div className="bg-emerald-55/5 border border-emerald-500/20 text-emerald-800 text-xs font-bold rounded-2xl p-4 flex items-center gap-2.5 animate-pulse">
                    <Icons.CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>You have completed all learning content. Click "Mark As Read" to unlock the validation quiz.</span>
                  </div>
                )}

                {/* Progress Indicators (Pips) */}
                <div className="flex justify-center gap-1.5 py-2">
                  {moduleData.learningContent.map((_, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        idx === slideIndex ? "w-6 bg-emerald-500" : "w-2 bg-slate-200"
                      )}
                    />
                  ))}
                </div>

                {/* Slide Action Buttons */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
                  <button
                    disabled={slideIndex === 0}
                    onClick={handlePrevSlide}
                    className="border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent font-bold py-2.5 px-5 rounded-xl text-xs transition-all active:scale-[0.98]"
                  >
                    Previous Page
                  </button>
                  
                  {slideIndex === moduleData.learningContent.length - 1 ? (
                    <button
                      onClick={handleMarkAsRead}
                      className="bg-emerald-600 hover:bg-emerald-550 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-emerald-600/15 transition-all active:scale-[0.98]"
                    >
                      Mark As Read
                    </button>
                  ) : (
                    <button
                      onClick={handleNextSlide}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-emerald-600/15 transition-all active:scale-[0.98]"
                    >
                      Next Page
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 2: QUIZ UNLOCK SCREEN */}
            {step === 'quiz-unlock' && (
              <ModuleCompletionBanner onTakeQuiz={() => setStep('quiz')} />
            )}

            {/* STEP 3: QUIZ SYSTEM */}
            {step === 'quiz' && quizQuestions.length > 0 && (
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
              />
            )}

            {/* STEP 4: PERSISTENT QUIZ REVIEW VIEWPORT */}
            {step === 'review' && (
              <QuizReview
                review={quizReviews[moduleData.id]}
                onReturn={() => router.push('/')}
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
