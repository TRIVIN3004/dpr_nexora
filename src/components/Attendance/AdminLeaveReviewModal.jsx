import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  User, 
  Phone, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLeaveReviewModal({
  isOpen,
  onClose,
  application,
  onReview
}) {
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !application) return null;

  const handleAction = async (status) => {
    setProcessing(true);
    await onReview(application.id, status, remarks);
    setProcessing(false);
    onClose();
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Approved':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
      case 'Rejected':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700';
      case 'Cancelled':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      default:
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg border border-slate-200 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/50 dark:to-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Review Leave Application
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                  Application ID: {application.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 text-left max-h-[80vh] overflow-y-auto">
            
            {/* Applicant Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                  {application.employeeName?.charAt(0) || 'E'}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {application.employeeName}
                  </h4>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {application.employeeId} • {application.department || 'Engineering'}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${getStatusBadge(application.status)}`}>
                {application.status}
              </span>
            </div>

            {/* Leave Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Leave Type</span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                  {application.leaveType}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total Duration</span>
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono block">
                  {application.totalDays} {application.totalDays === 1 ? 'Day' : 'Days'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Start Date</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono block">
                  {application.startDate}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">End Date</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono block">
                  {application.endDate}
                </span>
              </div>
            </div>

            {/* Reason */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Applicant's Stated Reason
              </span>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {application.reason}
              </p>
            </div>

            {/* Handover & Contact */}
            {(application.emergencyContact || application.handoverTo) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {application.emergencyContact && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Emergency Phone</span>
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{application.emergencyContact}</span>
                    </div>
                  </div>
                )}
                {application.handoverTo && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Work Handover</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{application.handoverTo}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin Remarks Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Admin Review Remarks / Feedback
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional comments for employee (e.g. Approved, please hand over sprint deliverables to Siva before departure)..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-medium placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* Note on Automatic Attendance Sync */}
            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Automated System Sync:</strong> Approving this application will automatically generate <em>"Leave"</em> attendance records for all dates from <strong>{application.startDate}</strong> to <strong>{application.endDate}</strong>.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => handleAction('Rejected')}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <XCircle className="h-4 w-4 text-white" />
                <span>Reject Application</span>
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => handleAction('Approved')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4 text-white" />
                <span>Approve Leave</span>
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
