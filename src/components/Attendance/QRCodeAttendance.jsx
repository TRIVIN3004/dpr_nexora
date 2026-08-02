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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
      
      {/* Left: Employee QR Badge Generator */}
      <div className="flex flex-col items-center justify-center p-6 rounded-xl border text-center space-y-4" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
          <Sparkles className="h-3.5 w-3.5" />
          Digital Employee Badge
        </div>

        <div className="relative p-4 rounded-2xl shadow-md border-2" style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}>
          <div className="w-44 h-44 p-2 rounded-lg flex flex-col justify-between items-center relative overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
            <div className="grid grid-cols-6 gap-1 w-full h-full p-2 rounded" style={{ backgroundColor: '#ffffff' }}>
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
              <div className="p-1 rounded-lg border shadow" style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}>
                <img src="/logo.png" alt="Logo" className="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-extrabold" style={{ color: '#090d16' }}>{currentUser?.name}</h4>
          <p className="text-xs font-mono font-bold" style={{ color: '#334155' }}>{currentUser?.id} • {currentUser?.department || 'Engineering'}</p>
        </div>
      </div>

      {/* Right: Live QR Scanner Simulation */}
      <div className="flex flex-col items-center justify-center p-6 rounded-xl border text-center space-y-4 relative" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
        <h4 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#0f172a' }}>
          Badge Camera Scanner
        </h4>

        <div className="relative w-56 h-56 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#ffffff', borderColor: '#818cf8' }}>
          {scanning ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <motion.div 
                animate={{ y: [-100, 100, -100] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="absolute w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent shadow"
              />
              <Scan className="h-12 w-12 text-indigo-600 animate-pulse" />
              <span className="text-xs font-mono mt-3 animate-pulse font-bold" style={{ color: '#4338ca' }}>Scanning QR Badge...</span>
            </div>
          ) : scanResult ? (
            <div className="flex flex-col items-center gap-2 p-4">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
              <span className="text-xs font-extrabold" style={{ color: '#090d16' }}>{scanResult.message}</span>
              <span className="text-[10px] font-mono font-bold" style={{ color: '#334155' }}>Logged at {scanResult.time}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-4">
              <QrCode className="h-12 w-12 text-indigo-600" />
              <span className="text-xs font-bold" style={{ color: '#334155' }}>Align QR Code within the frame to verify</span>
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={triggerSimulatedScan}
          disabled={scanning}
          className="py-2.5 px-5 rounded-xl text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
          style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Scanning...' : 'Simulate QR Check-In'}</span>
        </motion.button>
      </div>

    </div>
  );
}
