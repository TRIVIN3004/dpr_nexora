import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function WelcomeLoader() {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing GoNexora Core...');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 22); // ~2.2s smooth loading

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 25) {
      setStatusText('Initializing GoNexora Core Services...');
    } else if (progress < 55) {
      setStatusText('Securing Workspace Session...');
    } else if (progress < 85) {
      setStatusText('Synchronizing Reports & Attendance...');
    } else {
      setStatusText('Launching Workspace Viewport...');
    }
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#070b19] overflow-hidden select-none">
      {/* Dynamic Animated Ambient Background Glows */}
      <motion.div 
        animate={{ 
          scale: [1, 1.25, 1],
          opacity: [0.2, 0.35, 0.2]
        }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-indigo-600/25 blur-[140px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1.25, 1, 1.25],
          opacity: [0.2, 0.35, 0.2]
        }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
        className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-cyan-600/25 blur-[140px] pointer-events-none" 
      />

      {/* Futuristic Geometric Dot/Grid Matrix */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] opacity-70 pointer-events-none" />

      {/* Main Container */}
      <div className="relative flex flex-col items-center justify-center max-w-md w-full px-6 text-center space-y-7 z-10">
        
        {/* Sleek Brand Logo with Multi-Layered Neon Glow Rings (Increased Size & Glow) */}
        <div className="relative flex items-center justify-center h-44 w-44 md:h-48 md:w-48 my-1">
          {/* Outer glowing pulsing neon aura */}
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.6, 0.9, 0.6]
            }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-indigo-500/25 blur-2xl pointer-events-none"
          />

          {/* Outer high-voltage neon spinning ring */}
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.04, 1] }}
            transition={{ rotate: { repeat: Infinity, duration: 4.5, ease: 'linear' }, scale: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' } }}
            className="absolute inset-0 rounded-full border-2 border-indigo-400 border-t-cyan-300 border-b-fuchsia-400 shadow-[0_0_45px_rgba(99,102,241,0.7),0_0_75px_rgba(56,189,248,0.45)]"
          />

          {/* Middle counter-rotating neon dashed ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            className="absolute inset-2.5 rounded-full border-2 border-dashed border-cyan-400 border-r-indigo-400 shadow-[0_0_30px_rgba(34,211,238,0.7)] opacity-95"
          />

          {/* Inner tertiary neon glow orbital */}
          <motion.div
            animate={{ rotate: 180 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="absolute inset-4.5 rounded-full border border-indigo-300/70 shadow-[0_0_20px_rgba(129,140,248,0.6)]"
          />
          
          {/* Circle Logo Badge (Increased Size) */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="p-1 rounded-full bg-black border-2 border-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.8),0_0_65px_rgba(56,189,248,0.5)] relative z-10 h-32 w-32 md:h-36 md:w-36 flex items-center justify-center overflow-hidden"
          >
            <img 
              src="/logo.png" 
              alt="GoNexora Techs Logo" 
              className="h-full w-full object-cover rounded-full drop-shadow-2xl scale-105" 
            />
          </motion.div>
        </div>

        {/* Clear, High-Contrast Typography */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide font-sans drop-shadow-lg">
            GONEXORA TECHS
          </h1>
          
          <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-black tracking-widest text-indigo-300 uppercase">
            <span>Building Tomorrow, Today</span>
          </div>

          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] font-bold text-slate-300 tracking-wider">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              DPR & Attendance Portal
            </span>
          </div>
        </motion.div>

        {/* Loading Progress Wrapper */}
        <div className="w-full max-w-xs space-y-2.5 pt-1">
          {/* Dynamic loading text description */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold tracking-wide h-4">
            <motion.span
              key={statusText}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className="truncate max-w-[200px]"
            >
              {statusText}
            </motion.span>
            <span className="text-indigo-400 font-mono font-black">{progress}%</span>
          </div>

          {/* Sleek loading bar track */}
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <motion.div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
