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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [checkInMethod, setCheckInMethod] = useState('daily');

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

  const userTodayRecord = records.find(r => r.employeeId === currentUser?.id && r.date === todayStr);

  const staffUsers = useMemo(() => users.filter(u => u.role !== 'admin'), [users]);

  const employeeStatsMap = useMemo(() => {
    const map = {};
    users.forEach(u => {
      map[u.id] = calculateEmployeeStats(u.id, records, settings);
    });
    return map;
  }, [users, records, settings]);

  const todayRecords = records.filter(r => r.date === todayStr);
  const presentTodayCount = todayRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const lateTodayCount = todayRecords.filter(r => r.status === 'Late').length;
  const absentTodayCount = Math.max(0, staffUsers.length - presentTodayCount);

  const totalUserPctSum = staffUsers.reduce((sum, u) => sum + (employeeStatsMap[u.id]?.attendancePct || 0), 0);
  const avgAttendanceRate = staffUsers.length > 0 ? Math.round(totalUserPctSum / staffUsers.length) : 100;

  const warningsList = staffUsers.filter(u => {
    const pct = employeeStatsMap[u.id]?.attendancePct || 100;
    return pct >= 50 && pct < 75;
  });

  const terminatedList = staffUsers.filter(u => {
    const pct = employeeStatsMap[u.id]?.attendancePct || 100;
    return pct < 50 || u.status === 'Terminated' || u.isTerminated;
  });

  const departmentsList = useMemo(() => {
    const set = new Set(users.map(u => u.department).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [users]);

  const projectsListOptions = useMemo(() => {
    return ['All', ...projects.map(p => p.name)];
  }, [projects]);

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

  const handleUserCheckIn = async (remarks = '', method = 'Self') => {
    const res = await markCheckIn(currentUser, method, remarks);
    if (res.success) {
      showToast('Daily Check-In recorded successfully!');
      loadData();
    } else {
      showToast(res.error || 'Failed to check in.');
    }
  };

  const handleUserCheckOut = async () => {
    const res = await markCheckOut(currentUser);
    if (res.success) {
      showToast('Daily Check-Out logged successfully!');
      loadData();
    } else {
      showToast(res.error || 'Failed to check out.');
    }
  };

  const handleAdminSaveAttendance = async (attendanceData) => {
    const res = await adminUpdateAttendance(attendanceData, currentUser?.name || 'Admin');
    if (res.success) {
      showToast('Attendance record saved successfully!');
      loadData();
    } else {
      showToast('Failed to save record.');
    }
  };

  const handleReactivateUser = async (empId) => {
    const res = await reactivateEmployeeAccount(empId, currentUser?.name || 'Admin');
    if (res.success) {
      showToast(`Employee account reactivated successfully!`);
      loadData();
    } else {
      showToast(`Failed to reactivate account.`);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const res = await updateAttendanceSettings(settingsForm);
    if (res.success) {
      showToast('Attendance settings saved and updated!');
      loadData();
    }
  };

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

  const monthlyChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: [96, 94, 91, avgAttendanceRate],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4
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
        backgroundColor: ['#2563eb', '#7c3aed', '#059669', '#d97706']
      }
    ]
  };

  if (loading || !currentUser) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

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
            className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-lg text-xs font-semibold flex items-center gap-2"
          >
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff Low Attendance Warning Banner */}
      {!isAdmin && myStats.attendancePct < 75 && myStats.attendancePct >= 50 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                Attendance Policy Warning
              </h4>
              <p className="text-xs font-medium text-amber-900 mt-0.5">
                Your attendance is currently below the company requirement of 75%. Please improve your attendance.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold font-mono">
            {myStats.attendancePct}% Attendance
          </span>
        </motion.div>
      )}

      {/* Header Container */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight" style={{ color: '#0f172a' }}>
              Attendance Management
            </h1>
            <p className="text-xs font-semibold text-slate-600">
              Workforce monitoring, automated policy checks, and attendance analytics
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setSelectedRecord(null);
              setShowAdminModal(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Mark Manual Attendance</span>
          </button>
        )}
      </div>

      {/* Tab Controls */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'checkin', label: 'Mark Attendance', icon: Clock },
          { id: 'todays', label: "Today's Attendance", icon: CheckCircle2 },
          { id: 'calendar', label: 'Attendance Calendar', icon: CalendarCheck },
          { id: 'history', label: 'Reports & History', icon: FileText },
          { id: 'warnings', label: `Warnings & Deactivations (${warningsList.length + terminatedList.length})`, icon: ShieldAlert },
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
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
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

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Attendance Policy Tiers & Status Indicators
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-center">
                <span className="text-xs font-black text-cyan-700 block">95%+</span>
                <span className="text-[10px] text-slate-600 uppercase font-bold">Excellent</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-xs font-black text-emerald-700 block">90% - 94%</span>
                <span className="text-[10px] text-slate-600 uppercase font-bold">Very Good</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <span className="text-xs font-black text-blue-700 block">75% - 89%</span>
                <span className="text-[10px] text-slate-600 uppercase font-bold">Good</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-xs font-black text-amber-700 block">50% - 74%</span>
                <span className="text-[10px] text-slate-600 uppercase font-bold">Warning</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                <span className="text-xs font-black text-rose-700 block">&lt; 50%</span>
                <span className="text-[10px] text-slate-600 uppercase font-bold">Terminated</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900">
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
                      y: { min: 40, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
                      x: { grid: { color: 'rgba(0,0,0,0.05)' } }
                    }
                  }} 
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900">
                Department Distribution
              </h4>
              <div className="h-64 flex items-center justify-center">
                <Doughnut 
                  data={departmentChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#334155', font: { size: 10 } } } }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MARK ATTENDANCE TAB */}
      {activeTab === 'checkin' && (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-3 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 max-w-md mx-auto">
            <button
              onClick={() => setCheckInMethod('daily')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                checkInMethod === 'daily' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Check-In / Out</span>
            </button>

            <button
              onClick={() => setCheckInMethod('qr')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                checkInMethod === 'qr' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>QR Code</span>
            </button>

            <button
              onClick={() => setCheckInMethod('face')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                checkInMethod === 'face' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ScanFace className="h-4 w-4" />
              <span>Face Scan</span>
            </button>
          </div>

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

      {/* TODAY'S ATTENDANCE TAB */}
      {activeTab === 'todays' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Live Workforce Roster - {todayStr}
            </h3>
            <span className="text-xs text-slate-600 font-mono">
              {presentTodayCount} Present / {absentTodayCount} Absent
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => {
                  const r = records.find(rec => rec.employeeId === u.id && rec.date === todayStr);
                  const isPresent = r?.status === 'Present';
                  const isLate = r?.status === 'Late';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 flex items-center gap-3">
                        <img 
                          src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                          alt={u.name} 
                          className="h-8 w-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{u.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{u.id}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700">{u.department || 'Engineering'}</td>
                      <td className="p-3.5 text-slate-700">{(u.assignedProjects && u.assignedProjects[0]) || 'Nexora ERP'}</td>
                      <td className="p-3.5 font-mono text-slate-800">{r?.checkInTime || '--:--'}</td>
                      <td className="p-3.5 font-mono text-slate-800">{r?.checkOutTime || '--:--'}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isLate 
                            ? 'bg-amber-100 text-amber-800 border-amber-300' 
                            : isPresent 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {r?.status || 'Not Marked'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 truncate max-w-xs">{r?.remarks || 'N/A'}</td>
                      {isAdmin && (
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedRecord(r || { employeeId: u.id, employeeName: u.name, date: todayStr, status: 'Present' });
                              setShowAdminModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold cursor-pointer"
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

      {/* ATTENDANCE CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">
              Interactive Attendance Calendar - {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() - 1)))}
                className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() + 1)))}
                className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-600">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 bg-slate-100 rounded-xl border border-slate-200">{day}</div>
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
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : rec?.status === 'Late'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : rec?.status === 'Absent'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-extrabold">{dayNum}</span>
                  {rec ? (
                    <div className="text-[10px] font-bold truncate">
                      <span>{rec.status}</span>
                      <span className="block font-mono text-[9px] text-slate-600">{rec.checkInTime}</span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-400">--</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REPORTS & HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search Employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-none"
              >
                {departmentsList.map(d => <option key={d} value={d}>Dept: {d}</option>)}
              </select>

              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-none"
              >
                {projectsListOptions.map(p => <option key={p} value={p}>Project: {p}</option>)}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-none"
              >
                <option value="All">Status: All</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportPDF}
                className="py-2 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={exportExcel}
                className="py-2 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-200">
                {filteredHistory.slice(0, 50).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-slate-800">{r.date}</td>
                    <td className="p-3.5 font-bold text-slate-900">{r.employeeName} ({r.employeeId})</td>
                    <td className="p-3.5 text-slate-700">{r.department || 'N/A'}</td>
                    <td className="p-3.5 text-slate-700">{r.project || 'N/A'}</td>
                    <td className="p-3.5 font-mono text-slate-800">{r.checkInTime || '--:--'}</td>
                    <td className="p-3.5 font-mono text-slate-800">{r.checkOutTime || '--:--'}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        r.status === 'Late' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        r.status === 'Present' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{r.markedBy || 'Self'}</td>
                    <td className="p-3.5 text-slate-600 truncate max-w-xs">{r.remarks || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WARNINGS & DEACTIVATIONS TAB */}
      {activeTab === 'warnings' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span>Active Attendance Warnings (50% - 74%)</span>
            </div>

            {warningsList.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No employees currently under attendance warning status.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {warningsList.map(u => {
                  const st = employeeStatsMap[u.id];
                  return (
                    <div key={u.id} className="p-4 rounded-xl bg-slate-50 border border-amber-200 flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900">{u.name} ({u.id})</h4>
                        <p className="text-[11px] text-slate-600">{u.department} • {u.email}</p>
                        <span className="inline-block text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                          Warning Notice Issued
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-amber-700 font-mono block">{st?.attendancePct}%</span>
                        <span className="text-[10px] text-slate-500">Req: 75%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <UserX className="h-5 w-5 text-rose-600" />
              <span>Deactivated / Terminated Accounts (&lt;50% Attendance)</span>
            </div>

            {terminatedList.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No accounts deactivated under attendance policy.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {terminatedList.map(u => {
                  const st = employeeStatsMap[u.id];
                  return (
                    <div key={u.id} className="p-4 rounded-xl bg-slate-50 border border-rose-200 flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900">{u.name} ({u.id})</h4>
                        <p className="text-[11px] text-slate-600">Reason: Attendance Below Company Policy</p>
                        <span className="inline-block text-[10px] text-rose-800 font-bold bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                          Login Access Revoked
                        </span>
                      </div>

                      <div className="text-right space-y-2">
                        <span className="text-lg font-black text-rose-700 font-mono block">{st?.attendancePct || 42}%</span>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setTargetReactivateUser(u);
                              setShowReactivateModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-sm cursor-pointer"
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

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && isAdmin && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6 max-w-3xl">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-base font-bold text-slate-900">Attendance Policy Parameters</h3>
            <p className="text-xs text-slate-500 font-medium">Configure global office timings, late entries, working days, and policy threshold percentages.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Office End Time (Reference)</label>
              <input 
                type="time" 
                value={settingsForm.officeEndTime} 
                onChange={(e) => setSettingsForm({ ...settingsForm, officeEndTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center pt-5">
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                ✓ Flexible Entry Enabled (No Office Start Time Restriction)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Required Minimum %</label>
              <input 
                type="number" 
                value={settingsForm.minimumAttendancePct} 
                onChange={(e) => setSettingsForm({ ...settingsForm, minimumAttendancePct: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warning Threshold %</label>
              <input 
                type="number" 
                value={settingsForm.warningPercentage} 
                onChange={(e) => setSettingsForm({ ...settingsForm, warningPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Termination Threshold %</label>
              <input 
                type="number" 
                value={settingsForm.terminationPercentage} 
                onChange={(e) => setSettingsForm({ ...settingsForm, terminationPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer"
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
