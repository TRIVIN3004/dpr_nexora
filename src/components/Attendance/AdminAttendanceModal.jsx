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
          className="w-full max-w-xl border rounded-2xl shadow-xl overflow-hidden"
          style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
            <div className="flex items-center gap-2 font-black text-base" style={{ color: '#ffffff' }}>
              <ShieldAlert className="h-5 w-5 text-indigo-400" />
              <span style={{ color: '#ffffff' }}>{initialRecord ? 'Edit Attendance Record' : 'Mark Manual Attendance'}</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
              style={{ color: '#ffffff' }}
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4" style={{ backgroundColor: '#ffffff' }}>
            
            {/* Employee Selection */}
            <div>
              <label className="block text-xs font-black mb-1.5" style={{ color: '#000000' }}>
                Select Employee
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={!!initialRecord}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-600 font-black"
                style={{ 
                  backgroundColor: !!initialRecord ? '#f1f5f9' : '#ffffff', 
                  color: '#000000', 
                  WebkitTextFillColor: '#000000', 
                  borderColor: '#cbd5e1', 
                  border: '1px solid #cbd5e1',
                  opacity: 1
                }}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                    {u.name} ({u.id}) - {u.department || 'Engineering'}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: '#000000' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-600 font-black"
                  style={{ backgroundColor: '#ffffff', color: '#000000', WebkitTextFillColor: '#000000', borderColor: '#cbd5e1', border: '1px solid #cbd5e1', opacity: 1 }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: '#000000' }}>
                  Attendance Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-600 font-black"
                  style={{ backgroundColor: '#ffffff', color: '#000000', WebkitTextFillColor: '#000000', borderColor: '#cbd5e1', border: '1px solid #cbd5e1', opacity: 1 }}
                >
                  <option value="Present" style={{ color: '#000000', backgroundColor: '#ffffff' }}>Present</option>
                  <option value="Absent" style={{ color: '#000000', backgroundColor: '#ffffff' }}>Absent</option>
                  <option value="Half Day" style={{ color: '#000000', backgroundColor: '#ffffff' }}>Half Day</option>
                  <option value="Leave" style={{ color: '#000000', backgroundColor: '#ffffff' }}>Leave</option>
                </select>
              </div>
            </div>

            {/* Check-In / Check-Out Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: '#000000' }}>
                  Check-In Time
                </label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-600 font-black"
                  style={{ backgroundColor: '#ffffff', color: '#000000', WebkitTextFillColor: '#000000', borderColor: '#cbd5e1', border: '1px solid #cbd5e1', opacity: 1 }}
                />
              </div>

              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: '#000000' }}>
                  Check-Out Time
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-600 font-black"
                  style={{ backgroundColor: '#ffffff', color: '#000000', WebkitTextFillColor: '#000000', borderColor: '#cbd5e1', border: '1px solid #cbd5e1', opacity: 1 }}
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-black mb-1.5" style={{ color: '#000000' }}>
                Admin Remarks / Override Reason
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for manual entry or status edit..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-600 font-black placeholder-slate-500"
                style={{ backgroundColor: '#ffffff', color: '#000000', WebkitTextFillColor: '#000000', borderColor: '#cbd5e1', border: '1px solid #cbd5e1', opacity: 1 }}
                required
              />
            </div>

            {/* Audit History Timeline */}
            {initialRecord?.editHistory && initialRecord.editHistory.length > 0 && (
              <div className="pt-2 border-t" style={{ borderColor: '#e2e8f0' }}>
                <span className="text-xs font-black flex items-center gap-1.5 mb-2" style={{ color: '#000000' }}>
                  <History className="h-3.5 w-3.5 text-indigo-600" />
                  Edit Audit Trail
                </span>
                <div className="max-h-24 overflow-y-auto space-y-1.5 text-[11px] p-2.5 rounded-xl border" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
                  {initialRecord.editHistory.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b pb-1 last:border-0" style={{ color: '#1e293b', borderColor: '#cbd5e1' }}>
                      <span className="font-bold">{item.updatedBy}: {item.previousStatus} ➔ {item.newStatus}</span>
                      <span style={{ color: '#64748b' }}>{new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: '#cbd5e1' }}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-white text-xs font-black cursor-pointer shadow-xs"
                style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
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
