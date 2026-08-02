import React, { useState } from 'react';
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 text-center"
        >
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <UserCheck className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-white">
              Reactivate Employee Account
            </h3>
            <p className="text-xs text-slate-400">
              Restore full DPR Portal access and clear attendance deactivation lock for:
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Employee Name:</span>
              <strong className="text-slate-200">{targetUser.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Employee ID:</span>
              <strong className="text-slate-200 font-mono">{targetUser.id}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Status:</span>
              <span className="text-rose-400 font-bold">Terminated (&lt;50% Attendance)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Deactivation Reason:</span>
              <span className="text-slate-300">Attendance Below Company Policy</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2 text-left">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Only authorized Administrators can override company attendance policy terminations.</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-glow-emerald cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Reactivating...' : 'Confirm Reactivation'}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
