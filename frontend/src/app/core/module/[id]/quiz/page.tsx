'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useRoadmapStore } from '@/store/roadmapStore';
import { QuizEntry } from '@/components/Roadmap/QuizEntry';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PDFInfo {
  filename: string;
  filesize: string;
  lastModified: string;
}

export default function QuizEditorPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;
  const { modules, updateModule } = useRoadmapStore();

  const moduleData = modules.find((m) => m.id === moduleId);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // PDF info state
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  
  // Importer states
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState<'JSON' | 'CSV'>('JSON');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  // PDF Selector handler
  const handlePDFSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

    setPdfInfo({
      filename: file.name,
      filesize: sizeStr,
      lastModified: new Date(file.lastModified).toLocaleDateString()
    });
  };

  // Bulk parser CSV / JSON
  const handleImport = () => {
    setImportError(null);
    try {
      if (!importText.trim()) {
        setImportError("Input content is empty");
        return;
      }

      let parsedQuestions: typeof questions = [];

      if (importFormat === 'JSON') {
        const rawData = JSON.parse(importText);
        if (!Array.isArray(rawData)) {
          throw new Error("JSON payload must be a top-level array of questions.");
        }
        parsedQuestions = rawData.map((item: any, i) => {
          if (!item.question || !Array.isArray(item.options) || item.options.length !== 4) {
            throw new Error(`Question at index ${i} requires 'question' string and 'options' array with 4 items.`);
          }
          return {
            question: String(item.question),
            options: item.options.map(String),
            answerIndex: typeof item.answerIndex === 'number' ? Math.min(Math.max(0, item.answerIndex), 3) : 0,
            explanation: String(item.explanation || 'Imported via JSON')
          };
        });
      } else {
        // Simple Quote-aware CSV parser
        const lines = importText.split(/\r?\n/).filter((l) => l.trim());
        parsedQuestions = lines.map((line, lineIdx) => {
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
          const cells = matches.map((cell) => cell.replace(/^["']|["']$/g, '').trim());
          
          if (cells.length < 6) {
            throw new Error(`CSV Line ${lineIdx + 1} has insufficient columns (Requires: question, optA, optB, optC, optD, answerIndex, explanation)`);
          }
          return {
            question: cells[0],
            options: [cells[1], cells[2], cells[3], cells[4]],
            answerIndex: Math.min(Math.max(0, parseInt(cells[5]) || 0), 3),
            explanation: cells[6] || 'Imported via CSV'
          };
        });
      }

      updateQuestions([...questions, ...parsedQuestions]);
      setImportText('');
      setImportError(null);
      setIsImportModalOpen(false);
      alert(`Successfully imported ${parsedQuestions.length} questions.`);
    } catch (err: any) {
      setImportError(err.message || "An error occurred during parsing");
    }
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
              Add curriculum assessments, bulk import question pools, and configure answers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-205 text-xs font-black px-4 py-2.5 rounded-xl transition-all text-slate-700 flex items-center gap-1.5 shadow-sm"
          >
            <Icons.Upload className="w-4 h-4 font-bold" />
            Bulk Import
          </button>
        </div>
      </div>

      {/* Main split splits */}
      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Pane 1: QUESTION LIST & PDF UPLOADS (25% width) */}
        <div className="w-72 bg-white border border-slate-205 rounded-3xl p-4 flex flex-col justify-between overflow-y-auto flex-shrink-0 gap-5 shadow-sm">
          
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
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

          {/* PDF Widget Block */}
          <div className="border-t border-slate-100 pt-4 flex-shrink-0 space-y-3 font-semibold">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block font-heading">
              Syllabus Reference PDF
            </span>

            {pdfInfo ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 text-[11px]">
                <div className="flex items-start gap-2.5">
                  <Icons.File className="w-4.5 h-4.5 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-slate-800 truncate" title={pdfInfo.filename}>
                      {pdfInfo.filename}
                    </p>
                    <p className="text-slate-500 text-[10px] mt-0.5 font-bold">
                      {pdfInfo.filesize} • Updated {pdfInfo.lastModified}
                    </p>
                  </div>
                  <button
                    onClick={() => setPdfInfo(null)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Icons.X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="bg-amber-50 border border-amber-250 text-amber-700 rounded-lg p-2 leading-normal">
                  PDF extraction service will be connected during backend integration.
                </div>
              </div>
            ) : (
              <label className="border border-dashed border-slate-200 hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/40 hover:bg-indigo-50/20 transition-all text-center">
                <Icons.UploadCloud className="w-6 h-6 text-slate-400" />
                <span className="text-[10px] font-black text-slate-600">Reference Question PDF</span>
                <span className="text-[9px] text-slate-450">File selection only</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePDFSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

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

      {/* BULK IMPORT MODAL */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-205 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative flex flex-col max-h-[85vh] text-slate-800">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-450 hover:text-slate-700 transition-colors"
              >
                <Icons.X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-black text-slate-900 font-heading tracking-tight mb-1">
                Bulk Question Importer
              </h3>
              <p className="text-[11px] text-slate-500 mb-4 font-semibold">
                Paste JSON or CSV formatted blocks to append multiple questions to the current module pool.
              </p>

              <div className="flex items-center gap-3 mb-4 font-black">
                <button
                  type="button"
                  onClick={() => {
                    setImportFormat('JSON');
                    setImportText('[\n  {\n    "question": "Example AWS IAM scenario?",\n    "options": ["A", "B", "C", "D"],\n    "answerIndex": 0,\n    "explanation": "Example explanation"\n  }\n]');
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[11px] font-black border transition-all",
                    importFormat === 'JSON'
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
                  )}
                >
                  JSON Format
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportFormat('CSV');
                    setImportText('"Example AWS EC2 scenario?","Choice A","Choice B","Choice C","Choice D",1,"Explanation message"\n"Another question scenario?","Choice A","Choice B","Choice C","Choice D",2,"Explanation message"');
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[11px] font-black border transition-all",
                    importFormat === 'CSV'
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
                  )}
                >
                  CSV Format
                </button>
              </div>

              <div className="flex-1 min-h-[200px] overflow-hidden flex flex-col gap-2 font-semibold">
                <textarea
                  rows={8}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={
                    importFormat === 'JSON'
                      ? '[\n  {\n    "question": "What service is...",\n    "options": ["S3", "EC2", "RDS", "VPC"],\n    "answerIndex": 0,\n    "explanation": "S3 stores files..."\n  }\n]'
                      : '"S3 is a...","Object storage","Block storage","Database","Cache",0,"S3 provides object storage"'
                  }
                  className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-xs font-mono focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed overflow-y-auto"
                />

                {importError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-[11px] p-3 rounded-xl flex items-center gap-2">
                    <Icons.AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{importError}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="bg-transparent hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold px-4 py-2.5 rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  className="bg-[#00cba9] hover:bg-[#00bda0] text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-lg transition-all"
                >
                  Import Questions
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
