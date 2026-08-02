import React, { useState } from 'react';
import { QrCode, Scan, CheckCircle, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QRCodeAttendance({ currentUser, onScanComplete }) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const triggerSimulatedScan = () => {
    setScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setScanning(false);
      setScanResult({
        success: true,
        message: `QR Verified: ${currentUser?.name} (${currentUser?.id})`,
        time: new Date().toLocaleTimeString()
      });
      if (onScanComplete) {
        onScanComplete('QR Code');
      }
    }, 2000);
  };

  // Generate SVG QR Code representation
  const qrData = `NEXORA-EMP:${currentUser?.id || 'EMP-001'}:${currentUser?.name || 'User'}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
      
      {/* Left: Employee QR Badge Generator */}
      <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-950/80 border border-slate-800/80 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexora-purple/10 border border-nexora-purple/30 text-xs font-semibold text-nexora-purple">
          <Sparkles className="h-3.5 w-3.5" />
          Digital Employee Badge
        </div>

        <div className="relative p-4 rounded-2xl bg-white shadow-2xl border-4 border-slate-800">
          {/* Visual QR Code Pattern */}
          <div className="w-44 h-44 bg-slate-950 p-2 rounded-lg flex flex-col justify-between items-center relative overflow-hidden">
            <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-white rounded">
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
              <div className="p-1 bg-slate-950 rounded-lg border border-slate-800">
                <img src="/logo.png" alt="Logo" className="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white">{currentUser?.name}</h4>
          <p className="text-xs text-slate-400 font-mono">{currentUser?.id} • {currentUser?.department || 'Engineering'}</p>
        </div>
      </div>

      {/* Right: Live QR Scanner Simulation */}
      <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-950/80 border border-slate-800/80 text-center space-y-4 relative">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Badge Camera Scanner
        </h4>

        <div className="relative w-56 h-56 rounded-2xl bg-slate-900 border-2 border-dashed border-nexora-purple/40 flex items-center justify-center overflow-hidden">
          {scanning ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Laser scanning beam animation */}
              <motion.div 
                animate={{ y: [-100, 100, -100] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-glow-cyan"
              />
              <Scan className="h-12 w-12 text-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-400 font-mono mt-3 animate-pulse">Scanning QR Badge...</span>
            </div>
          ) : scanResult ? (
            <div className="flex flex-col items-center gap-2 p-4 text-emerald-400">
              <CheckCircle className="h-10 w-10" />
              <span className="text-xs font-bold text-slate-100">{scanResult.message}</span>
              <span className="text-[10px] text-slate-400 font-mono">Logged at {scanResult.time}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-4 text-slate-500">
              <QrCode className="h-12 w-12 text-slate-600" />
              <span className="text-xs">Align QR Code within the frame to verify</span>
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={triggerSimulatedScan}
          disabled={scanning}
          className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Scanning...' : 'Simulate QR Check-In'}</span>
        </motion.button>
      </div>

    </div>
  );
}
