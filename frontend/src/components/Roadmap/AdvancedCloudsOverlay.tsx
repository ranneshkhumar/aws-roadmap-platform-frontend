'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedCloudsOverlayProps {
  locked: boolean;
}

export const AdvancedCloudsOverlay: React.FC<AdvancedCloudsOverlayProps> = ({ locked }) => {
  // Define 5 high-quality, sparse clouds stretched across the new advanced region (y: 3200px to 4750px)
  const clouds = [
    { id: 'adv-cloud-1', left: '8%', top: '150px', width: 360, height: 160, driftX: [-15, 15, -15], driftY: [-6, 8, -6], duration: 15, grad: 'adv-grad-dark', partDir: -1 },
    { id: 'adv-cloud-2', left: '22%', top: '480px', width: 400, height: 170, driftX: [-20, 20, -20], driftY: [-8, 10, -8], duration: 19, grad: 'adv-grad-medium', partDir: -1 },
    { id: 'adv-cloud-3', left: '68%', top: '800px', width: 380, height: 160, driftX: [18, -12, 18], driftY: [-7, 8, -7], duration: 16, grad: 'adv-grad-light', partDir: 1 },
    { id: 'adv-cloud-4', left: '48%', top: '1100px', width: 420, height: 180, driftX: [22, -15, 22], driftY: [-9, 11, -9], duration: 21, grad: 'adv-grad-dark', partDir: 1 },
    { id: 'adv-cloud-5', left: '60%', top: '1380px', width: 370, height: 160, driftX: [15, -15, 15], driftY: [-6, 7, -6], duration: 17, grad: 'adv-grad-medium', partDir: 1 },
  ];

  return (
    <div 
      className={cn(
        "absolute top-[3200px] left-0 right-0 h-[1600px] z-30 select-none overflow-hidden transition-all duration-1000",
        locked ? "pointer-events-auto" : "pointer-events-none"
      )}
      style={locked ? {
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)'
      } : undefined}
    >
      {/* Linear Gradients Definition */}
      <svg className="absolute w-0 h-0">
        <defs>
          <linearGradient id="adv-grad-dark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.99" />
            <stop offset="60%" stopColor="#0f172a" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.97" />
          </linearGradient>
          <linearGradient id="adv-grad-medium" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#27272a" stopOpacity="0.99" />
            <stop offset="60%" stopColor="#18181b" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0.97" />
          </linearGradient>
          <linearGradient id="adv-grad-light" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3f3f46" stopOpacity="0.98" />
            <stop offset="60%" stopColor="#27272a" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#18181b" stopOpacity="0.94" />
          </linearGradient>
        </defs>
      </svg>

      <AnimatePresence>
        {locked && (
          <>
            {/* Soft dark atmospheric mist overlay (blends smoothly at edges due to parent mask-image) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.28 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-slate-950 pointer-events-none"
            />

            {/* Cloud layers */}
            {clouds.map((cloud) => (
              <motion.div
                key={cloud.id}
                className="absolute drop-shadow-[0_15px_25px_rgba(0,0,0,0.55)]"
                style={{
                  left: cloud.left,
                  top: cloud.top,
                  width: cloud.width,
                  height: cloud.height,
                }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: cloud.driftX,
                  y: cloud.driftY,
                }}
                exit={{
                  x: cloud.partDir * 500,
                  opacity: 0,
                  scale: 0.9,
                  transition: { duration: 1.5, ease: 'easeOut' }
                }}
                transition={{
                  x: { repeat: Infinity, duration: cloud.duration, ease: 'easeInOut' },
                  y: { repeat: Infinity, duration: cloud.duration, ease: 'easeInOut' },
                  opacity: { duration: 0.8 },
                  scale: { duration: 0.8 },
                }}
              >
                <svg
                  viewBox="0 0 200 100"
                  fill={`url(#${cloud.grad})`}
                  className="w-full h-full stroke-slate-800/20"
                  strokeWidth="1"
                >
                  <path d="M 30,70 
                           A 20,20 0 0,1 60,40 
                           A 25,25 0 0,1 110,30 
                           A 22,22 0 0,1 150,45 
                           A 18,18 0 0,1 180,70 
                           A 10,10 0 0,1 170,80 
                           L 30,80 
                           A 10,10 0 0,1 30,70 Z" />
                  
                  <path 
                    d="M 45,72 C 55,75 85,75 95,70 C 105,75 135,75 140,68 C 145,58 145,45 135,40 C 130,30 110,35 105,35 C 95,25 75,30 70,38 C 60,35 45,42 48,55 C 42,60 42,68 45,72 Z" 
                    fill="#FFFFFF" 
                    opacity="0.03" 
                  />
                </svg>
              </motion.div>
            ))}

            {/* Locked Region Header & Overlay Info */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -30, transition: { duration: 0.6 } }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center text-center p-8 max-w-sm rounded-3xl bg-slate-950/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl"
            >
              <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-slate-900 border border-white/5 mb-4 shadow-inner">
                <div className="absolute -inset-1.5 border border-dashed border-slate-700 rounded-full animate-[spin_15s_linear_infinite] opacity-40" />
                <Icons.Lock className="w-7 h-7 text-slate-500 animate-pulse" />
              </div>
              <h3 className="text-base font-black text-slate-200 tracking-wider font-heading uppercase">
                Advanced Region
              </h3>
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-slate-650 to-transparent my-2" />
              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[280px]">
                Hidden in deep storm clouds. Complete all 6 Intermediate modules to disperse the storm.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
