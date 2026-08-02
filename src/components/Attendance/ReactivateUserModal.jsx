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
          className="w-full max-w-md border rounded-2xl shadow-xl overflow-hidden p-6 space-y-5 text-center"
          style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
        >
          <div className="mx-auto w-14 h-14 rounded-2xl border flex items-center justify-center" style={{ backgroundColor: '#d1fae5', borderColor: '#6ee7b7', color: '#065f46' }}>
            <UserCheck className="h-7 w-7 text-emerald-700" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black" style={{ color: '#000000' }}>
              Reactivate Employee Account
            </h3>
            <p className="text-xs font-semibold" style={{ color: '#334155' }}>
              Restore full DPR Portal access and clear attendance deactivation lock for:
            </p>
          </div>

          <div className="p-4 rounded-xl border text-left space-y-1.5 text-xs font-bold" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
            <div className="flex justify-between">
              <span style={{ color: '#475569' }}>Employee Name:</span>
              <strong style={{ color: '#000000' }}>{targetUser.name}</strong>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#475569' }}>Employee ID:</span>
              <strong className="font-mono" style={{ color: '#000000' }}>{targetUser.id}</strong>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#475569' }}>Current Status:</span>
              <span className="font-extrabold" style={{ color: '#9f1239' }}>Terminated (&lt;50% Attendance)</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#475569' }}>Deactivation Reason:</span>
              <span style={{ color: '#1e293b' }}>Attendance Below Company Policy</span>
            </div>
          </div>

          <div className="p-3 rounded-xl border text-xs flex items-center gap-2 text-left font-bold" style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }}>
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" />
            <span>Only authorized Administrators can override company attendance policy terminations.</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-extrabold cursor-pointer shadow-xs"
              style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-sm cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#059669', color: '#ffffff' }}
            >
              {loading ? 'Reactivating...' : 'Confirm Reactivation'}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
