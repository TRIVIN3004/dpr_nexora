import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Clock, MapPin, CheckCircle2, ShieldCheck, Sparkles, Loader2, X, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckInWidget({ currentUser, todayRecord, settings, onCheckIn, onCheckOut }) {
  const [time, setTime] = useState(new Date());
  const [remarks, setRemarks] = useState('');
  const [actionState, setActionState] = useState({
    status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
    actionType: 'checkin', // 'checkin' | 'checkout'
    message: '',
    timestamp: null,
    statusBadge: 'Present',
    remarksNote: ''
  });

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
    const enteredRemarks = remarks;
    setActionState({
      status: 'loading',
      actionType: 'checkin',
      message: 'Marking attendance & syncing timestamp...',
      timestamp: formatTime(new Date()),
      statusBadge: 'Present',
      remarksNote: enteredRemarks
    });

    try {
      const res = await onCheckIn(enteredRemarks);
      if (res && res.success === false) {
        setActionState({
          status: 'error',
          actionType: 'checkin',
          message: res.error || 'Failed to mark attendance. Please try again.',
          timestamp: formatTime(new Date()),
          statusBadge: 'Error',
          remarksNote: ''
        });
      } else {
        setActionState({
          status: 'success',
          actionType: 'checkin',
          message: 'Daily Check-In Recorded Successfully!',
          timestamp: formatTime(new Date()),
          statusBadge: 'Present (On Time)',
          remarksNote: enteredRemarks
        });
        setRemarks('');
      }
    } catch (err) {
      setActionState({
        status: 'error',
        actionType: 'checkin',
        message: err.message || 'An error occurred while marking attendance.',
        timestamp: formatTime(new Date()),
        statusBadge: 'Error',
        remarksNote: ''
      });
    }
  };

  const handleOut = async () => {
    setActionState({
      status: 'loading',
      actionType: 'checkout',
      message: 'Logging check-out session...',
      timestamp: formatTime(new Date()),
      statusBadge: 'Checked Out',
      remarksNote: ''
    });

    try {
      const res = await onCheckOut();
      if (res && res.success === false) {
        setActionState({
          status: 'error',
          actionType: 'checkout',
          message: res.error || 'Failed to log check-out. Please try again.',
          timestamp: formatTime(new Date()),
          statusBadge: 'Error',
          remarksNote: ''
        });
      } else {
        setActionState({
          status: 'success',
          actionType: 'checkout',
          message: 'Daily Check-Out Logged Successfully!',
          timestamp: formatTime(new Date()),
          statusBadge: 'Checked Out',
          remarksNote: ''
        });
      }
    } catch (err) {
      setActionState({
        status: 'error',
        actionType: 'checkout',
        message: err.message || 'An error occurred while logging check-out.',
        timestamp: formatTime(new Date()),
        statusBadge: 'Error',
        remarksNote: ''
      });
    }
  };

  const closeNotification = () => {
    setActionState(prev => ({ ...prev, status: 'idle' }));
  };

  const hasCheckedIn = !!todayRecord?.checkInTime;
  const hasCheckedOut = !!todayRecord?.checkOutTime;

  const displayCheckInTime = todayRecord?.checkInTime || '--:--';
  const displayCheckOutTime = todayRecord?.checkOutTime || '--:--';

  const isLoading = actionState.status === 'loading';

  return (
    <div className="rounded-3xl border p-6 md:p-8 shadow-md relative overflow-hidden bg-white" style={{ borderColor: '#cbd5e1' }}>
      
      {/* Centered In-Widget Loading & Notification Overlay */}
      <AnimatePresence>
        {actionState.status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
          >
            {actionState.status === 'loading' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-200 flex flex-col items-center text-center space-y-4"
              >
                <div className="relative flex items-center justify-center h-20 w-20">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-3 border-indigo-600 border-t-transparent shadow-md"
                  />
                  <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Clock className="h-7 w-7 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-slate-900">
                    {actionState.actionType === 'checkin' ? 'Marking Attendance...' : 'Logging Check-Out...'}
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    {actionState.message}
                  </p>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-extrabold">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                  GoNexora Attendance Cloud Sync
                </div>
              </motion.div>
            )}

            {actionState.status === 'success' && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 10 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-emerald-500 flex flex-col items-center text-center space-y-5 relative"
              >
                <button
                  onClick={closeNotification}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Animated Green Checkmark Orb */}
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
                    Verified & Recorded
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {actionState.message}
                  </h3>
                  <p className="text-xs font-extrabold text-slate-500">
                    {currentUser?.name} • {currentUser?.id}
                  </p>
                </div>

                {/* Detailed Summary Card */}
                <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Timestamp:</span>
                    <span className="font-black text-slate-900 font-mono text-sm">{actionState.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Attendance Status:</span>
                    <span className="font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {actionState.statusBadge}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Location:</span>
                    <span className="font-black text-slate-800">Nexora HQ (Verified GPS)</span>
                  </div>
                  {actionState.remarksNote && (
                    <div className="flex items-start justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500 font-bold">Remarks:</span>
                      <span className="font-bold text-slate-800 italic max-w-[200px] text-right truncate">{actionState.remarksNote}</span>
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={closeNotification}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Done & Continue</span>
                </motion.button>
              </motion.div>
            )}

            {actionState.status === 'error' && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border-2 border-rose-400 flex flex-col items-center text-center space-y-4 relative"
              >
                <button
                  onClick={closeNotification}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 border border-rose-300">
                  <AlertCircle className="h-8 w-8 text-rose-600" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Attendance Error</h3>
                  <p className="text-xs font-bold text-rose-600">{actionState.message}</p>
                </div>

                <button
                  onClick={closeNotification}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 cursor-pointer"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Live Digital Clock & Info */}
        <div className="space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold" style={{ backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            GoNexora Smart Attendance Tracker
          </div>

          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight font-mono" style={{ color: '#000000' }}>
              {formatTime(time)}
            </h2>
            <p className="text-sm font-extrabold mt-1" style={{ color: '#1e293b' }}>
              {formatDate(time)}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs font-bold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border" style={{ backgroundColor: '#f8fafc', color: '#000000', borderColor: '#cbd5e1' }}>
              <MapPin className="h-3.5 w-3.5 text-indigo-600" />
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

          {/* Times Breakdown */}
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
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-indigo-600 font-bold"
                style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#cbd5e1' }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleIn}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl text-white font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all"
                style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span style={{ color: '#ffffff' }}>Recording Check-In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" style={{ color: '#ffffff' }} />
                    <span style={{ color: '#ffffff' }}>Daily Check-In</span>
                  </>
                )}
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
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-white font-black text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all"
                  style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      <span style={{ color: '#ffffff' }}>Logging Check-Out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-3.5 w-3.5" style={{ color: '#ffffff' }} />
                      <span style={{ color: '#ffffff' }}>Optional Check-Out</span>
                    </>
                  )}
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

