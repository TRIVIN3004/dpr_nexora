import React, { useState } from 'react';
import { Camera, ScanFace, CheckCircle2, ShieldCheck, Cpu, Sparkles, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FaceRecognitionWidget({ currentUser, onScanComplete }) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const startFacialScan = () => {
    setScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setScanning(false);
      const currentTime = new Date().toLocaleTimeString();
      setScanResult({
        success: true,
        matchScore: '99.8%',
        time: currentTime,
        message: `Biometric Match Confirmed: ${currentUser?.name} (${currentUser?.id})`,
        status: 'Present'
      });
      if (onScanComplete) {
        onScanComplete('Face');
      }
    }, 2500);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl border shadow-md text-center space-y-6 bg-white relative overflow-hidden" style={{ borderColor: '#cbd5e1' }}>
      
      {/* Centered In-Widget Notification Overlay */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-emerald-500 flex flex-col items-center text-center space-y-5 relative"
            >
              <button
                onClick={() => setScanResult(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative flex items-center justify-center h-20 w-20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border-2 border-emerald-300 shadow-lg shadow-emerald-200"
                >
                  <CheckCircle2 className="h-11 w-11 text-emerald-600" />
                </motion.div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  AI Facial Recognition Verified
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Attendance Marked Successfully!
                </h3>
                <p className="text-xs font-extrabold text-slate-500">
                  {currentUser?.name} • {currentUser?.id}
                </p>
              </div>

              <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Biometric Match:</span>
                  <span className="font-black text-emerald-700 font-mono text-sm">{scanResult.matchScore} Precision</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Time Verified:</span>
                  <span className="font-black text-slate-900 font-mono text-sm">{scanResult.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Attendance Status:</span>
                  <span className="font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Present (Face Biometric)
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setScanResult(null)}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Done & Continue</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold" style={{ backgroundColor: '#ecfeff', color: '#0891b2', border: '1px solid #a5f3fc' }}>
        <Cpu className="h-3.5 w-3.5 text-cyan-600" />
        AI Biometric Face Recognition (GoNexora Cloud)
      </div>

      {/* Live Camera Viewport Simulation */}
      <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-3xl border-2 flex items-center justify-center overflow-hidden shadow-lg" style={{ backgroundColor: '#0f172a', borderColor: '#cbd5e1' }}>
        <img 
          src={currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250"} 
          alt="Biometric Scan Subject" 
          className={`w-full h-full object-cover transition-all duration-500 ${scanning ? 'filter brightness-75 blur-xs' : ''}`}
        />

        {/* Biometric Scanning Frame Overlay */}
        <div className="absolute inset-0 border-3 border-cyan-400 rounded-3xl pointer-events-none p-4 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="w-6 h-6 border-t-3 border-l-3 border-cyan-400" />
            <div className="w-6 h-6 border-t-3 border-r-3 border-cyan-400" />
          </div>

          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div 
                animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-36 h-48 border-2 border-dashed border-cyan-400 rounded-full flex flex-col items-center justify-center relative"
              >
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
      </div>

      <div className="max-w-md space-y-2">
        <h4 className="text-sm font-extrabold" style={{ color: '#090d16' }}>Biometric Verification</h4>
        <p className="text-xs font-bold" style={{ color: '#334155' }}>
          Position your face clearly inside the scanner grid. Our AI system matches facial descriptors with your registered employee profile.
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={startFacialScan}
        disabled={scanning}
        className="py-3 px-6 rounded-xl text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
        style={{ backgroundColor: '#0284c7', color: '#ffffff' }}
      >
        <ScanFace className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
        <span>{scanning ? 'Analyzing Facial Descriptor...' : 'Start AI Facial Scan'}</span>
      </motion.button>

    </div>
  );
}

