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
    <div className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm relative overflow-hidden">
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Live Digital Clock & Info */}
        <div className="space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Time Tracker
          </div>

          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 font-mono">
              {formatTime(time)}
            </h2>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              {formatDate(time)}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Clock className="h-3.5 w-3.5 text-indigo-600" />
              <span>Office Start: <strong className="text-slate-800">{settings?.officeStartTime || '09:00'} AM</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <MapPin className="h-3.5 w-3.5 text-cyan-600" />
              <span>Location: <strong className="text-slate-800">Nexora HQ (Verified)</strong></span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Action Buttons */}
        <div className="w-full lg:w-auto min-w-[320px] bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Today's Attendance
            </span>
            {todayRecord ? (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                todayRecord.status === 'Late' 
                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {todayRecord.status}
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-500">Not Marked</span>
            )}
          </div>

          {/* Times Breakdown */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Check-In</span>
              <span className="text-sm font-extrabold text-slate-800 font-mono">
                {todayRecord?.checkInTime || '--:--'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Check-Out</span>
              <span className="text-sm font-extrabold text-slate-800 font-mono">
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
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
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

          {hasCheckedIn && !hasCheckedOut && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOut}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{loading ? 'Logging Check-Out...' : 'Daily Check-Out'}</span>
            </motion.button>
          )}

          {hasCheckedIn && hasCheckedOut && (
            <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold text-center flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Today's Attendance Completed</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
