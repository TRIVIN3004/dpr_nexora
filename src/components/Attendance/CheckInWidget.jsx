import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Clock, MapPin, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CheckInWidget({ currentUser, todayRecord, settings, onCheckIn, onCheckOut }) {
  const [time, setTime] = useState(new Date());
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleIn = async () => {
    setLoading(true);
    await onCheckIn(remarks);
    setRemarks('');
    setLoading(false);
  };

  const handleOut = async () => {
    setLoading(true);
    await onCheckOut();
    setLoading(false);
  };

  const hasCheckedIn = !!todayRecord?.checkInTime;
  const hasCheckedOut = !!todayRecord?.checkOutTime;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-nexora-indigo/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-nexora-purple/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Live Digital Clock & Info */}
        <div className="space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Time Tracker
          </div>

          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white font-mono">
              {formatTime(time)}
            </h2>
            <p className="text-sm font-medium text-slate-400 mt-1">
              {formatDate(time)}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="h-3.5 w-3.5 text-nexora-purple" />
              <span>Office Start: <strong className="text-slate-200">{settings?.officeStartTime || '09:00'} AM</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              <span>Location: <strong className="text-slate-200">Nexora HQ (Verified)</strong></span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Action Buttons */}
        <div className="w-full lg:w-auto min-w-[320px] bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Today's Attendance
            </span>
            {todayRecord ? (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                todayRecord.status === 'Late' 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {todayRecord.status}
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-500">Not Marked</span>
            )}
          </div>

          {/* Times Breakdown */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Check-In</span>
              <span className="text-sm font-bold text-slate-100 font-mono">
                {todayRecord?.checkInTime || '--:--'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Check-Out</span>
              <span className="text-sm font-bold text-slate-100 font-mono">
                {todayRecord?.checkOutTime || '--:--'}
              </span>
            </div>
          </div>

          {!hasCheckedIn && (
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Remarks (optional)..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-nexora-purple"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleIn}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-nexora-indigo to-nexora-purple text-white font-bold text-sm shadow-glow-purple flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                <span>{loading ? 'Logging Check-In...' : 'Daily Check-In'}</span>
              </motion.button>
            </div>
          )}

          {hasCheckedIn && !hasCheckedOut && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOut}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold text-sm shadow-glow-rose flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{loading ? 'Logging Check-Out...' : 'Daily Check-Out'}</span>
            </motion.button>
          )}

          {hasCheckedIn && hasCheckedOut && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Today's Attendance Completed</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
