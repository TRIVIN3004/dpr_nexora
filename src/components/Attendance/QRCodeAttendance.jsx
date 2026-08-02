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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
      
      {/* Left: Employee QR Badge Generator */}
      <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          Digital Employee Badge
        </div>

        <div className="relative p-4 rounded-2xl bg-white shadow-md border-2 border-slate-200">
          <div className="w-44 h-44 bg-slate-900 p-2 rounded-lg flex flex-col justify-between items-center relative overflow-hidden">
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
              <div className="p-1 bg-white rounded-lg border border-slate-200 shadow">
                <img src="/logo.png" alt="Logo" className="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900">{currentUser?.name}</h4>
          <p className="text-xs text-slate-600 font-mono">{currentUser?.id} • {currentUser?.department || 'Engineering'}</p>
        </div>
      </div>

      {/* Right: Live QR Scanner Simulation */}
      <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-4 relative">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Badge Camera Scanner
        </h4>

        <div className="relative w-56 h-56 rounded-2xl bg-white border-2 border-dashed border-indigo-300 flex items-center justify-center overflow-hidden">
          {scanning ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <motion.div 
                animate={{ y: [-100, 100, -100] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="absolute w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent shadow"
              />
              <Scan className="h-12 w-12 text-indigo-600 animate-pulse" />
              <span className="text-xs text-indigo-600 font-mono mt-3 animate-pulse">Scanning QR Badge...</span>
            </div>
          ) : scanResult ? (
            <div className="flex flex-col items-center gap-2 p-4 text-emerald-700">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">{scanResult.message}</span>
              <span className="text-[10px] text-slate-500 font-mono">Logged at {scanResult.time}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-4 text-slate-400">
              <QrCode className="h-12 w-12 text-slate-400" />
              <span className="text-xs text-slate-600">Align QR Code within the frame to verify</span>
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={triggerSimulatedScan}
          disabled={scanning}
          className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Scanning...' : 'Simulate QR Check-In'}</span>
        </motion.button>
      </div>

    </div>
  );
}
