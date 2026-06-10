'use client';

import React, { useState } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizAttempt {
  moduleId: string;
  moduleName: string;
  score: number;
  totalQuestions: number;
  attempts: number;
  date: string;
}

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  avatar: string;
  xp: number;
  streak: number;
  badges: { name: string; icon: string; color: string }[];
  completedModules: { id: string; name: string; date: string }[];
  quizHistory: QuizAttempt[];
}

const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 'student_1',
    name: 'Sarah Connor',
    email: 's.connor@university.edu',
    avatar: 'SC',
    xp: 2450,
    streak: 15,
    badges: [
      { name: 'Cloud Cadet', icon: 'Cloud', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      { name: 'IAM Guardian', icon: 'Shield', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
      { name: 'Compute Guru', icon: 'Cpu', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' }
    ],
    completedModules: [
      { id: 'fundamentals', name: 'AWS Fundamentals', date: '2026-06-01' },
      { id: 'ec2', name: 'Amazon EC2', date: '2026-06-03' },
      { id: 's3', name: 'Amazon S3', date: '2026-06-04' },
      { id: 'iam', name: 'AWS IAM', date: '2026-06-07' }
    ],
    quizHistory: [
      { moduleId: 'fundamentals', moduleName: 'AWS Fundamentals', score: 3, totalQuestions: 3, attempts: 1, date: '2026-06-01' },
      { moduleId: 'ec2', moduleName: 'Amazon EC2', score: 2, totalQuestions: 3, attempts: 2, date: '2026-06-03' },
      { moduleId: 's3', moduleName: 'Amazon S3', score: 4, totalQuestions: 4, attempts: 1, date: '2026-06-04' },
      { moduleId: 'iam', moduleName: 'AWS IAM', score: 3, totalQuestions: 3, attempts: 1, date: '2026-06-07' }
    ]
  },
  {
    id: 'student_2',
    name: 'Marcus Wright',
    email: 'm.wright@cloudclub.org',
    avatar: 'MW',
    xp: 1800,
    streak: 8,
    badges: [
      { name: 'Cloud Cadet', icon: 'Cloud', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      { name: 'S3 Voyager', icon: 'Database', color: 'bg-amber-50 text-amber-600 border-amber-100' }
    ],
    completedModules: [
      { id: 'fundamentals', name: 'AWS Fundamentals', date: '2026-06-02' },
      { id: 'ec2', name: 'Amazon EC2', date: '2026-06-05' },
      { id: 's3', name: 'Amazon S3', date: '2026-06-08' }
    ],
    quizHistory: [
      { moduleId: 'fundamentals', moduleName: 'AWS Fundamentals', score: 2, totalQuestions: 3, attempts: 1, date: '2026-06-02' },
      { moduleId: 'ec2', moduleName: 'Amazon EC2', score: 3, totalQuestions: 3, attempts: 1, date: '2026-06-05' },
      { moduleId: 's3', moduleName: 'Amazon S3', score: 3, totalQuestions: 4, attempts: 3, date: '2026-06-08' }
    ]
  },
  {
    id: 'student_3',
    name: 'John Connor',
    email: 'j.connor@cyberdyne.io',
    avatar: 'JC',
    xp: 2900,
    streak: 22,
    badges: [
      { name: 'Cloud Cadet', icon: 'Cloud', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      { name: 'VPC Master', icon: 'Network', color: 'bg-rose-50 text-rose-600 border-rose-100' },
      { name: 'RDS Expert', icon: 'Server', color: 'bg-violet-50 text-violet-605 border-violet-100' }
    ],
    completedModules: [
      { id: 'fundamentals', name: 'AWS Fundamentals', date: '2026-05-28' },
      { id: 'ec2', name: 'Amazon EC2', date: '2026-05-30' },
      { id: 's3', name: 'Amazon S3', date: '2026-06-01' },
      { id: 'iam', name: 'AWS IAM', date: '2026-06-03' },
      { id: 'vpc', name: 'Amazon VPC', date: '2026-06-05' },
      { id: 'rds', name: 'Amazon RDS', date: '2026-06-09' }
    ],
    quizHistory: [
      { moduleId: 'fundamentals', moduleName: 'AWS Fundamentals', score: 3, totalQuestions: 3, attempts: 1, date: '2026-05-28' },
      { moduleId: 'ec2', moduleName: 'Amazon EC2', score: 3, totalQuestions: 3, attempts: 1, date: '2026-05-30' },
      { moduleId: 's3', moduleName: 'Amazon S3', score: 4, totalQuestions: 4, attempts: 1, date: '2026-06-01' },
      { moduleId: 'iam', moduleName: 'AWS IAM', score: 3, totalQuestions: 3, attempts: 1, date: '2026-06-03' },
      { moduleId: 'vpc', moduleName: 'Amazon VPC', score: 4, totalQuestions: 5, attempts: 2, date: '2026-06-05' },
      { moduleId: 'rds', moduleName: 'Amazon RDS', score: 5, totalQuestions: 5, attempts: 1, date: '2026-06-09' }
    ]
  },
  {
    id: 'student_4',
    name: 'Kyle Reese',
    email: 'k.reese@resistance.net',
    avatar: 'KR',
    xp: 950,
    streak: 4,
    badges: [
      { name: 'Cloud Cadet', icon: 'Cloud', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
    ],
    completedModules: [
      { id: 'fundamentals', name: 'AWS Fundamentals', date: '2026-06-06' },
      { id: 'ec2', name: 'Amazon EC2', date: '2026-06-09' }
    ],
    quizHistory: [
      { moduleId: 'fundamentals', moduleName: 'AWS Fundamentals', score: 2, totalQuestions: 3, attempts: 2, date: '2026-06-06' },
      { moduleId: 'ec2', moduleName: 'Amazon EC2', score: 2, totalQuestions: 3, attempts: 1, date: '2026-06-09' }
    ]
  },
  {
    id: 'student_5',
    name: 'Dr. Peter Silberman',
    email: 'silberman@hospital.org',
    avatar: 'PS',
    xp: 450,
    streak: 0,
    badges: [],
    completedModules: [
      { id: 'fundamentals', name: 'AWS Fundamentals', date: '2026-06-08' }
    ],
    quizHistory: [
      { moduleId: 'fundamentals', moduleName: 'AWS Fundamentals', score: 1, totalQuestions: 3, attempts: 3, date: '2026-06-08' }
    ]
  }
];

export default function LearnersDirectoryPage() {
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.badges.some((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

  return (
    <div className="space-y-6">
      
      {/* Page Title & Counters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight font-heading">
            Learners Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Monitor cloud explorer scores, achievements, streaks, and individual module quiz attempts.
          </p>
        </div>

        {/* Search Input Widget */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search student or badge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
          />
          <Icons.Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
        </div>
      </div>

      {/* Class Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Explorers', value: students.length, icon: Icons.Users, color: 'text-indigo-650 bg-white border-slate-200 shadow-sm' },
          { label: 'Average Class XP', value: Math.round(students.reduce((acc, curr) => acc + curr.xp, 0) / students.length), icon: Icons.Zap, color: 'text-amber-600 bg-white border-slate-200 shadow-sm' },
          { label: 'Modules Completed', value: students.reduce((acc, curr) => acc + curr.completedModules.length, 0), icon: Icons.Layers, color: 'text-emerald-600 bg-white border-slate-200 shadow-sm' },
          { label: 'Active Streaks', value: students.filter((s) => s.streak > 0).length, icon: Icons.Calendar, color: 'text-rose-600 bg-white border-slate-200 shadow-sm' }
        ].map((stat, idx) => (
          <div key={idx} className={cn("border rounded-2xl p-4 flex items-center justify-between", stat.color)}>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider font-heading">
                {stat.label}
              </span>
              <span className="text-xl font-black text-slate-800 block">
                {stat.value}
              </span>
            </div>
            <stat.icon className="w-8 h-8 opacity-45" />
          </div>
        ))}
      </div>

      {/* Professional Data Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-450 bg-slate-50/50">
                <th className="py-4 px-6">Learner Account</th>
                <th className="py-4 px-6 text-center">XP Reward</th>
                <th className="py-4 px-6 text-center">Active Streak</th>
                <th className="py-4 px-6">Completed Modules</th>
                <th className="py-4 px-6">Accrued Badges</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  {/* Account Name & Email */}
                  <td className="py-4 px-6 flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-650 border border-indigo-100 flex items-center justify-center font-black text-xs">
                      {student.avatar}
                    </div>
                    <div>
                      <span className="text-slate-800 font-extrabold block group-hover:text-indigo-600 transition-colors">
                        {student.name}
                      </span>
                      <span className="text-slate-400 text-[10px] block mt-0.5 font-bold">
                        {student.email}
                      </span>
                    </div>
                  </td>

                  {/* XP */}
                  <td className="py-4 px-6 text-center">
                    <span className="text-amber-600 font-black">
                      {student.xp}
                    </span>
                  </td>

                  {/* Streak */}
                  <td className="py-4 px-6 text-center">
                    <span className="flex items-center justify-center gap-1 text-rose-600 font-black">
                      <Icons.Flame className="w-3.5 h-3.5 fill-current" />
                      {student.streak}d
                    </span>
                  </td>

                  {/* Completed Modules count */}
                  <td className="py-4 px-6">
                    <span className="text-slate-600 font-semibold">
                      {student.completedModules.length} Modules completed
                    </span>
                  </td>

                  {/* Badges list */}
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                      {student.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            "text-[9px] font-black border px-2 py-0.5 rounded-md tracking-wider uppercase whitespace-nowrap",
                            badge.color
                          )}
                        >
                          {badge.name}
                        </span>
                      ))}
                      {student.badges.length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">No badges earned</span>
                      )}
                    </div>
                  </td>

                  {/* Quick Action Button */}
                  <td className="py-4 px-6 text-right">
                    <button className="text-[10px] font-black text-indigo-650 hover:text-indigo-550 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 ml-auto">
                      View Profile
                      <Icons.ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 text-xs italic">
                    No matching student accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SELECTED STUDENT DETAILS SIDE DRAWER */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudentId(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Slide drawer container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col justify-between shadow-2xl p-6 overflow-y-auto"
            >
              
              <div className="space-y-6">
                {/* Header Profile */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center font-black text-base shadow-lg shadow-indigo-500/10">
                      {selectedStudent.avatar}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 font-heading">
                        {selectedStudent.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {selectedStudent.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStudentId(null)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-250 border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <Icons.X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub details card */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-heading block">
                      XP Balance
                    </span>
                    <span className="text-base font-black text-amber-600 mt-1 block">
                      {selectedStudent.xp} XP
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-heading block">
                      Active Streak
                    </span>
                    <span className="text-base font-black text-rose-600 mt-1 block flex items-center gap-1">
                      <Icons.Flame className="w-4 h-4 fill-current text-rose-500" />
                      {selectedStudent.streak} Days
                    </span>
                  </div>
                </div>

                {/* Completed Modules list */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block font-heading">
                    Completed Islands ({selectedStudent.completedModules.length})
                  </span>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin text-xs">
                    {selectedStudent.completedModules.map((mod, idx) => (
                      <div key={idx} className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-slate-700">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                            <Icons.Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="font-extrabold">{mod.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">{mod.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quiz History attempt records */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block font-heading">
                    Assessment Attempt Records
                  </span>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin text-xs">
                    {selectedStudent.quizHistory.map((quiz, idx) => {
                      const percentage = Math.round((quiz.score / quiz.totalQuestions) * 100);
                      const isPassing = percentage >= 70;
                      return (
                        <div key={idx} className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 space-y-2 text-slate-700">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-800 truncate max-w-[200px]">
                              {quiz.moduleName}
                            </span>
                            <span className={cn(
                              "text-[9px] font-black px-2 py-0.5 border rounded-md uppercase tracking-wider",
                              isPassing
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                              {percentage}% Correct
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-200/50">
                            <span>Score: {quiz.score} / {quiz.totalQuestions}</span>
                            <span>Attempts: {quiz.attempts}</span>
                            <span>Date: {quiz.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Reset simulator context button */}
              <div className="pt-6 border-t border-slate-200 mt-6 flex-shrink-0">
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-black text-xs py-3 rounded-2xl text-center transition-all shadow-sm"
                >
                  Close Profile Overview
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
