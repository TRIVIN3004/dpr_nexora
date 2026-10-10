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
    'Completed': 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40',
    'In Progress': 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40',
    'Blocked': 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40',
    'Not Started': 'bg-slate-100 dark:bg-slate-500/20 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-500/40',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      
      {/* Interactive Calendar grid */}
      <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl flex flex-col h-[580px]">
        {/* Month Toolbar */}
        <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-slate-900 dark:bg-indigo-950/70 border border-slate-800 dark:border-indigo-800/60 flex items-center justify-center text-[#818cf8] shadow-[0_0_8px_rgba(129,140,248,0.5)]">
              <CalIcon className="h-5 w-5 text-[#818cf8]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
                {monthNames[month]} {year}
              </h3>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300">
                Today: {todayStr}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGoToday}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-600/30 hover:bg-indigo-100 dark:hover:bg-indigo-600/50 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/40 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-2 rounded-xl transition-all cursor-pointer shadow-xs bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/15 hover:bg-slate-200 dark:hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-2 rounded-xl transition-all cursor-pointer shadow-xs bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/15 hover:bg-slate-200 dark:hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center text-xs font-black uppercase tracking-wider pb-3 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-200">
          <span className="text-rose-600 dark:text-rose-400 font-extrabold">
            Sun <span className="text-[9px] lowercase font-semibold text-rose-500/80">(off)</span>
          </span>
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
            const isSunday = new Date(cell.dateStr + 'T00:00:00').getDay() === 0;
            
            // Get day reports scoped by current user role
            const dayReps = reports.filter(r => {
              const isOwner = currentUser?.role === 'admin' || r.employeeEmail === currentUser?.email;
              return r.date === cell.dateStr && isOwner;
            });

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(cell.dateStr)}
                className={`p-2 rounded-2xl flex flex-col justify-between cursor-pointer transition-all shadow-xs ${
                  isSelected 
                    ? 'bg-indigo-50 dark:bg-indigo-600/40 border-2 border-indigo-500 dark:border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                    : isToday
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 border-2 border-emerald-500 dark:border-emerald-400'
                      : isSunday && cell.isCurrentMonth
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 hover:bg-rose-100/60 dark:hover:bg-rose-950/40'
                        : cell.isCurrentMonth
                          ? 'bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20'
                          : 'bg-slate-100/40 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 opacity-40'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span 
                    className={`text-xs font-black h-5 w-5 flex items-center justify-center rounded-full ${
                      isToday 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : isSunday && cell.isCurrentMonth
                          ? 'text-rose-600 dark:text-rose-400'
                          : cell.isCurrentMonth 
                            ? 'text-slate-900 dark:text-white' 
                            : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {isToday ? (
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-tighter">
                      Today
                    </span>
                  ) : isSunday && cell.isCurrentMonth ? (
                    <span className="text-[8px] font-extrabold text-rose-500/90 dark:text-rose-400/80 uppercase tracking-tighter">
                      Off
                    </span>
                  ) : null}
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
                    <span className="text-[8px] font-black leading-none text-slate-500 dark:text-slate-300">+{dayReps.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Pane */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl flex flex-col h-[580px] text-left">
        <div className="border-b pb-3 mb-4 border-slate-200 dark:border-white/10">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {selectedDateStr ? `Submissions for ${selectedDateStr}` : 'Select a Day'}
          </h3>
          {selectedDateStr === todayStr && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              (Today's Submissions)
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {selectedDateStr === '' ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-xs font-bold text-slate-500 dark:text-slate-300">
              <CalIcon className="h-8 w-8 text-[#818cf8] mb-2.5" />
              Click any highlighted day on the calendar grid to review submitted progress reports.
            </div>
          ) : selectedDayReports.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-xs font-bold text-slate-500 dark:text-slate-300">
              No reports submitted on this date ({selectedDateStr}).
            </div>
          ) : (
            selectedDayReports.map((rep) => (
              <div
                key={rep.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col gap-2 shadow-xs bg-slate-50 dark:bg-white/5 backdrop-blur-md"
              >
                <div className="flex justify-between items-start">
                  <div className="text-xs">
                    <span className="font-extrabold block text-slate-900 dark:text-white">{rep.employeeName}</span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300">{rep.projectName}</span>
                  </div>
                  <button
                    onClick={() => setInspectReport(rep)}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <Eye className="h-4 w-4 text-[#818cf8]" />
                  </button>
                </div>
                
                <div className="flex justify-between text-[11px] font-extrabold border-t pt-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-[#818cf8]" /> {rep.hoursWorked} hrs</span>
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
