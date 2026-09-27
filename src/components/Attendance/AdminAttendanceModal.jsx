import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText, History, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminAttendanceModal({ isOpen, onClose, users = [], initialRecord, onSave }) {
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Present');
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('17:00');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialRecord) {
        setEmployeeId(initialRecord.employeeId || '');
        setDate(initialRecord.date || new Date().toISOString().split('T')[0]);
        setStatus(initialRecord.status === 'Late' ? 'Present' : (initialRecord.status || 'Present'));
        setCheckInTime(initialRecord.checkInTime || '09:00');
        setCheckOutTime(initialRecord.checkOutTime || '17:00');
        setRemarks(initialRecord.remarks || '');
      } else {
        setEmployeeId(prev => prev || (users[0]?.id || ''));
        setDate(new Date().toISOString().split('T')[0]);
        setStatus('Present');
        setCheckInTime('09:00');
        setCheckOutTime('17:00');
        setRemarks(prev => prev || 'Admin Manual Entry');
      }
    } else {
      setEmployeeId('');
      setRemarks('');
    }
  }, [isOpen, initialRecord]);

  if (!isOpen) return null;

  const selectedUser = users.find(u => u.id === employeeId) || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const recordData = {
      id: initialRecord?.id || `ATT-${date}-${employeeId}`,
      employeeId,
      employeeName: selectedUser.name || initialRecord?.employeeName || 'Employee',
      department: selectedUser.department || initialRecord?.department || 'Engineering',
      project: (selectedUser.assignedProjects && selectedUser.assignedProjects[0]) || initialRecord?.project || 'Nexora ERP',
      role: selectedUser.role || 'member',
      date,
      checkInTime,
      checkOutTime,
      status,
      remarks: remarks || 'Admin Override'
    };

    await onSave(recordData);
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl border border-slate-200 dark:border-white/20 rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950/80">
            <div className="flex items-center gap-2 font-black text-base text-slate-900 dark:text-white">
              <ShieldAlert className="h-5 w-5 text-indigo-600 dark:text-[#818cf8]" />
              <span>{initialRecord ? 'Edit Attendance Record' : 'Mark Manual Attendance'}</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
            
            {/* Employee Selection */}
            <div>
              <label className="block text-xs font-black mb-1.5 text-slate-700 dark:text-slate-200">
                Select Employee
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={!!initialRecord}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-black disabled:opacity-60"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.id}) - {u.department || 'Engineering'}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black mb-1.5 text-slate-700 dark:text-slate-200">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black mb-1.5 text-slate-700 dark:text-slate-200">
                  Attendance Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-black"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>
            </div>

            {/* Timings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black mb-1.5 text-slate-700 dark:text-slate-200">
                  Check-In Time
                </label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black mb-1.5 text-slate-700 dark:text-slate-200">
                  Check-Out Time
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-mono font-bold"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-black mb-1.5 text-slate-700 dark:text-slate-200">
                Remarks / Reason
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Approved leave, Client on-site, Manual correction"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-bold"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Attendance Record'}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
