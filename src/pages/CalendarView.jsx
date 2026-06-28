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
    // Correct local time padding
    const dateObj = new Date(year, month, i);
    // Offset local offset timezone issue
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
    'Completed': 'bg-emerald-500/20 text-emerald-300',
    'In Progress': 'bg-blue-500/20 text-blue-300',
    'Blocked': 'bg-rose-500/20 text-rose-300',
    'Not Started': 'bg-slate-500/20 text-slate-300',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      
      {/* Interactive Calendar grid */}
      <div className="lg:col-span-2 glass-panel p-5 rounded-2xl shadow-glass flex flex-col h-[520px]">
        {/* Month Toolbar */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <CalIcon className="h-5 w-5 text-nexora-purple" />
            <h3 className="text-sm font-bold text-slate-200">
              {monthNames[month]} {year}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3 border-b border-slate-800/40">
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

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(cell.dateStr)}
                className={`p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  cell.isCurrentMonth ? 'bg-transparent text-slate-200' : 'bg-transparent text-slate-600 border-transparent opacity-30 pointer-events-none'
                } ${
                  isSelected ? 'border-nexora-purple bg-nexora-purple/5 shadow-glass' : 'border-slate-800/20 hover:border-slate-700/60'
                } ${
                  isToday ? 'bg-slate-800/35 border-slate-700' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-extrabold font-sans h-5 w-5 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-nexora-purple text-white shadow-glow-purple font-bold' : ''
                  }`}>
                    {cell.day}
                  </span>
                </div>

                {/* Submissions markers dots */}
                <div className="flex gap-1 justify-center mt-1.5 h-3">
                  {dayReps.slice(0, 3).map((rep) => (
                    <span
                      key={rep.id}
                      title={`${rep.employeeName}: ${rep.projectName}`}
                      className={`h-1.5 w-1.5 rounded-full ${statusColors[rep.status]} shadow-sm`}
                    />
                  ))}
                  {dayReps.length > 3 && (
                    <span className="text-[7px] text-slate-500 font-extrabold leading-none">+{dayReps.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Pane */}
      <div className="glass-panel p-5 rounded-2xl shadow-glass flex flex-col h-[520px] text-left">
        <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800/40 pb-3 mb-4">
          Reports for {selectedDateStr || 'Select a day'}
        </h3>

        <div className="flex-1 overflow-y-auto space-y-3">
          {selectedDateStr === '' ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-slate-500 text-xs">
              <CalIcon className="h-8 w-8 text-slate-600 mb-2.5" />
              Click any highlighted day on the calendar grid to review submitted progress reports.
            </div>
          ) : selectedDayReports.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-slate-500 text-xs">
              No reports submitted on this date.
            </div>
          ) : (
            selectedDayReports.map((rep) => (
              <div
                key={rep.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/20 hover:bg-slate-800/10 transition-all flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-200 block">{rep.employeeName}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{rep.projectName}</span>
                  </div>
                  <button
                    onClick={() => setInspectReport(rep)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
                
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 border-t border-slate-800/50 pt-2 font-medium">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {rep.hoursWorked} hrs</span>
                  <span className={`px-1.5 py-0.5 rounded-md ${workStatusColors[rep.workStatus]}`}>{rep.workStatus}</span>
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
