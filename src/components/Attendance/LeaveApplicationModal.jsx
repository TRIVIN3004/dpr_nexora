import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Calendar, 
  Send, 
  AlertCircle, 
  Phone, 
  Info,
  CalendarRange
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateLeaveDays, getTodayString } from '../../utils/attendanceDatabase';

const LEAVE_TYPES = [
  { id: 'Casual Leave', label: 'Casual Leave', desc: 'Personal errands, short family commitments', color: 'blue' },
  { id: 'Sick / Medical Leave', label: 'Sick / Medical Leave', desc: 'Illness, medical appointments, recovery', color: 'rose' },
  { id: 'Semester / Exam Leave', label: 'Semester / Exam Leave', desc: 'College semester exams, internals, study leave', color: 'indigo' },
  { id: 'Earned / Annual Leave', label: 'Earned / Annual Leave', desc: 'Planned vacation, personal rest time', color: 'amber' },
  { id: 'Half-Day Leave', label: 'Half-Day Leave (Morning / Afternoon)', desc: 'Half-day absence (4 hours)', color: 'teal' },
  { id: 'Emergency / Unpaid Leave', label: 'Emergency / Unpaid Leave', desc: 'Unforeseen emergencies or extra leaves', color: 'purple' },
  { id: 'Maternity / Paternity Leave', label: 'Maternity / Paternity Leave', desc: 'Parental care & family bonding', color: 'sky' }
];

export default function LeaveApplicationModal({
  isOpen,
  onClose,
  currentUser,
  users = [],
  onSubmit
}) {
  const todayStr = getTodayString();
  const [selectedUserId, setSelectedUserId] = useState(currentUser?.id || '');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [reason, setReason] = useState('');
  const [emergencyContact, setEmergencyContact] = useState(currentUser?.phone || '');
  const [handoverTo, setHandoverTo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const targetUser = users.find(u => u.id === selectedUserId) || currentUser || {};

  useEffect(() => {
    if (isOpen) {
      setSelectedUserId(currentUser?.id || '');
      setLeaveType('Casual Leave');
      setStartDate(todayStr);
      setEndDate(todayStr);
      setReason('');
      setEmergencyContact(currentUser?.phone || '');
      setHandoverTo('');
      setValidationError('');
      setSubmitting(false);
    }
  }, [isOpen, currentUser, todayStr]);

  // If half day selected, make endDate same as startDate
  useEffect(() => {
    if (leaveType === 'Half-Day Leave') {
      setEndDate(startDate);
    }
  }, [leaveType, startDate]);

  if (!isOpen) return null;

  const totalDays = calculateLeaveDays(startDate, endDate, leaveType);
  const isDateInvalid = startDate && endDate && new Date(endDate) < new Date(startDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!startDate || !endDate) {
      setValidationError('Please select both Start Date and End Date.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setValidationError('End Date cannot be earlier than Start Date.');
      return;
    }

    if (!reason.trim() || reason.trim().length < 5) {
      setValidationError('Please provide a detailed reason (at least 5 characters).');
      return;
    }

    setSubmitting(true);

    const payload = {
      employeeId: targetUser.id,
      employeeName: targetUser.name,
      department: targetUser.department || 'Engineering',
      role: targetUser.role || 'member',
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason: reason.trim(),
      emergencyContact: emergencyContact.trim(),
      handoverTo
    };

    const res = await onSubmit(payload);
    setSubmitting(false);

    if (res && res.success) {
      onClose();
    } else if (res && res.error) {
      setValidationError(res.error);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white my-auto"
        >
          {/* Header - Fixed Top */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-white dark:from-indigo-950/50 dark:via-purple-950/30 dark:to-[#0f172a]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                <CalendarRange className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Apply for Leave
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                  Submit leave request with Start & End date duration
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Container with Internal Scroll */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            
            {/* Scrollable Form Body */}
            <div className="flex-1 p-5 sm:p-6 space-y-4 overflow-y-auto overscroll-contain">
              
              {/* Validation Error Alert */}
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2.5"
                >
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{validationError}</span>
                </motion.div>
              )}

              {/* Applicant Profile (Admin selection vs Self) */}
              {isAdmin ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Applying For Employee
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value);
                      const usr = users.find(u => u.id === e.target.value);
                      if (usr?.phone) setEmergencyContact(usr.phone);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-extrabold cursor-pointer"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.id}) • {u.department || 'Engineering'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-xs">
                      {targetUser.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{targetUser.name}</h4>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{targetUser.id} • {targetUser.department || 'Engineering'}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Applicant
                  </span>
                </div>
              )}

              {/* Leave Type Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Leave Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {LEAVE_TYPES.map((lt) => {
                    const isSelected = leaveType === lt.id;
                    return (
                      <button
                        key={lt.id}
                        type="button"
                        onClick={() => setLeaveType(lt.id)}
                        className={`p-2.5 sm:p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-sm ring-1 ring-indigo-500'
                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-black ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>
                            {lt.label}
                          </span>
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {lt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Date & End Date Pickers */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-black mb-1.5 text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      Start Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (leaveType === 'Half-Day Leave' || !endDate || new Date(endDate) < new Date(e.target.value)) {
                            setEndDate(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-extrabold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black mb-1.5 text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      End Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        disabled={leaveType === 'Half-Day Leave'}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-extrabold disabled:opacity-60"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Duration Banner */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
                  isDateInvalid 
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300' 
                    : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-xs font-bold">
                      {isDateInvalid ? 'Invalid Date Range' : `Duration: ${startDate} to ${endDate}`}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-black font-mono shadow-xs ${
                    isDateInvalid
                      ? 'bg-rose-200 text-rose-900'
                      : 'bg-indigo-600 text-white'
                  }`}>
                    {isDateInvalid ? '0 Days' : `${totalDays} ${totalDays === 1 ? 'Day' : 'Days'}`}
                  </span>
                </div>
              </div>

              {/* Reason Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Reason / Description <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    {reason.length} / 300 chars
                  </span>
                </div>
                <textarea
                  rows={2.5}
                  value={reason}
                  maxLength={300}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe why you are requesting leave (e.g., Attending family event, doctor visit, personal commitment)..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-medium placeholder:text-slate-400 resize-none"
                  required
                />
              </div>

              {/* Optional Handover & Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-black mb-1.5 text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Emergency Phone Contact
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black mb-1.5 text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Work Handover To (Optional)
                  </label>
                  <select
                    value={handoverTo}
                    onChange={(e) => setHandoverTo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-bold cursor-pointer"
                  >
                    <option value="">None / Not Applicable</option>
                    {users.filter(u => u.id !== targetUser.id).map(u => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.department || 'Engineering'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Info note */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  Once submitted, your application will be reviewed by company administration. Approved leave days will automatically reflect in your attendance logs and team calendar.
                </span>
              </div>

            </div>

            {/* Fixed Bottom Footer Action Buttons */}
            <div className="flex-shrink-0 px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || isDateInvalid}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 text-white" />
                <span>{submitting ? 'Submitting Request...' : 'Submit Leave Application'}</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
