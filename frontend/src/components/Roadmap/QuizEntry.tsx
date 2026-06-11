'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { QuizQuestion } from '@/constants/roadmapData';
import { cn } from '@/lib/utils';

interface QuizEntryProps {
  question: QuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  selectedOption: number | undefined;
  onSelectOption: (idx: number) => void;
  onNext: () => void;
  onPrev: () => void;
  isLast: boolean;
  shake: boolean;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const QuizEntry: React.FC<QuizEntryProps> = ({
  question,
  currentIndex,
  totalQuestions,
  selectedOption,
  onSelectOption,
  onNext,
  onPrev,
  isLast,
  shake,
  onSubmit,
  isSubmitting = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn("space-y-5 flex flex-col flex-1", shake && "animate-[shake_0.5s_ease-in-out]")}
    >
      <div className="space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-heading">
            <Icons.ShieldQuestion className="w-4 h-4 text-blue-500" />
            Architecture Validation
          </h3>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-heading">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <p className="text-sm font-bold text-slate-900 leading-relaxed font-sans">
            {question.question}
          </p>

          <div className="space-y-2.5">
            {question.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectOption(idx)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-xl border text-xs font-semibold leading-snug transition-all flex items-start gap-3 cursor-pointer active:scale-[0.99]",
                    isSelected 
                      ? "border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500/25"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-350"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-[10px] font-black",
                    isSelected ? "bg-blue-600 border-blue-500 text-white" : "border-slate-300 bg-white text-slate-500"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-slate-700 font-medium">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress Bar for Quiz */}
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Quiz Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
        <button
          disabled={currentIndex === 0}
          onClick={onPrev}
          className="border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent font-bold py-2.5 px-5 rounded-xl text-xs transition-all active:scale-[0.98]"
        >
          Previous
        </button>

        {isLast ? (
          <button
            disabled={isSubmitting}
            onClick={onSubmit}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:pointer-events-none text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-blue-600/15 transition-all active:scale-[0.98]"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            onClick={onNext}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-blue-600/15 transition-all active:scale-[0.98]"
          >
            Next Question
          </button>
        )}
      </div>
    </motion.div>
  );
};
