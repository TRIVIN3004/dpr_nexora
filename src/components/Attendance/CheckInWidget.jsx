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

  const displayCheckInTime = todayRecord?.checkInTime || '--:--';
  const displayCheckOutTime = todayRecord?.checkOutTime || '--:--';

  return (
    <div className="rounded-2xl border p-6 md:p-8 shadow-sm relative overflow-hidden" style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}>
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Live Digital Clock & Info */}
        <div className="space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold" style={{ backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Flexible Work Hours Tracker
          </div>

          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight font-mono" style={{ color: '#000000' }}>
              {formatTime(time)}
            </h2>
            <p className="text-sm font-extrabold mt-1" style={{ color: '#1e293b' }}>
              {formatDate(time)}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border" style={{ backgroundColor: '#f8fafc', color: '#000000', borderColor: '#cbd5e1' }}>
              <MapPin className="h-3.5 w-3.5 text-cyan-700" />
              <span>Location: <strong style={{ color: '#000000', fontWeight: '900' }}>Nexora HQ (Verified)</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-extrabold" style={{ backgroundColor: '#ecfdf5', color: '#064e3b', borderColor: '#a7f3d0' }}>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              <span style={{ color: '#064e3b' }}>Flexible Entry Allowed</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Action Box */}
        <div className="w-full lg:w-auto min-w-[340px] border rounded-2xl p-5 space-y-4 shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}>
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#cbd5e1' }}>
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#000000' }}>
              Today's Attendance Status
            </span>
            {todayRecord ? (
              <span className="text-xs font-black px-3 py-1 rounded-full border" style={{ backgroundColor: '#d1fae5', color: '#064e3b', borderColor: '#34d399' }}>
                {todayRecord.status === 'Late' ? 'Present' : (todayRecord.status || 'Present')}
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ backgroundColor: '#f1f5f9', color: '#1e293b', borderColor: '#cbd5e1' }}>
                Not Marked
              </span>
            )}
          </div>

          {/* Times Breakdown - Explicit Deep Black Color */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
              <span className="text-[10px] font-black uppercase block" style={{ color: '#1e293b' }}>CHECK-IN</span>
              <span className="text-base font-black font-mono block mt-1" style={{ color: '#000000' }}>
                {displayCheckInTime}
              </span>
            </div>
            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
              <span className="text-[10px] font-black uppercase block" style={{ color: '#1e293b' }}>CHECK-OUT (OPTIONAL)</span>
              <span className="text-base font-black font-mono block mt-1" style={{ color: '#000000' }}>
                {displayCheckOutTime}
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
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-indigo-600 font-bold"
                style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#cbd5e1' }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleIn}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl text-white font-black text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
              >
                <LogIn className="h-4 w-4" style={{ color: '#ffffff' }} />
                <span style={{ color: '#ffffff' }}>{loading ? 'Logging Check-In...' : 'Daily Check-In'}</span>
              </motion.button>
            </div>
          )}

          {hasCheckedIn && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl border text-xs font-black text-center flex items-center justify-center gap-2" style={{ backgroundColor: '#d1fae5', color: '#064e3b', borderColor: '#34d399' }}>
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span style={{ color: '#064e3b' }}>Today's Attendance Recorded (Present)</span>
              </div>

              {!hasCheckedOut && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOut}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-white font-black text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                >
                  <LogOut className="h-3.5 w-3.5" style={{ color: '#ffffff' }} />
                  <span style={{ color: '#ffffff' }}>{loading ? 'Logging...' : 'Optional Check-Out'}</span>
                </motion.button>
              )}

              {hasCheckedOut && (
                <div className="text-[11px] text-center font-extrabold" style={{ color: '#1e293b' }}>
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
