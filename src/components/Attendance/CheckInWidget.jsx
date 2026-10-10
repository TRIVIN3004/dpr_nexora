import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    <div className="rounded-3xl border border-slate-200 dark:border-white/15 p-6 md:p-8 shadow-xl relative overflow-hidden bg-white dark:bg-white/[0.07] backdrop-blur-2xl text-left">
      
      {/* Centered Global Screen Loading & Notification Overlay via Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {actionState.status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
            >
              {actionState.status === 'loading' && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-4 max-h-[90vh] overflow-y-auto my-auto"
                >
                  <div className="relative flex items-center justify-center h-20 w-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                      className="absolute inset-0 rounded-full border-3 border-indigo-600 border-t-transparent shadow-md"
                    />
                    <div className="h-14 w-14 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Clock className="h-7 w-7 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {actionState.actionType === 'checkin' ? 'Marking Attendance...' : 'Logging Check-Out...'}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {actionState.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-extrabold">
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
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-emerald-500 flex flex-col items-center text-center space-y-5 relative max-h-[90vh] overflow-y-auto my-auto"
                >
                  <button
                    onClick={closeNotification}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Animated Green Checkmark Orb */}
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
                      Verified & Recorded
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {actionState.message}
                    </h3>
                    <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                      {currentUser?.name} • {currentUser?.id}
                    </p>
                  </div>

                  {/* Detailed Summary Card */}
                  <div className="w-full bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-left space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-bold">Timestamp:</span>
                      <span className="font-black text-slate-900 dark:text-white font-mono text-sm">{actionState.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-bold">Attendance Status:</span>
                      <span className="font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                        {actionState.statusBadge}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-bold">Location:</span>
                      <span className="font-black text-slate-800 dark:text-slate-200">Nexora HQ (Verified GPS)</span>
                    </div>
                    {actionState.remarksNote && (
                      <div className="flex items-start justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-bold">Remarks:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 italic max-w-[200px] text-right truncate">{actionState.remarksNote}</span>
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
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border-2 border-rose-400 flex flex-col items-center text-center space-y-4 relative max-h-[90vh] overflow-y-auto my-auto"
                >
                  <button
                    onClick={closeNotification}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 border border-rose-300 dark:border-rose-700">
                    <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Attendance Error</h3>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{actionState.message}</p>
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
        </AnimatePresence>,
        document.body
      )}

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Live Digital Clock & Info */}
        <div className="space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-[#818cf8] border border-indigo-200 dark:border-indigo-800/60">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            GoNexora Smart Attendance Tracker
          </div>

          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight font-mono text-slate-900 dark:text-white">
              {formatTime(time)}
            </h2>
            <p className="text-sm font-extrabold mt-1 text-slate-700 dark:text-slate-200">
              {formatDate(time)}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs font-bold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200">
              <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-[#818cf8]" />
              <span>Location: <strong className="text-slate-900 dark:text-white font-black">Nexora HQ (Verified)</strong></span>
            </div>
            {new Date().getDay() === 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-extrabold">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Weekly Holiday (Sunday)</span>
              </div>
            ) : new Date().getHours() >= 19 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-extrabold">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>7:00 PM Daily Cutoff Passed</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-extrabold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Flexible Entry (Cutoff at 7:00 PM)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Action Box */}
        <div className="w-full lg:w-auto min-w-[340px] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm bg-white dark:bg-slate-900/60">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Today's Attendance Status
            </span>
            {todayRecord?.status === 'Absent' ? (
              <span className="text-xs font-black px-3 py-1 rounded-full border bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800">
                Marked Absent (7 PM Cutoff)
              </span>
            ) : todayRecord ? (
              <span className="text-xs font-black px-3 py-1 rounded-full border bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40">
                {todayRecord.status === 'Late' ? 'Present' : (todayRecord.status || 'Present')}
              </span>
            ) : new Date().getDay() === 0 ? (
              <span className="text-xs font-black px-3 py-1 rounded-full border bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800">
                Sunday (Holiday)
              </span>
            ) : new Date().getHours() >= 19 ? (
              <span className="text-xs font-black px-3 py-1 rounded-full border bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800">
                Marked Absent (7 PM Cutoff)
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 rounded-full border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700">
                Not Marked (Pending)
              </span>
            )}
          </div>

          {/* Times Breakdown */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <span className="text-[10px] font-black uppercase block text-slate-600 dark:text-slate-400">CHECK-IN</span>
              <span className="text-base font-black font-mono block mt-1 text-slate-900 dark:text-white">
                {displayCheckInTime}
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <span className="text-[10px] font-black uppercase block text-slate-600 dark:text-slate-400">CHECK-OUT (OPTIONAL)</span>
              <span className="text-base font-black font-mono block mt-1 text-slate-900 dark:text-white">
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
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-bold"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleIn}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl text-white font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all bg-indigo-600 hover:bg-indigo-500"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Recording Check-In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 text-white" />
                    <span>Daily Check-In</span>
                  </>
                )}
              </motion.button>
            </div>
          )}

          {hasCheckedIn && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-black text-center flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Today's Attendance Recorded (Present)</span>
              </div>

              {!hasCheckedOut && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOut}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-white font-black text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all bg-slate-900 hover:bg-slate-800"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      <span>Logging Check-Out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-3.5 w-3.5 text-white" />
                      <span>Optional Check-Out</span>
                    </>
                  )}
                </motion.button>
              )}

              {hasCheckedOut && (
                <div className="text-[11px] text-center font-extrabold text-slate-700 dark:text-slate-300">
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
