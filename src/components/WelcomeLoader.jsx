import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function WelcomeLoader() {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Supabase handshake...');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 25); // ~2.5 seconds to reach 100%

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 25) {
      setStatusText('Initializing Supabase handshake...');
    } else if (progress < 55) {
      setStatusText('Securing workspace sessions...');
    } else if (progress < 85) {
      setStatusText('Synchronizing reports registry...');
    } else {
      setStatusText('Deploying dashboard viewport...');
    }
  }, [progress]);

  // Framer Motion variant for text letters
  const logoTextVariants = {
    initial: { letterSpacing: '0.1em', opacity: 0, scale: 0.95 },
    animate: { 
      letterSpacing: '0.45em', 
      opacity: 1, 
      scale: 1,
      transition: { duration: 2.2, ease: 'easeOut' }
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#070b19] overflow-hidden select-none">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[45vw] h-[45vw] rounded-full bg-nexora-purple/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[45vw] h-[45vw] rounded-full bg-nexora-blue/5 blur-[120px] pointer-events-none" />

      {/* Futuristic Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:30px_30px] opacity-60 pointer-events-none" />

      {/* Main Container */}
      <div className="relative flex flex-col items-center justify-center max-w-sm w-full px-8 text-center space-y-8 z-10">
        
        {/* Glowing Spinner Orb */}
        <div className="relative flex items-center justify-center h-24 w-24">
          {/* Animated Neon Rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-t-nexora-purple border-r-transparent border-b-nexora-blue border-l-transparent shadow-[0_0_15px_rgba(168,85,247,0.25)]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            className="absolute inset-2 rounded-full border border-t-transparent border-r-nexora-blue border-b-transparent border-l-nexora-purple opacity-65"
          />
          
          {/* Logo center image */}
          <div className="p-3.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-inner relative z-10 h-16 w-16 flex items-center justify-center">
            <img src="/logo.png" alt="Nexora Logo" className="h-9 w-9 object-contain" />
          </div>
        </div>

        {/* Brand/Logo header with glowing typography */}
        <div className="space-y-2">
          <motion.h1
            variants={logoTextVariants}
            initial="initial"
            animate="animate"
            className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-widest font-sans drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mr-[-0.45em]"
          >
            NEXORA
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.5, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-sans"
          >
            Daily Progress Report Portal
          </motion.p>
        </div>

        {/* Loading Progress Wrapper */}
        <div className="w-full space-y-3 pt-4">
          {/* Dynamic loading text description */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider h-4">
            <motion.span
              key={statusText}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-slate-450"
            >
              {statusText}
            </motion.span>
            <span className="text-nexora-purple/95">{progress}%</span>
          </div>

          {/* Sleek loading bar track */}
          <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-950/50">
            <motion.div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-nexora-blue via-nexora-purple to-pink-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)]"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
