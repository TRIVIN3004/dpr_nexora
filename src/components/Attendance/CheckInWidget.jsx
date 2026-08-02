import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Clock, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';
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
    <div className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm relative overflow-hidden">
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Live Digital Clock & Info */}
        <div className="space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Flexible Work Hours Tracker
          </div>

          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight font-mono" style={{ color: '#090d16' }}>
              {formatTime(time)}
            </h2>
            <p className="text-sm font-extrabold mt-1" style={{ color: '#334155' }}>
              {formatDate(time)}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200" style={{ color: '#334155' }}>
              <MapPin className="h-3.5 w-3.5 text-cyan-600" />
              <span>Location: <strong style={{ color: '#090d16' }}>Nexora HQ (Verified)</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Flexible Entry Allowed</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Action Buttons */}
        <div className="w-full lg:w-auto min-w-[320px] bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Today's Attendance Status
            </span>
            {todayRecord ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                {todayRecord.status || 'Present'}
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400">Not Marked</span>
            )}
          </div>

          {/* Times Breakdown (High contrast boxes inside right panel) */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Check-In</span>
              <span className="text-sm font-extrabold text-white font-mono block mt-0.5">
                {todayRecord?.checkInTime || '--:--'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Check-Out (Optional)</span>
              <span className="text-sm font-extrabold text-white font-mono block mt-0.5">
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
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleIn}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                <span>{loading ? 'Logging Check-In...' : 'Daily Check-In'}</span>
              </motion.button>
            </div>
          )}

          {hasCheckedIn && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Today's Attendance Recorded (Present)</span>
              </div>

              {!hasCheckedOut && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOut}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5 text-slate-300" />
                  <span>{loading ? 'Logging...' : 'Optional Check-Out'}</span>
                </motion.button>
              )}

              {hasCheckedOut && (
                <div className="text-[11px] text-slate-400 text-center font-medium">
                  Checked out at {todayRecord.checkOutTime}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
