import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserCheck, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReactivateUserModal({ isOpen, onClose, targetUser, onReactivate }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onReactivate(targetUser.id);
    setLoading(false);
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md max-h-[90vh] flex flex-col border border-slate-200 dark:border-white/20 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 text-center bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white my-auto overflow-y-auto"
        >
          <div className="mx-auto w-14 h-14 rounded-2xl border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 shadow-sm">
            <UserCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Reactivate Employee Account
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">
              Restore full DPR Portal access and clear attendance deactivation lock for:
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left space-y-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-900/50">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Employee Name:</span>
              <strong className="text-slate-900 dark:text-white">{targetUser.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Employee ID:</span>
              <strong className="font-mono text-slate-900 dark:text-white">{targetUser.id}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Current Status:</span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400">Terminated (&lt;50% Attendance)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Deactivation Reason:</span>
              <span className="text-slate-700 dark:text-slate-300">Attendance Below Company Policy</span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800/60 text-xs flex items-center gap-2 text-left font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Only authorized Administrators can override company attendance policy terminations.</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer shadow-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-sm cursor-pointer disabled:opacity-50 bg-emerald-600 hover:bg-emerald-500 transition-colors"
            >
              {loading ? 'Reactivating...' : 'Confirm Reactivation'}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
