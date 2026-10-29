import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserX, AlertTriangle, Mail, ShieldAlert, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPersonalEmail } from '../../utils/emailService';

export default function TerminationModal({
  isOpen,
  onClose,
  targetUser,
  stats,
  onConfirmTermination
}) {
  const [sendNoticeEmail, setSendNoticeEmail] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !targetUser) return null;

  const attendancePct = stats?.attendancePct ?? targetUser.attendancePercentage ?? 0;
  const personalMail = targetUser.personalEmail || getPersonalEmail(targetUser) || 'Not Configured';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirmTermination(targetUser, {
        sendEmail: sendNoticeEmail,
        personalMail,
        stats
      });
      onClose();
    } catch (err) {
      console.error('Termination execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md max-h-[90vh] flex flex-col border border-rose-300 dark:border-rose-900/60 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 text-center bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white my-auto overflow-y-auto"
        >
          {/* Header Icon */}
          <div className="mx-auto w-14 h-14 rounded-2xl border border-rose-300 dark:border-rose-700/60 flex items-center justify-center bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 shadow-sm">
            <UserX className="h-7 w-7 text-rose-600 dark:text-rose-400" />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <h3 className="text-lg font-black text-rose-700 dark:text-rose-400">
              Confirm Staff Termination
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">
              Attendance rate fell below mandatory 50% policy threshold.
            </p>
          </div>

          {/* Member Card Details */}
          <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-left space-y-2 text-xs font-bold bg-rose-50/50 dark:bg-rose-950/20">
            <div className="flex items-center gap-3 pb-2 border-b border-rose-100 dark:border-rose-900/40">
              <img
                src={targetUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                alt={targetUser.name}
                className="h-10 w-10 rounded-full object-cover border border-rose-300 dark:border-rose-700"
              />
              <div>
                <strong className="text-sm text-slate-900 dark:text-white block">{targetUser.name}</strong>
                <span className="font-mono text-[10px] text-slate-500">{targetUser.id} • {targetUser.department || 'Engineering'}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500 dark:text-slate-400">Overall Attendance:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                {attendancePct}% (&lt; 50% Breach)
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Personal Email:</span>
              <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[200px]" title={personalMail}>
                {personalMail}
              </span>
            </div>
          </div>

          {/* Policy Warning Callout */}
          <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800/60 text-[11px] flex items-start gap-2 text-left font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <span>
              Terminating will permanently remove this member from the active staff directory in Supabase and revoke DPR portal login credentials.
            </span>
          </div>

          {/* Email Notification Option */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-left text-xs cursor-pointer select-none hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={sendNoticeEmail}
              onChange={(e) => setSendNoticeEmail(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <div className="flex-1">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                Send Official Termination Notice via Resend
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                Delivers formal PDF/letter email to <strong className="font-mono text-indigo-600 dark:text-indigo-400">{personalMail}</strong>
              </span>
            </div>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-md cursor-pointer disabled:opacity-50 bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              {loading ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Terminating...</span>
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4" />
                  <span>Confirm Termination</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

