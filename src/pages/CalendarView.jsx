import React, { useState, useEffect } from 'react';
import { getDatabase, getCurrentUser } from '../utils/database';
import { ChevronLeft, ChevronRight, Eye, Calendar as CalIcon, Clock, Layers } from 'lucide-react';
import ReportModal from '../components/ReportModal';

export default function CalendarView() {
  const [currentUser, setCurrentUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Selection detail state
  const [selectedDayReports, setSelectedDayReports] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [inspectReport, setInspectReport] = useState(null);

  const loadData = async () => {
    setCurrentUser(getCurrentUser());
    const db = await getDatabase();
    if (db) setReports(db.reports);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('database_updated', handleUpdate);
    return () => window.removeEventListener('database_updated', handleUpdate);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayReports([]);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayReports([]);
  };

  // Month info
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay(); // day of week index for first of month
  const totalDays = new Date(year, month + 1, 0).getDate(); // last day of current month
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const daysArray = [];

  // Previous month padded days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysArray.push({
      day: prevMonthTotalDays - i,
      isCurrentMonth: false,
      dateStr: new Date(year, month - 1, prevMonthTotalDays - i).toISOString().split('T')[0]
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    const dateObj = new Date(year, month, i);
    const offset = dateObj.getTimezoneOffset();
    const localDate = new Date(dateObj.getTime() - (offset*60*1000));
    const dStr = localDate.toISOString().split('T')[0];

    daysArray.push({
      day: i,
      isCurrentMonth: true,
      dateStr: dStr
    });
  }

  // Next month padded days to complete grid of 42 (6 rows)
  const remainingCells = 42 - daysArray.length;
  for (let i = 1; i <= remainingCells; i++) {
    daysArray.push({
      day: i,
      isCurrentMonth: false,
      dateStr: new Date(year, month + 1, i).toISOString().split('T')[0]
    });
  }

  const handleDayClick = (dateStr) => {
    const dayReps = reports.filter(r => {
      const isOwner = currentUser?.role === 'admin' || r.employeeEmail === currentUser?.email;
      return r.date === dateStr && isOwner;
    });
    setSelectedDayReports(dayReps);
    setSelectedDateStr(dateStr);
  };

  const statusColors = {
    Approved: 'bg-emerald-500',
    Rejected: 'bg-rose-500',
    Pending: 'bg-amber-500',
  };

  const workStatusColors = {
    'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'In Progress': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'Blocked': 'bg-rose-100 text-rose-800 border-rose-300',
    'Not Started': 'bg-slate-100 text-slate-800 border-slate-300',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      
      {/* Interactive Calendar grid */}
      <div className="lg:col-span-2 p-6 rounded-2xl border shadow-sm flex flex-col h-[560px]" style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}>
        {/* Month Toolbar */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <CalIcon className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-extrabold" style={{ color: '#000000' }}>
              {monthNames[month]} {year}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl transition-all cursor-pointer shadow-xs"
              style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}
            >
              <ChevronLeft className="h-4 w-4" style={{ color: '#0f172a' }} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl transition-all cursor-pointer shadow-xs"
              style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}
            >
              <ChevronRight className="h-4 w-4" style={{ color: '#0f172a' }} />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center text-xs font-black uppercase tracking-wider pb-3 border-b" style={{ color: '#000000', borderColor: '#cbd5e1' }}>
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 flex-1 gap-1.5 mt-3">
          {daysArray.map((cell, idx) => {
            const isToday = cell.dateStr === new Date().toISOString().split('T')[0];
            const isSelected = cell.dateStr === selectedDateStr;
            
            // Get day reports scoped by current user role
            const dayReps = reports.filter(r => {
              const isOwner = currentUser?.role === 'admin' || r.employeeEmail === currentUser?.email;
              return r.date === cell.dateStr && isOwner;
            });

            let cellBg = '#ffffff';
            let cellBorder = '1px solid #e2e8f0';
            let textColor = '#000000';

            if (!cell.isCurrentMonth) {
              cellBg = '#f8fafc';
              cellBorder = '1px solid #f1f5f9';
              textColor = '#94a3b8';
            } else if (isSelected) {
              cellBg = '#eef2ff';
              cellBorder = '2px solid #4f46e5';
              textColor = '#312e81';
            } else if (isToday) {
              cellBg = '#f0f9ff';
              cellBorder = '2px solid #0284c7';
              textColor = '#0369a1';
            }

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(cell.dateStr)}
                className="p-2 rounded-xl flex flex-col justify-between cursor-pointer transition-all shadow-xs"
                style={{ backgroundColor: cellBg, border: cellBorder }}
              >
                <div className="flex justify-between items-center">
                  <span 
                    className="text-xs font-black h-5 w-5 flex items-center justify-center rounded-full"
                    style={{ 
                      backgroundColor: isToday ? '#4f46e5' : 'transparent', 
                      color: isToday ? '#ffffff' : textColor 
                    }}
                  >
                    {cell.day}
                  </span>
                </div>

                {/* Submissions markers dots */}
                <div className="flex gap-1 justify-center mt-1.5 h-3">
                  {dayReps.slice(0, 3).map((rep) => (
                    <span
                      key={rep.id}
                      title={`${rep.employeeName}: ${rep.projectName}`}
                      className={`h-2 w-2 rounded-full ${statusColors[rep.status]} shadow-xs`}
                    />
                  ))}
                  {dayReps.length > 3 && (
                    <span className="text-[8px] font-black leading-none" style={{ color: '#000000' }}>+{dayReps.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Pane */}
      <div className="p-6 rounded-2xl border shadow-sm flex flex-col h-[560px] text-left" style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}>
        <h3 className="text-sm font-extrabold border-b pb-3 mb-4" style={{ color: '#000000', borderColor: '#cbd5e1' }}>
          Reports for {selectedDateStr || 'Select a day'}
        </h3>

        <div className="flex-1 overflow-y-auto space-y-3">
          {selectedDateStr === '' ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-xs font-bold" style={{ color: '#475569' }}>
              <CalIcon className="h-8 w-8 text-indigo-600 mb-2.5" />
              Click any highlighted day on the calendar grid to review submitted progress reports.
            </div>
          ) : selectedDayReports.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-xs font-bold" style={{ color: '#475569' }}>
              No reports submitted on this date.
            </div>
          ) : (
            selectedDayReports.map((rep) => (
              <div
                key={rep.id}
                className="p-3.5 rounded-xl border flex flex-col gap-2 shadow-xs"
                style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}
              >
                <div className="flex justify-between items-start">
                  <div className="text-xs">
                    <span className="font-extrabold block" style={{ color: '#000000' }}>{rep.employeeName}</span>
                    <span className="text-[11px] font-bold" style={{ color: '#475569' }}>{rep.projectName}</span>
                  </div>
                  <button
                    onClick={() => setInspectReport(rep)}
                    className="p-1.5 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-white cursor-pointer"
                  >
                    <Eye className="h-4 w-4 text-indigo-600" />
                  </button>
                </div>
                
                <div className="flex justify-between text-[11px] font-extrabold border-t pt-2" style={{ color: '#1e293b', borderColor: '#e2e8f0' }}>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-indigo-600" /> {rep.hoursWorked} hrs</span>
                  <span className={`px-2 py-0.5 rounded-md border text-[10px] ${workStatusColors[rep.workStatus]}`}>{rep.workStatus}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Report Inspector Modal */}
      {inspectReport && (
        <ReportModal
          isOpen={!!inspectReport}
          report={inspectReport}
          currentUser={currentUser}
          onClose={() => setInspectReport(null)}
          onActionSuccess={() => {
            loadData();
            handleDayClick(selectedDateStr);
          }}
        />
      )}

    </div>
  );
}
