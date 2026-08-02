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
    if (initialRecord) {
      setEmployeeId(initialRecord.employeeId || '');
      setDate(initialRecord.date || new Date().toISOString().split('T')[0]);
      setStatus(initialRecord.status || 'Present');
      setCheckInTime(initialRecord.checkInTime || '09:00');
      setCheckOutTime(initialRecord.checkOutTime || '17:00');
      setRemarks(initialRecord.remarks || '');
    } else if (users.length > 0) {
      setEmployeeId(users[0].id);
    }
  }, [initialRecord, users]);

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
          className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <ShieldAlert className="h-5 w-5 text-indigo-600" />
              <span>{initialRecord ? 'Edit Attendance Record' : 'Manual Attendance Override'}</span>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Employee Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Employee
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={!!initialRecord}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Attendance Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>
            </div>

            {/* Check-In / Check-Out Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Check-In Time
                </label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Check-Out Time
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Remarks / Override Reason
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for manual entry or status edit..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Audit History Timeline */}
            {initialRecord?.editHistory && initialRecord.editHistory.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                  <History className="h-3.5 w-3.5 text-indigo-600" />
                  Edit Audit Trail
                </span>
                <div className="max-h-24 overflow-y-auto space-y-1.5 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {initialRecord.editHistory.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-600 border-b border-slate-200/60 pb-1 last:border-0">
                      <span>{item.updatedBy}: {item.previousStatus} ➔ {item.newStatus}</span>
                      <span className="text-slate-400">{new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
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
