'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useRoadmapStore } from '@/store/roadmapStore';
import { QuizEntry } from '@/components/Roadmap/QuizEntry';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuizEditorPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;
  const { modules, updateModule } = useRoadmapStore();

  const moduleData = modules.find((m) => m.id === moduleId);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Student simulation quiz preview states
  const [simSelectedIdx, setSimSelectedIdx] = useState<number | null>(null);
  const [simRevealed, setSimRevealed] = useState(false);

  // Redirect if module not found
  useEffect(() => {
    if (!moduleData) {
      router.push('/core/roadmaps');
    }
  }, [moduleData, router]);

  // Reset simulation when active question changes
  useEffect(() => {
    setSimSelectedIdx(null);
    setSimRevealed(false);
  }, [activeQuestionIdx]);

  if (!moduleData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        Loading module quiz editor...
      </div>
    );
  }

  const questions = moduleData.quizQuestions || [];
  const activeQuestion = questions[activeQuestionIdx] || questions[0] || null;

  const updateQuestions = (updatedQuestions: typeof questions) => {
    updateModule(moduleId, { quizQuestions: updatedQuestions });
  };

  // Add Question
  const handleAddQuestion = () => {
    const newQuestion = {
      question: 'New Question Scenario',
      options: ['Option A Choice', 'Option B Choice', 'Option C Choice', 'Option D Choice'],
      answerIndex: 0,
      explanation: 'Detailed concept explanation of why Option A is correct.'
    };
    updateQuestions([...questions, newQuestion]);
    setActiveQuestionIdx(questions.length);
  };

  // Delete Question
  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert("At least one question is required for a module assessment.");
      return;
    }
    const updated = questions.filter((_, i) => i !== idx);
    updateQuestions(updated);
    setActiveQuestionIdx(Math.max(0, idx - 1));
  };

  // Duplicate Question
  const handleDuplicateQuestion = (idx: number) => {
    const target = questions[idx];
    const duplicated = {
      ...target,
      question: `${target.question} Copy`,
      options: [...target.options]
    };
    const updated = [...questions];
    updated.splice(idx + 1, 0, duplicated);
    updateQuestions(updated);
    setActiveQuestionIdx(idx + 1);
  };

  // Update Active Question Fields
  const updateActiveQuestion = (fields: Partial<(typeof questions)[0]>) => {
    if (!activeQuestion) return;
    const updated = [...questions];
    updated[activeQuestionIdx] = {
      ...activeQuestion,
      ...fields
    };
    updateQuestions(updated);
  };

  const updateOptionText = (optIdx: number, val: string) => {
    if (!activeQuestion) return;
    const updatedOptions = [...activeQuestion.options];
    updatedOptions[optIdx] = val;
    updateActiveQuestion({ options: updatedOptions });
  };



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
              <span className="text-[9px] font-black uppercase text-cyan-605 tracking-widest bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded-md font-heading">
                {moduleData.level}
              </span>
              <h2 className="text-base font-black text-slate-800 font-heading tracking-tight leading-tight">
                {moduleData.name} Quiz Editor
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">
              Create, manage, and validate assessment questions for this learning module.
            </p>
          </div>
        </div>
      </div>

      {/* Main split splits */}
      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Pane 1: QUESTION LIST (25% width) */}
        <div className="w-72 bg-white border border-slate-205 rounded-3xl p-4 flex flex-col overflow-y-auto flex-shrink-0 gap-4 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block font-heading">
            Assessment Pool ({questions.length})
          </span>

          {/* Scrollable Questions list */}
          <div className="space-y-2 flex-1 overflow-y-auto pr-1 scrollbar-thin">
            {questions.map((q, idx) => (
              <div
                key={idx}
                onClick={() => setActiveQuestionIdx(idx)}
                className={cn(
                  "p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-1.5 relative group",
                  activeQuestionIdx === idx
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400">
                    Q{idx + 1}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateQuestion(idx);
                      }}
                      className="p-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500"
                      title="Duplicate"
                    >
                      <Icons.Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(idx);
                      }}
                      className="p-0.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600"
                      title="Delete"
                    >
                      <Icons.Trash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <span className="text-xs font-black line-clamp-2 leading-relaxed">
                  {q.question || 'Untitled Question'}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddQuestion}
            className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-slate-700 flex-shrink-0"
          >
            <Icons.Plus className="w-4 h-4 font-bold" />
            Add Question
          </button>
        </div>

        {/* Pane 2: QUESTION EDITOR (40% width) */}
        {activeQuestion ? (
          <div className="flex-1 bg-white border border-slate-205 rounded-3xl p-6 overflow-y-auto flex flex-col gap-5 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block font-heading border-b border-slate-100 pb-2">
              Question Configuration
            </span>

            {/* Question description */}
            <div className="space-y-1 font-bold">
              <label className="font-extrabold text-slate-550 text-xs">Question Scenario</label>
              <textarea
                rows={3}
                value={activeQuestion.question}
                onChange={(e) => updateActiveQuestion({ question: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Options list A B C D */}
            <div className="space-y-3 font-semibold">
              <label className="font-extrabold text-slate-550 text-xs block">Options & Correct Answer</label>
              
              <div className="space-y-3 text-xs">
                {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                  const isCorrect = activeQuestion.answerIndex === optIdx;
                  return (
                    <div key={optIdx} className="flex items-center gap-3">
                      
                      {/* Check radio indicator */}
                      <button
                        type="button"
                        onClick={() => updateActiveQuestion({ answerIndex: optIdx })}
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center font-black transition-all border flex-shrink-0 text-[10px]",
                          isCorrect
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                            : "bg-slate-50 border-slate-205 text-slate-500 hover:border-slate-400"
                        )}
                      >
                        {letter}
                      </button>

                      {/* Text Input */}
                      <input
                        type="text"
                        value={activeQuestion.options[optIdx] || ''}
                        onChange={(e) => updateOptionText(optIdx, e.target.value)}
                        placeholder={`Option ${letter} value`}
                        className={cn(
                          "flex-1 bg-slate-50 border rounded-xl px-4 py-2.5 text-slate-800 transition-colors focus:bg-white focus:outline-none text-xs",
                          isCorrect ? "border-emerald-500/50" : "border-slate-200 focus:border-indigo-500"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation field */}
            <div className="space-y-1 font-bold">
              <label className="font-extrabold text-slate-550 text-xs">Explanation of Correct Answer</label>
              <textarea
                rows={3}
                value={activeQuestion.explanation}
                onChange={(e) => updateActiveQuestion({ explanation: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
              />
            </div>

          </div>
        ) : (
          <div className="flex-1 bg-white border border-slate-205 rounded-3xl p-6 flex items-center justify-center text-slate-400 text-xs shadow-sm">
            Select or create a question to configure.
          </div>
        )}

        {/* Pane 3: STUDENT PREVIEW FRAME (35% width) */}
        <div className="w-80 border border-slate-205 rounded-3xl overflow-hidden flex flex-col bg-slate-50 flex-shrink-0 shadow-sm">
          <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-[10px] text-slate-500 font-extrabold tracking-wider">
            <Icons.Smartphone className="w-4 h-4 text-cyan-605" />
            INTERACTIVE STUDENT VIEW
          </div>

          <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
            {activeQuestion ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                
                {/* Simulating active question slide */}
                <div className="space-y-4 select-text">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 min-h-[100px] flex items-center shadow-inner">
                    <p className="text-xs font-bold leading-relaxed text-slate-850">
                      {activeQuestion.question}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    {activeQuestion.options.map((option, idx) => {
                      const letter = ['A', 'B', 'C', 'D'][idx];
                      const isSimSelected = simSelectedIdx === idx;
                      const isCorrect = activeQuestion.answerIndex === idx;

                      let btnStyle = "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm";
                      if (simRevealed) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-50 border-emerald-300 text-emerald-705 font-bold shadow-none";
                        } else if (isSimSelected) {
                          btnStyle = "bg-rose-55 border-rose-300 text-rose-705 font-bold shadow-none";
                        }
                      } else if (isSimSelected) {
                        btnStyle = "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={simRevealed}
                          onClick={() => setSimSelectedIdx(idx)}
                          className={cn(
                            "w-full p-3.5 border rounded-xl flex items-center gap-3 text-left font-bold transition-all",
                            btnStyle
                          )}
                        >
                          <span className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
                            isSimSelected ? "bg-indigo-500 text-white" : "bg-slate-100 border-slate-200 text-slate-400"
                          )}>
                            {letter}
                          </span>
                          <span className="flex-1 truncate">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submitting reveals review info */}
                <div className="space-y-3.5 pt-4 border-t border-slate-200 mt-4 flex-shrink-0">
                  {simRevealed && (
                    <div className={cn(
                      "rounded-2xl p-3.5 border text-[11px] leading-relaxed",
                      simSelectedIdx === activeQuestion.answerIndex
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-rose-50 border-rose-200 text-rose-700"
                    )}>
                      <p className="font-extrabold flex items-center gap-1.5 mb-1 text-xs">
                        {simSelectedIdx === activeQuestion.answerIndex ? (
                          <Icons.CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Icons.AlertCircle className="w-4 h-4 text-rose-500" />
                        )}
                        {simSelectedIdx === activeQuestion.answerIndex ? 'Correct Explanation!' : 'Incorrect Choice'}
                      </p>
                      <p className="text-slate-600">{activeQuestion.explanation}</p>
                    </div>
                  )}

                  {!simRevealed ? (
                    <button
                      disabled={simSelectedIdx === null}
                      onClick={() => setSimRevealed(true)}
                      className="w-full bg-[#00cba9] hover:bg-[#00bda0] disabled:bg-slate-200 disabled:text-slate-400 disabled:pointer-events-none text-slate-950 font-black py-3 rounded-2xl text-center text-xs tracking-wider transition-all shadow-md"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSimSelectedIdx(null);
                        setSimRevealed(false);
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 rounded-2xl text-center text-xs tracking-wider transition-all border border-slate-200"
                    >
                      Reset Sim Selection
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center text-slate-450 text-xs py-8">
                No active question scenario to simulate.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
