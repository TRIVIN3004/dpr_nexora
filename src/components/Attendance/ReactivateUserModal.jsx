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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-6 space-y-5 text-center"
        >
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <UserCheck className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-slate-900">
              Reactivate Employee Account
            </h3>
            <p className="text-xs text-slate-600">
              Restore full DPR Portal access and clear attendance deactivation lock for:
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Employee Name:</span>
              <strong className="text-slate-900">{targetUser.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Employee ID:</span>
              <strong className="text-slate-900 font-mono">{targetUser.id}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Status:</span>
              <span className="text-rose-600 font-bold">Terminated (&lt;50% Attendance)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Deactivation Reason:</span>
              <span className="text-slate-700">Attendance Below Company Policy</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 text-left">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <span>Only authorized Administrators can override company attendance policy terminations.</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Reactivating...' : 'Confirm Reactivation'}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
