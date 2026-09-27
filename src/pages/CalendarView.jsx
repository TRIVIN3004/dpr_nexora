import React, { useState, useEffect } from 'react';
import { getCurrentUser, formatLocalDate, getTodayString } from '../utils/database';
import { useDatabaseStore } from '../context/DatabaseContext';
import { ChevronLeft, ChevronRight, Eye, Calendar as CalIcon, Clock, Layers, Sparkles } from 'lucide-react';
import ReportModal from '../components/ReportModal';

export default function CalendarView() {
  const [currentUser, setCurrentUser] = useState(null);
  const { reports: dbReports, invalidateStore } = useDatabaseStore();
  const reports = dbReports || [];
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Selection detail state
  const [selectedDayReports, setSelectedDayReports] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [inspectReport, setInspectReport] = useState(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
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

  const handleGoToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    handleDayClick(getTodayString());
  };

  // Month info
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay(); // day of week index for first of month (0 = Sun)
  const totalDays = new Date(year, month + 1, 0).getDate(); // last day of current month
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const formatYMD = (y, m, d) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const todayStr = getTodayString();

  const daysArray = [];

  // Previous month padded days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = prevMonthTotalDays - i;
    const prevDate = new Date(year, month - 1, prevDay);
    daysArray.push({
      day: prevDay,
      isCurrentMonth: false,
      dateStr: formatYMD(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate())
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push({
      day: i,
      isCurrentMonth: true,
      dateStr: formatYMD(year, month, i)
    });
  }

  // Next month padded days to complete grid of 42 (6 rows)
  const remainingCells = 42 - daysArray.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    daysArray.push({
      day: i,
      isCurrentMonth: false,
      dateStr: formatYMD(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate())
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
      <div className="lg:col-span-2 p-6 rounded-3xl border shadow-sm flex flex-col h-[580px] bg-white" style={{ borderColor: '#cbd5e1' }}>
        {/* Month Toolbar */}
        <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <CalIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {monthNames[month]} {year}
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Today: {todayStr}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGoToday}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-2 rounded-xl transition-all cursor-pointer shadow-xs bg-white text-slate-800 border border-slate-300 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-2 rounded-xl transition-all cursor-pointer shadow-xs bg-white text-slate-800 border border-slate-300 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center text-xs font-black uppercase tracking-wider pb-3 border-b border-slate-200 text-slate-700">
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
            const isToday = cell.dateStr === todayStr;
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
              cellBg = '#f0fdf4';
              cellBorder = '2px solid #16a34a';
              textColor = '#166534';
            }

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(cell.dateStr)}
                className={`p-2 rounded-2xl flex flex-col justify-between cursor-pointer transition-all shadow-xs hover:border-indigo-400 ${
                  isToday ? 'ring-2 ring-emerald-400 ring-offset-1' : ''
                }`}
                style={{ backgroundColor: cellBg, border: cellBorder }}
              >
                <div className="flex justify-between items-center">
                  <span 
                    className={`text-xs font-black h-5 w-5 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-emerald-600 text-white shadow-xs' : ''
                    }`}
                    style={{ 
                      color: isToday ? '#ffffff' : textColor 
                    }}
                  >
                    {cell.day}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">
                      Today
                    </span>
                  )}
                </div>

                {/* Submissions markers dots */}
                <div className="flex gap-1 justify-center mt-1.5 h-3">
                  {dayReps.slice(0, 3).map((rep) => (
                    <span
                      key={rep.id}
                      title={`${rep.employeeName}: ${rep.projectName} (${rep.status})`}
                      className={`h-2 w-2 rounded-full ${statusColors[rep.status]} shadow-xs`}
                    />
                  ))}
                  {dayReps.length > 3 && (
                    <span className="text-[8px] font-black leading-none text-slate-700">+{dayReps.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Pane */}
      <div className="p-6 rounded-3xl border shadow-sm flex flex-col h-[580px] text-left bg-white" style={{ borderColor: '#cbd5e1' }}>
        <div className="border-b pb-3 mb-4 border-slate-200">
          <h3 className="text-sm font-black text-slate-900">
            {selectedDateStr ? `Submissions for ${selectedDateStr}` : 'Select a Day'}
          </h3>
          {selectedDateStr === todayStr && (
            <span className="text-[11px] font-bold text-emerald-600">
              (Today's Submissions)
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {selectedDateStr === '' ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-xs font-bold text-slate-500">
              <CalIcon className="h-8 w-8 text-indigo-600 mb-2.5" />
              Click any highlighted day on the calendar grid to review submitted progress reports.
            </div>
          ) : selectedDayReports.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-xs font-bold text-slate-500">
              No reports submitted on this date ({selectedDateStr}).
            </div>
          ) : (
            selectedDayReports.map((rep) => (
              <div
                key={rep.id}
                className="p-3.5 rounded-2xl border flex flex-col gap-2 shadow-xs bg-slate-50 border-slate-200"
              >
                <div className="flex justify-between items-start">
                  <div className="text-xs">
                    <span className="font-extrabold block text-slate-900">{rep.employeeName}</span>
                    <span className="text-[11px] font-bold text-slate-600">{rep.projectName}</span>
                  </div>
                  <button
                    onClick={() => setInspectReport(rep)}
                    className="p-1.5 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-white cursor-pointer"
                  >
                    <Eye className="h-4 w-4 text-indigo-600" />
                  </button>
                </div>
                
                <div className="flex justify-between text-[11px] font-extrabold border-t pt-2 border-slate-200 text-slate-800">
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
            invalidateStore?.();
            handleDayClick(selectedDateStr);
          }}
        />
      )}

    </div>
  );
}
