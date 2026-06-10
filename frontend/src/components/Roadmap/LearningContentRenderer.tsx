'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearningContentRendererProps {
  title: string;
  bullets: string[];
  layout?: 'text-only' | 'text-image' | 'image-only';
  iconName: string;
  imageUrl?: string;
}

// Interactive Inline SVG Illustrations for Layouts
const SecurityIllustration: React.FC = () => (
  <svg viewBox="0 0 200 180" className="w-full max-h-[160px] text-emerald-500 drop-shadow-md">
    <rect x="20" y="20" width="160" height="140" rx="16" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
    <path d="M 100,50 C 120,50 135,62 135,80 C 135,115 100,135 100,135 C 100,135 65,115 65,80 C 65,62 80,50 100,50 Z" fill="#10B981" opacity="0.85" />
    <path d="M 100,58 C 115,58 127,67 127,80 C 127,108 100,124 100,124 C 100,124 73,108 73,80 C 73,67 85,58 100,58 Z" fill="none" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="100" cy="82" r="6" fill="#FFFFFF" />
    <path d="M 97,87 L 103,87 L 105,102 L 95,102 Z" fill="#FFFFFF" />
    <line x1="45" y1="45" x2="65" y2="65" stroke="#34D399" strokeWidth="2" strokeDasharray="4 4" />
    <line x1="155" y1="45" x2="135" y2="65" stroke="#34D399" strokeWidth="2" strokeDasharray="4 4" />
    <line x1="100" y1="135" x2="100" y2="150" stroke="#34D399" strokeWidth="2" />
  </svg>
);

const DatabaseIllustration: React.FC = () => (
  <svg viewBox="0 0 200 180" className="w-full max-h-[160px] text-cyan-500 drop-shadow-md">
    <rect x="20" y="20" width="160" height="140" rx="16" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
    <g transform="translate(60, 45)">
      <rect x="0" y="0" width="80" height="20" rx="8" fill="#0284C7" />
      <ellipse cx="40" cy="0" rx="40" ry="10" fill="#38BDF8" />
    </g>
    <g transform="translate(60, 75)">
      <rect x="0" y="0" width="80" height="20" rx="8" fill="#0284C7" />
      <ellipse cx="40" cy="0" rx="40" ry="10" fill="#38BDF8" />
    </g>
    <g transform="translate(60, 105)">
      <rect x="0" y="0" width="80" height="20" rx="8" fill="#0284C7" />
      <ellipse cx="40" cy="0" rx="40" ry="10" fill="#38BDF8" />
    </g>
    <circle cx="100" cy="30" r="4" fill="#38BDF8" />
    <path d="M 40,65 L 55,65" stroke="#38BDF8" strokeWidth="2" />
    <path d="M 160,95 L 145,95" stroke="#38BDF8" strokeWidth="2" />
  </svg>
);

const ArchitectureIllustration: React.FC = () => (
  <svg viewBox="0 0 200 180" className="w-full max-h-[160px] text-indigo-500 drop-shadow-md">
    <rect x="20" y="20" width="160" height="140" rx="16" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
    <path d="M45,70 C35,70 30,60 38,50 C30,40 45,30 65,35 C75,20 100,25 105,38 C120,30 135,45 125,60 C135,70 120,80 105,80 C95,80 85,75 75,80 Z" fill="#6366F1" opacity="0.8" />
    <rect x="50" y="95" width="45" height="30" rx="6" fill="#4F46E5" />
    <circle cx="60" cy="110" r="3" fill="#818CF8" />
    <line x1="72" y1="110" x2="87" y2="110" stroke="#818CF8" strokeWidth="2" />
    <rect x="105" y="95" width="45" height="30" rx="6" fill="#4F46E5" />
    <circle cx="115" cy="110" r="3" fill="#818CF8" />
    <line x1="127" y1="110" x2="142" y2="110" stroke="#818CF8" strokeWidth="2" />
    <path d="M75,80 L72,95" stroke="#818CF8" strokeWidth="2" strokeDasharray="3 3" />
    <path d="M105,80 L127,95" stroke="#818CF8" strokeWidth="2" strokeDasharray="3 3" />
  </svg>
);

export const LearningContentRenderer: React.FC<LearningContentRendererProps> = ({
  title,
  bullets,
  layout = 'text-only',
  iconName,
  imageUrl
}) => {
  const renderIllustration = () => {
    const name = iconName.toLowerCase();
    if (name.includes('shield') || name.includes('lock') || name.includes('key') || name.includes('iam')) {
      return <SecurityIllustration />;
    }
    if (name.includes('database') || name.includes('server') || name.includes('rds') || name.includes('dynamo')) {
      return <DatabaseIllustration />;
    }
    return <ArchitectureIllustration />;
  };

  const renderVisual = () => {
    if (imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full max-h-[160px] object-contain rounded-lg drop-shadow-md"
        />
      );
    }
    return renderIllustration();
  };

  if (layout === 'image-only') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-950 tracking-tight">{title}</h3>
        <div className="flex flex-col items-center justify-center bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-inner">
          {renderVisual()}
          <span className="text-[10px] font-semibold text-slate-500 mt-4 tracking-wider uppercase">
            Architectural Diagram
          </span>
        </div>
      </div>
    );
  }

  if (layout === 'text-image') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-950 tracking-tight">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          <div className="space-y-3.5">
            {bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Icons.CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{bullet}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-inner flex items-center justify-center">
            {renderVisual()}
          </div>
        </div>
      </div>
    );
  }

  // Default: text-only
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black text-slate-950 tracking-tight">{title}</h3>
      <div className="bg-white/80 border border-slate-200 rounded-2xl p-5 space-y-4 min-h-[180px] shadow-sm flex flex-col justify-center">
        {bullets.map((bullet, idx) => (
          <div key={idx} className="flex items-start gap-3.5">
            <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Icons.CheckCircle2 className="w-3.5 h-3.5 fill-current" />
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
