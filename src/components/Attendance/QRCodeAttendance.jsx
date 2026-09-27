import React, { useState } from 'react';
import { QrCode, Scan, CheckCircle2, ShieldAlert, Sparkles, RefreshCw, Loader2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QRCodeAttendance({ currentUser, onScanComplete }) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const triggerSimulatedScan = () => {
    setScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setScanning(false);
      const currentTime = new Date().toLocaleTimeString();
      setScanResult({
        success: true,
        message: `QR Verified: ${currentUser?.name} (${currentUser?.id})`,
        time: currentTime,
        status: 'Present'
      });
      if (onScanComplete) {
        onScanComplete('QR Code');
      }
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl border border-slate-200 dark:border-white/15 shadow-xl bg-white dark:bg-white/[0.07] backdrop-blur-2xl relative overflow-hidden text-left">
      
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
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-emerald-500 flex flex-col items-center text-center space-y-5 relative"
            >
              <button
                onClick={() => setScanResult(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative flex items-center justify-center h-20 w-20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 border-2 border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-emerald-950"
                >
                  <CheckCircle2 className="h-11 w-11 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-black">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  QR Attendance Verified
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Attendance Marked Successfully!
                </h3>
                <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                  {currentUser?.name} • {currentUser?.id}
                </p>
              </div>

              <div className="w-full bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Time Verified:</span>
                  <span className="font-black text-slate-900 dark:text-white font-mono text-sm">{scanResult.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Attendance Status:</span>
                  <span className="font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                    Present (QR Verified)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Department:</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">{currentUser?.department || 'Engineering'}</span>
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

      {/* Left: Employee QR Badge Generator */}
      <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-200 dark:border-white/10 text-center space-y-4 bg-slate-50 dark:bg-slate-900/40">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-[#818cf8] border border-indigo-200 dark:border-indigo-800/60">
          <Sparkles className="h-3.5 w-3.5" />
          Digital Employee Badge
        </div>

        <div className="relative p-4 rounded-2xl shadow-md border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
          <div className="w-44 h-44 p-2 rounded-xl flex flex-col justify-between items-center relative overflow-hidden bg-black">
            <div className="grid grid-cols-6 gap-1 w-full h-full p-2 rounded bg-white">
              {Array.from({ length: 36 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`rounded-xs ${
                    (i % 2 === 0 || i % 7 === 0 || i === 0 || i === 5 || i === 30 || i === 35) 
                      ? 'bg-slate-950' 
                      : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-1 rounded-xl border shadow bg-black border-slate-700">
                <img src="/logo.png" alt="Logo" className="h-7 w-7 rounded object-contain bg-black" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">{currentUser?.name}</h4>
          <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">{currentUser?.id} • {currentUser?.department || 'Engineering'}</p>
        </div>
      </div>

      {/* Right: Live QR Scanner Simulation */}
      <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-200 dark:border-white/10 text-center space-y-4 relative bg-slate-50 dark:bg-slate-900/40">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
          Badge Camera Scanner
        </h4>

        <div className="relative w-56 h-56 rounded-2xl border-2 border-dashed border-indigo-400 dark:border-indigo-500/70 bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden">
          {scanning ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <motion.div 
                animate={{ y: [-100, 100, -100] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="absolute w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent shadow"
              />
              <Scan className="h-12 w-12 text-indigo-600 dark:text-[#818cf8] animate-pulse" />
              <span className="text-xs font-mono mt-3 animate-pulse font-bold text-indigo-600 dark:text-indigo-400">Scanning QR Badge...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-4">
              <QrCode className="h-12 w-12 text-indigo-600 dark:text-[#818cf8]" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Align QR Code within the frame to verify</span>
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={triggerSimulatedScan}
          disabled={scanning}
          className="py-2.5 px-5 rounded-xl text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm bg-indigo-600 hover:bg-indigo-500"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Scanning...' : 'Simulate QR Check-In'}</span>
        </motion.button>
      </div>

    </div>
  );
}
