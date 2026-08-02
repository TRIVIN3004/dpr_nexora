import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  CalendarCheck, 
  AlertTriangle, 
  UserX, 
  BarChart3, 
  SlidersHorizontal, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  QrCode, 
  ScanFace, 
  Plus, 
  Filter, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Settings as SettingsIcon,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

import AttendanceStatCard from '../components/Attendance/AttendanceStatCard';
import CheckInWidget from '../components/Attendance/CheckInWidget';
import QRCodeAttendance from '../components/Attendance/QRCodeAttendance';
import FaceRecognitionWidget from '../components/Attendance/FaceRecognitionWidget';
import AdminAttendanceModal from '../components/Attendance/AdminAttendanceModal';
import ReactivateUserModal from '../components/Attendance/ReactivateUserModal';

import { getDatabase, getCurrentUser } from '../utils/database';
import { 
  getAttendanceRecords, 
  getAttendanceSettings, 
  updateAttendanceSettings, 
  markCheckIn, 
  markCheckOut, 
  adminUpdateAttendance, 
  calculateEmployeeStats, 
  evaluateCompanyAttendancePolicy, 
  reactivateEmployeeAccount,
  getTodayString
} from '../utils/attendanceDatabase';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler
);

export default function Attendance() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [records, setRecords] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, checkin, todays, calendar, history, warnings, settings
  const [checkInMethod, setCheckInMethod] = useState('daily'); // daily, qr, face

  // Admin Modals
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [targetReactivateUser, setTargetReactivateUser] = useState(null);

  // Filters for History / Reports
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterProject, setFilterProject] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Settings State Form
  const [settingsForm, setSettingsForm] = useState({
    officeStartTime: '09:00',
    officeEndTime: '17:00',
    lateEntryTime: '09:15',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    minimumAttendancePct: 75,
    warningPercentage: 50,
    terminationPercentage: 50
  });

  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    const currUser = getCurrentUser();
    setCurrentUser(currUser);

    const dbData = await getDatabase();
    setUsers(dbData.users || []);
    setProjects(dbData.projects || []);

    const attRecords = await getAttendanceRecords();
    setRecords(attRecords);

    const attSettings = await getAttendanceSettings();
    setSettings(attSettings);
    if (attSettings) {
      setSettingsForm(attSettings);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('database_updated', handleUpdate);
    return () => window.removeEventListener('database_updated', handleUpdate);
  }, []);

  const isAdmin = currentUser?.role === 'admin';
  const todayStr = getTodayString();

  // Today's record for active logged in user
  const userTodayRecord = records.find(r => r.employeeId === currentUser?.id && r.date === todayStr);

  // Filtered staff list excluding admins for metrics
  const staffUsers = useMemo(() => users.filter(u => u.role !== 'admin'), [users]);

  // Calculated Stats per Employee
  const employeeStatsMap = useMemo(() => {
    const map = {};
    users.forEach(u => {
      map[u.id] = calculateEmployeeStats(u.id, records, settings);
    });
    return map;
  }, [users, records, settings]);

  // Overall Workforce Metrics Today
  const todayRecords = records.filter(r => r.date === todayStr);
  const presentTodayCount = todayRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const lateTodayCount = todayRecords.filter(r => r.status === 'Late').length;
  const absentTodayCount = staffUsers.length - presentTodayCount;

  // Global Attendance Rate
  const totalUserPctSum = staffUsers.reduce((sum, u) => sum + (employeeStatsMap[u.id]?.attendancePct || 0), 0);
  const avgAttendanceRate = staffUsers.length > 0 ? Math.round(totalUserPctSum / staffUsers.length) : 100;

  // Warning & Termination lists
  const warningsList = staffUsers.filter(u => {
    const pct = employeeStatsMap[u.id]?.attendancePct || 100;
    return pct >= 50 && pct < 75;
  });

  const terminatedList = staffUsers.filter(u => {
    const pct = employeeStatsMap[u.id]?.attendancePct || 100;
    return pct < 50 || u.status === 'Terminated' || u.isTerminated;
  });

  // Unique Departments & Projects for Filter dropdowns
  const departmentsList = useMemo(() => {
    const set = new Set(users.map(u => u.department).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [users]);

  const projectsListOptions = useMemo(() => {
    return ['All', ...projects.map(p => p.name)];
  }, [projects]);

  // History Filtered Records
  const filteredHistory = useMemo(() => {
    return records.filter(r => {
      const matchSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = filterDepartment === 'All' || r.department === filterDepartment;
      const matchProj = filterProject === 'All' || r.project === filterProject;
      const matchStatus = filterStatus === 'All' || r.status === filterStatus;
      return matchSearch && matchDept && matchProj && matchStatus;
    });
  }, [records, searchTerm, filterDepartment, filterProject, filterStatus]);

  // Check-In Action
  const handleUserCheckIn = async (remarks = '', method = 'Self') => {
    const res = await markCheckIn(currentUser, method, remarks);
    if (res.success) {
      showToast('Daily Check-In recorded successfully!');
      loadData();
    } else {
      showToast(res.error || 'Failed to check in.');
    }
  };

  // Check-Out Action
  const handleUserCheckOut = async () => {
    const res = await markCheckOut(currentUser);
    if (res.success) {
      showToast('Daily Check-Out logged successfully!');
      loadData();
    } else {
      showToast(res.error || 'Failed to check out.');
    }
  };

  // Admin Manual Attendance Save
  const handleAdminSaveAttendance = async (attendanceData) => {
    const res = await adminUpdateAttendance(attendanceData, currentUser?.name || 'Admin');
    if (res.success) {
      showToast('Attendance record saved successfully!');
      loadData();
    } else {
      showToast('Failed to save record.');
    }
  };

  // Admin Reactivate Account
  const handleReactivateUser = async (empId) => {
    const res = await reactivateEmployeeAccount(empId, currentUser?.name || 'Admin');
    if (res.success) {
      showToast(`Employee account reactivated successfully!`);
      loadData();
    } else {
      showToast(`Failed to reactivate account.`);
    }
  };

  // Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const res = await updateAttendanceSettings(settingsForm);
    if (res.success) {
      showToast('Attendance settings saved and updated!');
      loadData();
    }
  };

  // Export PDF Report
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Nexora Tech - Attendance Management Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated Date: ${new Date().toLocaleString()} | Total Records: ${filteredHistory.length}`, 14, 28);

    const tableColumn = ["Date", "Employee ID", "Name", "Department", "Project", "In Time", "Out Time", "Status"];
    const tableRows = filteredHistory.map(r => [
      r.date,
      r.employeeId,
      r.employeeName,
      r.department || 'N/A',
      r.project || 'N/A',
      r.checkInTime || '--:--',
      r.checkOutTime || '--:--',
      r.status
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 34,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8 }
    });

    doc.save(`Attendance_Report_${getTodayString()}.pdf`);
    showToast('PDF Export downloaded!');
  };

  // Export Excel Report
  const exportExcel = () => {
    const exportData = filteredHistory.map(r => ({
      "Date": r.date,
      "Employee ID": r.employeeId,
      "Employee Name": r.employeeName,
      "Department": r.department || 'N/A',
      "Project": r.project || 'N/A',
      "Role": r.role,
      "Check-In Time": r.checkInTime || '--:--',
      "Check-Out Time": r.checkOutTime || '--:--',
      "Status": r.status,
      "Marked By": r.markedBy,
      "Remarks": r.remarks
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `Attendance_Report_${getTodayString()}.xlsx`);
    showToast('Excel Export downloaded!');
  };

  // Chart Data Generators
  const monthlyChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: [96, 94, 91, avgAttendanceRate],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const projectChartData = {
    labels: projects.map(p => p.name),
    datasets: [
      {
        label: 'Present Staff Count',
        data: projects.map((p, i) => Math.max(1, Math.floor(presentTodayCount * (0.4 / (i + 1)) + 1))),
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)']
      }
    ]
  };

  const departmentChartData = {
    labels: ['Engineering', 'Design', 'Quality Assurance', 'Management'],
    datasets: [
      {
        data: [
          users.filter(u => u.department === 'Engineering').length,
          users.filter(u => u.department === 'Design').length,
          users.filter(u => u.department === 'Quality Assurance').length,
          users.filter(u => u.department === 'Management').length
        ],
        backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']
      }
    ]
  };

  if (loading || !currentUser) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-nexora-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  // Active user individual metrics
  const myStats = employeeStatsMap[currentUser.id] || calculateEmployeeStats(currentUser.id, records, settings);

  return (
    <div className="space-y-6">
      
      {/* Toast popup */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-nexora-purple shadow-glow-purple text-xs font-semibold text-slate-100 flex items-center gap-2"
          >
            <span className="h-2 w-2 rounded-full bg-nexora-purple animate-ping" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff Low Attendance Warning Notification Banner */}
      {!isAdmin && myStats.attendancePct < 75 && myStats.attendancePct >= 50 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between gap-4 shadow-glow-amber"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                Attendance Policy Warning
              </h4>
              <p className="text-xs font-medium text-slate-200 mt-0.5">
                Your attendance is currently below the company requirement of 75%. Please improve your attendance.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold font-mono">
            {myStats.attendancePct}% Attendance
          </span>
        </motion.div>
      )}

      {/* Top Header & Sub-Navigation Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-nexora-purple/10 border border-nexora-purple/30 text-nexora-purple">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              Attendance Management
            </h1>
            <p className="text-xs text-slate-400">
              Workforce monitoring, automated policy checks, and attendance analytics
            </p>
          </div>
        </div>

        {/* Action Button for Admin */}
        {isAdmin && (
          <button
            onClick={() => {
              setSelectedRecord(null);
              setShowAdminModal(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-nexora-indigo to-nexora-purple text-white text-xs font-bold shadow-glow-purple flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Mark Manual Attendance</span>
          </button>
        )}
      </div>

      {/* Tab Controls */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'checkin', label: 'Mark Attendance', icon: Clock },
          { id: 'todays', label: "Today's Attendance", icon: CheckCircle2 },
          { id: 'calendar', label: 'Attendance Calendar', icon: CalendarCheck },
          { id: 'history', label: 'Reports & History', icon: FileText },
          { id: 'warnings', label: `Warnings & Deactivations (${warningsList.length + terminatedList.length})`, icon: ShieldAlert, badgeColor: 'bg-rose-500' },
          ...(isAdmin ? [{ id: 'settings', label: 'Settings', icon: SettingsIcon }] : [])
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-nexora-indigo/30 to-nexora-purple/20 text-white border border-nexora-purple/40 shadow-glow-purple'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-nexora-purple' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 1: DASHBOARD */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AttendanceStatCard 
              title="Attendance Rate"
              value={`${avgAttendanceRate}%`}
              subtitle="Company-wide Average"
              icon={BarChart3}
              color="purple"
              badge="75% Minimum Req."
              trend={{ label: 'Compliant', positive: avgAttendanceRate >= 75 }}
            />
            <AttendanceStatCard 
              title="Present Today"
              value={presentTodayCount}
              subtitle={`Out of ${staffUsers.length} active staff`}
              icon={UserCheck}
              color="emerald"
            />
            <AttendanceStatCard 
              title="Late Entries Today"
              value={lateTodayCount}
              subtitle="Past 09:15 AM threshold"
              icon={Clock3}
              color="amber"
            />
            <AttendanceStatCard 
              title="Policy Warnings / Terms"
              value={`${warningsList.length} / ${terminatedList.length}`}
              subtitle="Requires Admin Review"
              icon={AlertTriangle}
              color="rose"
            />
          </div>

          {/* Status Indicator Legend Widgets */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Attendance Policy Tiers & Status Indicators
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                <span className="text-xs font-bold text-cyan-400 block">95%+</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Excellent</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-xs font-bold text-emerald-400 block">90% - 94%</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Very Good</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <span className="text-xs font-bold text-blue-400 block">75% - 89%</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Good</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-xs font-bold text-amber-400 block">50% - 74%</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Warning</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                <span className="text-xs font-bold text-rose-400 block">&lt; 50%</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Terminated</span>
              </div>
            </div>
          </div>

          {/* Interactive Chart Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Monthly Trend */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-200">
                Monthly Attendance Trend
              </h4>
              <div className="h-64">
                <Line 
                  data={monthlyChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { min: 40, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } },
                      x: { grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                  }} 
                />
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-200">
                Department Distribution
              </h4>
              <div className="h-64 flex items-center justify-center">
                <Doughnut 
                  data={departmentChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 2: MARK ATTENDANCE (CHECK-IN) */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'checkin' && (
        <div className="space-y-6">
          {/* Method Selector Tabs */}
          <div className="flex items-center justify-center gap-3 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-md mx-auto">
            <button
              onClick={() => setCheckInMethod('daily')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                checkInMethod === 'daily' ? 'bg-nexora-purple text-white shadow-glow-purple' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Check-In / Out</span>
            </button>

            <button
              onClick={() => setCheckInMethod('qr')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                checkInMethod === 'qr' ? 'bg-nexora-purple text-white shadow-glow-purple' : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>QR Code</span>
            </button>

            <button
              onClick={() => setCheckInMethod('face')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                checkInMethod === 'face' ? 'bg-nexora-purple text-white shadow-glow-purple' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ScanFace className="h-4 w-4" />
              <span>Face Scan</span>
            </button>
          </div>

          {/* Selected Method View */}
          {checkInMethod === 'daily' && (
            <CheckInWidget 
              currentUser={currentUser}
              todayRecord={userTodayRecord}
              settings={settings}
              onCheckIn={(rem) => handleUserCheckIn(rem, 'Self')}
              onCheckOut={handleUserCheckOut}
            />
          )}

          {checkInMethod === 'qr' && (
            <QRCodeAttendance 
              currentUser={currentUser}
              onScanComplete={(method) => handleUserCheckIn('Scanned via QR Code Badge', method)}
            />
          )}

          {checkInMethod === 'face' && (
            <FaceRecognitionWidget 
              currentUser={currentUser}
              onScanComplete={(method) => handleUserCheckIn('AI Biometric Facial Recognition Verified', method)}
            />
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 3: TODAY'S ATTENDANCE */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'todays' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">
              Live Workforce Roster - {todayStr}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {presentTodayCount} Present / {absentTodayCount} Absent
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Assigned Project</th>
                  <th className="p-3.5">Check-In</th>
                  <th className="p-3.5">Check-Out</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Remarks</th>
                  {isAdmin && <th className="p-3.5 text-right">Admin Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const r = records.find(rec => rec.employeeId === u.id && rec.date === todayStr);
                  const isPresent = r?.status === 'Present';
                  const isLate = r?.status === 'Late';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 flex items-center gap-3">
                        <img 
                          src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                          alt={u.name} 
                          className="h-8 w-8 rounded-full object-cover border border-slate-800"
                        />
                        <div>
                          <span className="font-bold text-slate-100 block">{u.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{u.id}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-300">{u.department || 'Engineering'}</td>
                      <td className="p-3.5 text-slate-300">{(u.assignedProjects && u.assignedProjects[0]) || 'Nexora ERP'}</td>
                      <td className="p-3.5 font-mono text-slate-200">{r?.checkInTime || '--:--'}</td>
                      <td className="p-3.5 font-mono text-slate-200">{r?.checkOutTime || '--:--'}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isLate 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : isPresent 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {r?.status || 'Not Marked'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 truncate max-w-xs">{r?.remarks || 'N/A'}</td>
                      {isAdmin && (
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedRecord(r || { employeeId: u.id, employeeName: u.name, date: todayStr, status: 'Present' });
                              setShowAdminModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 4: ATTENDANCE CALENDAR */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">
              Interactive Attendance Calendar - {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() - 1)))}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() + 1)))}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }).map((_, i) => {
              const dayNum = i + 1;
              const dateKey = `2026-08-${String(dayNum).padStart(2, '0')}`;
              const rec = records.find(r => r.employeeId === currentUser?.id && r.date === dateKey);

              return (
                <div 
                  key={dayNum}
                  className={`h-24 p-2 rounded-2xl border flex flex-col justify-between transition-all ${
                    rec?.status === 'Present'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : rec?.status === 'Late'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : rec?.status === 'Absent'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-xs font-bold">{dayNum}</span>
                  {rec ? (
                    <div className="text-[10px] font-semibold truncate">
                      <span>{rec.status}</span>
                      <span className="block font-mono text-[9px] text-slate-400">{rec.checkInTime}</span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-600">--</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 5: HISTORY & REPORTS */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search Employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-nexora-purple"
                />
              </div>

              {/* Department Filter */}
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              >
                {departmentsList.map(d => <option key={d} value={d}>Dept: {d}</option>)}
              </select>

              {/* Project Filter */}
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              >
                {projectsListOptions.map(p => <option key={p} value={p}>Project: {p}</option>)}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              >
                <option value="All">Status: All</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </select>

            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={exportPDF}
                className="py-2 px-3.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={exportExcel}
                className="py-2 px-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Project</th>
                  <th className="p-3.5">Check-In</th>
                  <th className="p-3.5">Check-Out</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHistory.slice(0, 50).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-mono text-slate-300">{r.date}</td>
                    <td className="p-3.5 font-bold text-slate-100">{r.employeeName} ({r.employeeId})</td>
                    <td className="p-3.5 text-slate-300">{r.department || 'N/A'}</td>
                    <td className="p-3.5 text-slate-300">{r.project || 'N/A'}</td>
                    <td className="p-3.5 font-mono text-slate-200">{r.checkInTime || '--:--'}</td>
                    <td className="p-3.5 font-mono text-slate-200">{r.checkOutTime || '--:--'}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        r.status === 'Late' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        r.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{r.markedBy || 'Self'}</td>
                    <td className="p-3.5 text-slate-400 truncate max-w-xs">{r.remarks || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 6: WARNINGS & DEACTIVATIONS */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'warnings' && (
        <div className="space-y-6">
          
          {/* Active Warnings Section */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="h-5 w-5" />
              <span>Active Attendance Warnings (50% - 74%)</span>
            </div>

            {warningsList.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No employees currently under attendance warning status.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {warningsList.map(u => {
                  const st = employeeStatsMap[u.id];
                  return (
                    <div key={u.id} className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-100">{u.name} ({u.id})</h4>
                        <p className="text-[11px] text-slate-400">{u.department} • {u.email}</p>
                        <span className="inline-block text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">
                          Warning Notice Issued
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-amber-400 font-mono block">{st?.attendancePct}%</span>
                        <span className="text-[10px] text-slate-500">Req: 75%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Terminated Accounts Section */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <UserX className="h-5 w-5" />
                <span>Deactivated / Terminated Accounts (&lt;50% Attendance)</span>
              </div>
            </div>

            {terminatedList.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No accounts deactivated under attendance policy.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {terminatedList.map(u => {
                  const st = employeeStatsMap[u.id];
                  return (
                    <div key={u.id} className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-100">{u.name} ({u.id})</h4>
                        <p className="text-[11px] text-slate-400">Reason: Attendance Below Company Policy</p>
                        <span className="inline-block text-[10px] text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded">
                          Login Access Revoked
                        </span>
                      </div>

                      <div className="text-right space-y-2">
                        <span className="text-lg font-black text-rose-400 font-mono block">{st?.attendancePct || 42}%</span>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setTargetReactivateUser(u);
                              setShowReactivateModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-glow-emerald cursor-pointer"
                          >
                            Reactivate Access
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 7: SETTINGS (ADMIN ONLY) */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'settings' && isAdmin && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 max-w-3xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white">Attendance Policy Parameters</h3>
            <p className="text-xs text-slate-400">Configure global office timings, late entries, working days, and policy threshold percentages.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Office Start Time</label>
              <input 
                type="time" 
                value={settingsForm.officeStartTime} 
                onChange={(e) => setSettingsForm({ ...settingsForm, officeStartTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-nexora-purple"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Late Entry Threshold</label>
              <input 
                type="time" 
                value={settingsForm.lateEntryTime} 
                onChange={(e) => setSettingsForm({ ...settingsForm, lateEntryTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-nexora-purple"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Office End Time</label>
              <input 
                type="time" 
                value={settingsForm.officeEndTime} 
                onChange={(e) => setSettingsForm({ ...settingsForm, officeEndTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-nexora-purple"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Required Minimum %</label>
              <input 
                type="number" 
                value={settingsForm.minimumAttendancePct} 
                onChange={(e) => setSettingsForm({ ...settingsForm, minimumAttendancePct: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-nexora-purple"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Warning Threshold %</label>
              <input 
                type="number" 
                value={settingsForm.warningPercentage} 
                onChange={(e) => setSettingsForm({ ...settingsForm, warningPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-nexora-purple"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Termination Threshold %</label>
              <input 
                type="number" 
                value={settingsForm.terminationPercentage} 
                onChange={(e) => setSettingsForm({ ...settingsForm, terminationPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-nexora-purple"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-nexora-indigo to-nexora-purple text-white text-xs font-bold shadow-glow-purple cursor-pointer"
            >
              Save Policy Configuration
            </button>
          </div>
        </form>
      )}

      {/* Admin Manual Override Modal */}
      <AdminAttendanceModal 
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        users={users}
        initialRecord={selectedRecord}
        onSave={handleAdminSaveAttendance}
      />

      {/* Admin Reactivate Employee Modal */}
      <ReactivateUserModal 
        isOpen={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        targetUser={targetReactivateUser}
        onReactivate={handleReactivateUser}
      />

    </div>
  );
}
