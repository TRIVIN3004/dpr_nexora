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
    <div className="rounded-2xl border p-6 md:p-8 shadow-sm relative overflow-hidden" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Live Digital Clock & Info */}
        <div className="space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
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

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border" style={{ backgroundColor: '#f8fafc', color: '#0f172a', borderColor: '#cbd5e1' }}>
              <MapPin className="h-3.5 w-3.5 text-cyan-600" />
              <span>Location: <strong style={{ color: '#090d16' }}>Nexora HQ (Verified)</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold" style={{ backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Flexible Entry Allowed</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Action Box */}
        <div className="w-full lg:w-auto min-w-[340px] border rounded-2xl p-5 space-y-4 shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}>
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#e2e8f0' }}>
            <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#0f172a' }}>
              Today's Attendance Status
            </span>
            {todayRecord ? (
              <span className="text-xs font-extrabold px-3 py-1 rounded-full border" style={{ backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7' }}>
                {todayRecord.status || 'Present'}
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                Not Marked
              </span>
            )}
          </div>

          {/* Times Breakdown */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl border" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
              <span className="text-[10px] font-extrabold uppercase block" style={{ color: '#475569' }}>Check-In</span>
              <span className="text-sm font-extrabold font-mono block mt-0.5" style={{ color: '#0f172a' }}>
                {todayRecord?.checkInTime || '--:--'}
              </span>
            </div>
            <div className="p-3 rounded-xl border" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
              <span className="text-[10px] font-extrabold uppercase block" style={{ color: '#475569' }}>Check-Out (Optional)</span>
              <span className="text-sm font-extrabold font-mono block mt-0.5" style={{ color: '#0f172a' }}>
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
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-indigo-500 font-semibold"
                style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleIn}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
              >
                <LogIn className="h-4 w-4" />
                <span>{loading ? 'Logging Check-In...' : 'Daily Check-In'}</span>
              </motion.button>
            </div>
          )}

          {hasCheckedIn && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl border text-xs font-extrabold text-center flex items-center justify-center gap-2" style={{ backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7' }}>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Today's Attendance Recorded (Present)</span>
              </div>

              {!hasCheckedOut && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOut}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                >
                  <LogOut className="h-3.5 w-3.5 text-white" />
                  <span>{loading ? 'Logging...' : 'Optional Check-Out'}</span>
                </motion.button>
              )}

              {hasCheckedOut && (
                <div className="text-[11px] text-center font-bold" style={{ color: '#475569' }}>
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
