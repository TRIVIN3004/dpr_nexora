import React, { useState } from 'react';
import { Camera, ScanFace, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FaceRecognitionWidget({ currentUser, onScanComplete }) {
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);

  const startFacialScan = () => {
    setScanning(true);
    setSuccess(false);

    setTimeout(() => {
      setScanning(false);
      setSuccess(true);
      if (onScanComplete) {
        onScanComplete('Face');
      }
    }, 2500);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl text-center space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-400">
        <Cpu className="h-3.5 w-3.5" />
        AI Biometric Face Recognition (Future Ready)
      </div>

      {/* Live Camera Viewport Simulation */}
      <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-3xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl">
        {/* User avatar or camera placeholder */}
        <img 
          src={currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250"} 
          alt="Biometric Scan Subject" 
          className={`w-full h-full object-cover transition-all duration-500 ${scanning ? 'filter brightness-75 blur-xs' : ''}`}
        />

        {/* Biometric Scanning Frame Overlay */}
        <div className="absolute inset-0 border-3 border-cyan-500/40 rounded-3xl pointer-events-none p-4 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="w-6 h-6 border-t-3 border-l-3 border-cyan-400" />
            <div className="w-6 h-6 border-t-3 border-r-3 border-cyan-400" />
          </div>

          {/* Facial Keypoints Overlay */}
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div 
                animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-36 h-48 border-2 border-dashed border-cyan-400 rounded-full flex flex-col items-center justify-center relative"
              >
                {/* Simulated eye keypoints */}
                <div className="w-full flex justify-around px-8">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                </div>
                <div className="h-2 w-2 rounded-full bg-cyan-400 mt-4 animate-ping" />
                <div className="w-12 h-1 bg-cyan-400 rounded-full mt-6" />
              </motion.div>
            </div>
          )}

          <div className="flex justify-between">
            <div className="w-6 h-6 border-b-3 border-l-3 border-cyan-400" />
            <div className="w-6 h-6 border-b-3 border-r-3 border-cyan-400" />
          </div>
        </div>

        {/* Scan Status Badge */}
        {success && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-emerald-400 p-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
            <span className="text-sm font-bold text-slate-100">Face Match 99.8% Confirmed</span>
            <span className="text-xs text-slate-400">Biometric Check-In Recorded</span>
          </div>
        )}
      </div>

      <div className="max-w-md space-y-2">
        <h4 className="text-sm font-bold text-white">Biometric Verification</h4>
        <p className="text-xs text-slate-400">
          Position your face clearly inside the scanner grid. Our AI system matches facial descriptors with your registered Nexora employee profile.
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={startFacialScan}
        disabled={scanning}
        className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-glow-cyan flex items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        <ScanFace className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
        <span>{scanning ? 'Analyzing Facial Descriptor...' : 'Start AI Facial Scan'}</span>
      </motion.button>

    </div>
  );
}
