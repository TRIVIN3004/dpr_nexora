import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  LayoutDashboard,
  CalendarRange,
  CalendarDays
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
import LeaveApplicationModal from '../components/Attendance/LeaveApplicationModal';
import AdminLeaveReviewModal from '../components/Attendance/AdminLeaveReviewModal';
import LeaveManagementView from '../components/Attendance/LeaveManagementView';

import { getDatabase, getCurrentUser } from '../utils/database';
import { useDatabaseStore } from '../context/DatabaseContext';
import { useTheme } from '../context/ThemeContext';
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
  getTodayString,
  getLeaveApplications,
  applyForLeave,
  updateLeaveApplicationStatus,
  cancelLeaveApplication
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
  const { isLight } = useTheme();
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

  // Leave Applications State
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [showReviewLeaveModal, setShowReviewLeaveModal] = useState(false);
  const [selectedLeaveApp, setSelectedLeaveApp] = useState(null);

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

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    if (typeof msg === 'string') {
      setToast({ message: msg, type, title: type === 'error' ? 'Error' : 'Notification' });
    } else {
      setToast(msg);
    }
    setTimeout(() => setToast(null), 3500);
  };

  const { users: dbUsers, projects: dbProjects, attendance: dbAttendance, invalidateStore } = useDatabaseStore();

  const loadData = async () => {
    const currUser = getCurrentUser();
    setCurrentUser(currUser);

    if (dbUsers && dbUsers.length > 0) setUsers(dbUsers);
    if (dbProjects && dbProjects.length > 0) setProjects(dbProjects);
    
    setLoading(false);

    try {
      const [attRecords, attSettings, leaveApps] = await Promise.all([
        getAttendanceRecords(),
        getAttendanceSettings(),
        getLeaveApplications()
      ]);

      if (attRecords && attRecords.length > 0) {
        setRecords(attRecords);
      } else if (dbAttendance && dbAttendance.length > 0) {
        setRecords(dbAttendance);
      }

      if (attSettings) {
        setSettings(attSettings);
        setSettingsForm(attSettings);
      }

      if (leaveApps) {
        setLeaveApplications(leaveApps);
      }
    } catch (err) {
      console.warn("Attendance load note:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [dbUsers, dbProjects, dbAttendance]);

  const isAdmin = currentUser?.role === 'admin';
  const todayStr = getTodayString();

  const userTodayRecord = records.find(r => r.employeeId === currentUser?.id && r.date === todayStr);

  const staffUsers = useMemo(() => users.filter(u => u.role !== 'admin'), [users]);

  const pendingLeavesCount = useMemo(() => {
    return leaveApplications.filter(l => l.status === 'Pending').length;
  }, [leaveApplications]);

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
  const leaveTodayCount = todayRecords.filter(r => r.status === 'Leave' || r.status === 'Half Day').length;
  const absentTodayCount = Math.max(0, staffUsers.length - presentTodayCount - leaveTodayCount);

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
      if (res.record) {
        setRecords(prev => {
          const idx = prev.findIndex(r => r.id === res.record.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.record;
            return next;
          }
          return [res.record, ...prev];
        });
      }
      invalidateStore('attendance');
      loadData();
    }
    return res;
  };

  const handleUserCheckOut = async () => {
    const res = await markCheckOut(currentUser);
    if (res.success) {
      if (res.record) {
        setRecords(prev => {
          const idx = prev.findIndex(r => r.id === res.record.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.record;
            return next;
          }
          return [res.record, ...prev];
        });
      }
      invalidateStore('attendance');
      loadData();
    }
    return res;
  };

  const handleAdminSaveAttendance = async (attendanceData) => {
    const res = await adminUpdateAttendance(attendanceData, currentUser?.name || 'Admin');
    if (res.success) {
      showToast('Attendance record saved successfully!');
      if (res.record) {
        setRecords(prev => {
          const idx = prev.findIndex(r => r.id === res.record.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.record;
            return next;
          }
          return [res.record, ...prev];
        });
      }
      invalidateStore('attendance');
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

  const handleApplyForLeave = async (leaveData) => {
    const res = await applyForLeave(leaveData);
    if (res.success) {
      showToast('Leave application submitted successfully for review!');
      loadData();
    } else {
      showToast(res.error || 'Failed to submit leave application.', 'error');
    }
    return res;
  };

  const handleReviewLeaveApplication = async (appOrId, quickStatus = null, customRemarks = '') => {
    if (quickStatus && typeof appOrId === 'object') {
      const res = await updateLeaveApplicationStatus(appOrId.id, quickStatus, customRemarks, currentUser);
      if (res.success) {
        showToast(`Leave application marked as ${quickStatus}!`);
        loadData();
      } else {
        showToast('Failed to update leave application.', 'error');
      }
      return;
    }

    if (typeof appOrId === 'object') {
      setSelectedLeaveApp(appOrId);
      setShowReviewLeaveModal(true);
    } else if (typeof appOrId === 'string' && quickStatus) {
      const res = await updateLeaveApplicationStatus(appOrId, quickStatus, customRemarks, currentUser);
      if (res.success) {
        showToast(`Leave application marked as ${quickStatus}!`);
        loadData();
      } else {
        showToast('Failed to update leave application.', 'error');
      }
    }
  };

  const handleCancelLeaveApplication = async (applicationId) => {
    const res = await cancelLeaveApplication(applicationId, currentUser?.id);
    if (res.success) {
      showToast('Leave application cancelled.');
      loadData();
    } else {
      showToast('Failed to cancel leave application.', 'error');
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

  const getTodayCategoryData = (categoryType) => {
    return users.map(u => {
      const r = records.find(rec => rec.employeeId === u.id && rec.date === todayStr);
      let calculatedStatus = 'Absent';
      if (r?.status === 'Present' || r?.status === 'Late') {
        calculatedStatus = 'Present';
      } else if (r?.status === 'Leave' || r?.status === 'Half Day') {
        calculatedStatus = 'Leave';
      } else if (r?.status === 'Absent') {
        calculatedStatus = 'Absent';
      } else {
        calculatedStatus = 'Not Marked (Absent)';
      }

      return {
        user: u,
        record: r,
        status: calculatedStatus
      };
    }).filter(item => {
      if (categoryType === 'present') return item.status === 'Present';
      if (categoryType === 'absent') return item.status === 'Absent' || item.status === 'Not Marked (Absent)';
      if (categoryType === 'leave') return item.status === 'Leave';
      return true;
    });
  };

  const exportTodayPDF = (categoryType) => {
    const list = getTodayCategoryData(categoryType);
    const doc = new jsPDF();
    const categoryTitle = categoryType === 'present' ? 'Present Employees' : categoryType === 'absent' ? 'Absent Employees' : categoryType === 'leave' ? 'On-Leave Employees' : 'Complete Roster';
    
    doc.setFontSize(18);
    doc.text(`Nexora Tech - Today's ${categoryTitle}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Date: ${todayStr} | Total Listed: ${list.length}`, 14, 28);

    const tableColumn = ["Emp ID", "Name", "Department", "Assigned Project", "In Time", "Out Time", "Status"];
    const tableRows = list.map(item => [
      item.user.id,
      item.user.name,
      item.user.department || 'Engineering',
      (item.user.assignedProjects && item.user.assignedProjects[0]) || 'Nexora ERP',
      item.record?.checkInTime || '--:--',
      item.record?.checkOutTime || '--:--',
      item.status
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 34,
      theme: 'grid',
      headStyles: { fillColor: categoryType === 'present' ? [5, 150, 105] : categoryType === 'absent' ? [225, 29, 72] : [79, 70, 229] },
      styles: { fontSize: 8 }
    });

    doc.save(`Today_${categoryTitle}_${todayStr}.pdf`);
    showToast(`Today's ${categoryTitle} PDF downloaded!`);
  };

  const exportTodayExcel = (categoryType) => {
    const list = getTodayCategoryData(categoryType);
    const categoryTitle = categoryType === 'present' ? 'Present' : categoryType === 'absent' ? 'Absent' : categoryType === 'leave' ? 'Leave' : 'All_Summary';

    const exportData = list.map(item => ({
      "Date": todayStr,
      "Employee ID": item.user.id,
      "Employee Name": item.user.name,
      "Department": item.user.department || 'Engineering',
      "Assigned Project": (item.user.assignedProjects && item.user.assignedProjects[0]) || 'Nexora ERP',
      "Check-In Time": item.record?.checkInTime || '--:--',
      "Check-Out Time": item.record?.checkOutTime || '--:--',
      "Attendance Status": item.status,
      "Remarks": item.record?.remarks || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${categoryTitle}_Attendance`);
    XLSX.writeFile(workbook, `Today_${categoryTitle}_Attendance_${todayStr}.xlsx`);
    showToast(`Today's ${categoryTitle} Excel sheet downloaded!`);
  };

  const monthlyChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: [96, 94, 91, avgAttendanceRate],
        borderColor: '#4f46e5',
        backgroundColor: isLight ? 'rgba(79, 70, 229, 0.08)' : 'rgba(79, 70, 229, 0.2)',
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
    <div className="space-y-6 text-left">

      {/* Staff Low Attendance Warning Banner */}
      {!isAdmin && myStats.attendancePct < 75 && myStats.attendancePct >= 50 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Attendance Policy Warning
              </h4>
              <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mt-0.5">
                Your attendance is currently below the company requirement of 75%. Please improve your attendance.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold font-mono">
            {myStats.attendancePct}% Attendance
          </span>
        </motion.div>
      )}

      {/* Header Container */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-[#818cf8] shadow-sm">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Attendance Management
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">
              Workforce monitoring, automated policy checks, leave applications, and attendance analytics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowApplyLeaveModal(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <CalendarRange className="h-4 w-4 text-white" />
            <span>Apply for Leave</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setSelectedRecord(null);
                setShowAdminModal(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] border border-slate-700 dark:border-white/10"
            >
              <Plus className="h-4 w-4 text-white" />
              <span>Mark Manual Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200 dark:border-white/15">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'checkin', label: 'Mark Attendance', icon: Clock },
          { id: 'todays', label: "Today's Attendance", icon: CheckCircle2 },
          { 
            id: 'leaves', 
            label: `Leave Applications${isAdmin && pendingLeavesCount > 0 ? ` (${pendingLeavesCount})` : ''}`, 
            icon: CalendarRange,
            hasBadge: isAdmin && pendingLeavesCount > 0
          },
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap relative ${
                isActive
                  ? 'bg-indigo-600 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 text-white shadow-md border border-indigo-500/50'
                  : 'text-slate-700 dark:text-white/90 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
              {t.hasBadge && (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping absolute top-2 right-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* STAFF / MEMBER PERSONALIZED DASHBOARD VIEW */}
          {!isAdmin ? (
            <div className="space-y-6">
              {/* Member Personal Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AttendanceStatCard 
                  title="My Attendance Percentage"
                  value={`${myStats.attendancePct}%`}
                  subtitle={`Required Company Minimum: 75%`}
                  icon={BarChart3}
                  color={myStats.attendancePct >= 90 ? 'emerald' : myStats.attendancePct >= 75 ? 'blue' : myStats.attendancePct >= 50 ? 'amber' : 'rose'}
                  badge={myStats.indicator.label}
                  trend={{ 
                    label: myStats.attendancePct >= 75 ? 'Compliant' : 'Below 75% Policy', 
                    positive: myStats.attendancePct >= 75 
                  }}
                />
                <AttendanceStatCard 
                  title="Present Days"
                  value={`${myStats.presentDays} Days`}
                  subtitle="Flexible entry check-ins logged"
                  icon={UserCheck}
                  color="emerald"
                />
                <AttendanceStatCard 
                  title="Absent Days"
                  value={`${myStats.absentDays} Days`}
                  subtitle="Unattended working days"
                  icon={XCircle}
                  color="rose"
                />
                <AttendanceStatCard 
                  title="Total Working Days"
                  value={`${myStats.totalWorkingDays} Days`}
                  subtitle={`Approved Leaves: ${myStats.leaveDays}`}
                  icon={CalendarCheck}
                  color="purple"
                />
              </div>

              {/* Personal Policy Breakdown Progress Banner */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      My Attendance Policy Standing
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                      Nexora Technologies Employee Policy Compliance Tracker
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Employment Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                      myStats.attendancePct >= 75 
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40' 
                        : myStats.attendancePct >= 50 
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40' 
                        : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40'
                    }`}>
                      {myStats.attendancePct >= 75 ? 'Active (Good Standing)' : myStats.attendancePct >= 50 ? 'Warning Notice' : 'Terminated'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span>My Attendance: <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{myStats.attendancePct}%</strong></span>
                    <span>Company Requirement: <strong className="text-emerald-700 dark:text-emerald-400">75%</strong></span>
                  </div>
                  <div className="relative w-full h-4 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-rose-500 z-10" title="75% Requirement Threshold" />
                    
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, myStats.attendancePct)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        myStats.attendancePct >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                        myStats.attendancePct >= 75 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                        myStats.attendancePct >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                        'bg-gradient-to-r from-rose-500 to-red-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Detailed Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/40">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Present Days</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{myStats.presentDays}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/40">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Absent Days</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{myStats.absentDays}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/40">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Approved Leaves</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{myStats.leaveDays}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/40">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Total Working Days</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{myStats.totalWorkingDays}</span>
                  </div>
                </div>

                {/* Quick Leave Application Action Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
                      <CalendarRange className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        Planning Time Off?
                      </h4>
                      <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        Submit a leave application with Start & End dates for quick administrative approval.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowApplyLeaveModal(true)}
                    className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Apply for Leave</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ADMIN WORKFORCE OVERVIEW DASHBOARD VIEW */
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
                  title="Absent Today"
                  value={absentTodayCount}
                  subtitle={`Out of ${staffUsers.length} active staff`}
                  icon={XCircle}
                  color="rose"
                />
                <AttendanceStatCard 
                  title="Policy Warnings / Terms"
                  value={`${warningsList.length} / ${terminatedList.length}`}
                  subtitle="Requires Admin Review"
                  icon={AlertTriangle}
                  color="amber"
                />
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-3">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Attendance Policy Tiers & Status Indicators
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 text-center">
                    <span className="text-xs font-black text-cyan-700 dark:text-cyan-300 block">95%+</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">Excellent</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 block">90% - 94%</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">Very Good</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-center">
                    <span className="text-xs font-black text-blue-700 dark:text-blue-300 block">75% - 89%</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">Good</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-center">
                    <span className="text-xs font-black text-amber-700 dark:text-amber-300 block">50% - 74%</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">Warning</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-center">
                    <span className="text-xs font-black text-rose-700 dark:text-rose-300 block">&lt; 50%</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">Terminated</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts Visualizations Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {isAdmin ? 'Monthly Attendance Trend' : 'My Monthly Attendance Trend'}
              </h4>
              <div className="h-64">
                <Line 
                  data={monthlyChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { 
                        min: 40, 
                        max: 100, 
                        ticks: { color: isLight ? '#475569' : '#cbd5e1' },
                        grid: { color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' } 
                      },
                      x: { 
                        ticks: { color: isLight ? '#475569' : '#cbd5e1' },
                        grid: { color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' } 
                      }
                    }
                  }} 
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Department Distribution
              </h4>
              <div className="h-64 flex items-center justify-center">
                <Doughnut 
                  data={departmentChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { 
                        position: 'bottom', 
                        labels: { 
                          color: isLight ? '#334155' : '#ffffff', 
                          font: { size: 10, weight: 'bold' } 
                        } 
                      } 
                    }
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
          <div className="flex items-center justify-center gap-3 p-1.5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl max-w-md mx-auto shadow-sm">
            <button
              onClick={() => setCheckInMethod('daily')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                checkInMethod === 'daily' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Check-In / Out</span>
            </button>

            <button
              onClick={() => setCheckInMethod('qr')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                checkInMethod === 'qr' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>QR Code</span>
            </button>

            <button
              onClick={() => setCheckInMethod('face')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                checkInMethod === 'face' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10'
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
          
          {/* Today's Category Export Toolbar */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Live Workforce Roster - {todayStr}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 mt-0.5">
                Export today's attendance lists separately by Present, Absent, or Leave status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Present Export */}
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-300 px-1.5">Present ({presentTodayCount})</span>
                <button
                  onClick={() => exportTodayPDF('present')}
                  title="Download Present List PDF"
                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <FileText className="h-3 w-3 text-white" /> PDF
                </button>
                <button
                  onClick={() => exportTodayExcel('present')}
                  title="Download Present List Excel"
                  className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="h-3 w-3 text-white" /> Excel
                </button>
              </div>

              {/* Absent Export */}
              <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-xl border border-rose-200 dark:border-rose-800/60">
                <span className="text-[11px] font-extrabold text-rose-900 dark:text-rose-300 px-1.5">Absent ({absentTodayCount})</span>
                <button
                  onClick={() => exportTodayPDF('absent')}
                  title="Download Absent List PDF"
                  className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <FileText className="h-3 w-3 text-white" /> PDF
                </button>
                <button
                  onClick={() => exportTodayExcel('absent')}
                  title="Download Absent List Excel"
                  className="px-2 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="h-3 w-3 text-white" /> Excel
                </button>
              </div>

              {/* Leave Export */}
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-xl border border-amber-200 dark:border-amber-800/60">
                <span className="text-[11px] font-extrabold text-amber-900 dark:text-amber-300 px-1.5">
                  Leave ({records.filter(r => r.date === todayStr && (r.status === 'Leave' || r.status === 'Half Day')).length})
                </span>
                <button
                  onClick={() => exportTodayPDF('leave')}
                  title="Download Leave List PDF"
                  className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <FileText className="h-3 w-3 text-white" /> PDF
                </button>
                <button
                  onClick={() => exportTodayExcel('leave')}
                  title="Download Leave List Excel"
                  className="px-2 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="h-3 w-3 text-white" /> Excel
                </button>
              </div>

              {/* Full Summary Export */}
              <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 p-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60">
                <span className="text-[11px] font-extrabold text-indigo-900 dark:text-indigo-300 px-1.5">All Summary</span>
                <button
                  onClick={() => exportTodayPDF('all')}
                  title="Download Complete Today Attendance PDF"
                  className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <FileText className="h-3 w-3 text-white" /> PDF
                </button>
                <button
                  onClick={() => exportTodayExcel('all')}
                  title="Download Complete Today Attendance Excel"
                  className="px-2 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="h-3 w-3 text-white" /> Excel
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0b0f19] shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-white border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="p-3.5 font-extrabold uppercase">Employee</th>
                  <th className="p-3.5 font-extrabold uppercase">Department</th>
                  <th className="p-3.5 font-extrabold uppercase">Assigned Project</th>
                  <th className="p-3.5 font-extrabold uppercase">Check-In</th>
                  <th className="p-3.5 font-extrabold uppercase">Check-Out</th>
                  <th className="p-3.5 font-extrabold uppercase">Status</th>
                  <th className="p-3.5 font-extrabold uppercase">Remarks</th>
                  {isAdmin && <th className="p-3.5 text-right font-extrabold uppercase">Admin Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {users.map((u) => {
                  const r = records.find(rec => rec.employeeId === u.id && rec.date === todayStr);
                  const isPresent = r?.status === 'Present';
                  const isLate = r?.status === 'Late';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3.5 flex items-center gap-3">
                        <img 
                          src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                          alt={u.name} 
                          className="h-8 w-8 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                        />
                        <div>
                          <span className="font-extrabold text-sm block text-slate-900 dark:text-white">{u.name}</span>
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">{u.id}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{u.department || 'Engineering'}</td>
                      <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{(u.assignedProjects && u.assignedProjects[0]) || 'Nexora ERP'}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">{r?.checkInTime || '--:--'}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">{r?.checkOutTime || '--:--'}</td>
                      <td className="p-3.5">
                        {isPresent ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40">
                            Present
                          </span>
                        ) : isLate ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40">
                            Present (Late)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700">
                            Not Marked
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-medium truncate max-w-xs text-slate-600 dark:text-slate-400">{r?.remarks || 'N/A'}</td>
                      {isAdmin && (
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedRecord(r || { employeeId: u.id, employeeName: u.name, date: todayStr, status: 'Present' });
                              setShowAdminModal(true);
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-extrabold cursor-pointer shadow-xs transition-colors"
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

      {/* LEAVE APPLICATIONS TAB */}
      {activeTab === 'leaves' && (
        <LeaveManagementView 
          currentUser={currentUser}
          users={users}
          leaveApplications={leaveApplications}
          onOpenApplyModal={() => setShowApplyLeaveModal(true)}
          onReviewApplication={handleReviewLeaveApplication}
          onCancelApplication={handleCancelLeaveApplication}
          showToast={showToast}
        />
      )}

      {/* ATTENDANCE CALENDAR TAB */}
      {activeTab === 'calendar' && (() => {
        const calYear = calendarDate.getFullYear();
        const calMonth = calendarDate.getMonth();
        const calFirstDayIndex = new Date(calYear, calMonth, 1).getDay();
        const calTotalDays = new Date(calYear, calMonth + 1, 0).getDate();
        const calPrevMonthTotalDays = new Date(calYear, calMonth, 0).getDate();

        const formatYMD = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        const calDays = [];
        // Previous month padding
        for (let i = calFirstDayIndex - 1; i >= 0; i--) {
          const pDay = calPrevMonthTotalDays - i;
          const pDate = new Date(calYear, calMonth - 1, pDay);
          calDays.push({
            day: pDay,
            isCurrentMonth: false,
            dateKey: formatYMD(pDate.getFullYear(), pDate.getMonth(), pDate.getDate())
          });
        }
        // Current month days
        for (let i = 1; i <= calTotalDays; i++) {
          calDays.push({
            day: i,
            isCurrentMonth: true,
            dateKey: formatYMD(calYear, calMonth, i)
          });
        }
        // Next month padding to fill complete grid
        const calTargetTotal = calDays.length > 35 ? 42 : 35;
        const calRemaining = calTargetTotal - calDays.length;
        for (let i = 1; i <= calRemaining; i++) {
          const nDate = new Date(calYear, calMonth + 1, i);
          calDays.push({
            day: i,
            isCurrentMonth: false,
            dateKey: formatYMD(nDate.getFullYear(), nDate.getMonth(), nDate.getDate())
          });
        }

        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Interactive Attendance Calendar - {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300">
                  Employee: {currentUser?.name} ({currentUser?.id}) • Today: {todayStr}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCalendarDate(new Date())}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-600/50 border border-indigo-200 dark:border-indigo-500/40 transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button 
                  onClick={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="p-2 rounded-xl transition-colors cursor-pointer shadow-xs bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/15 hover:bg-slate-200 dark:hover:bg-white/20"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="p-2 rounded-xl transition-colors cursor-pointer shadow-xs bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/15 hover:bg-slate-200 dark:hover:bg-white/20"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-slate-700 dark:text-slate-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calDays.map((cell, i) => {
                const isToday = cell.dateKey === todayStr;
                const rec = records.find(r => r.employeeId === currentUser?.id && r.date === cell.dateKey);

                return (
                  <div 
                    key={i}
                    className={`h-24 p-2.5 rounded-2xl flex flex-col justify-between transition-all shadow-xs border ${
                      isToday 
                        ? 'ring-2 ring-emerald-500 ring-offset-1 bg-emerald-50 dark:bg-emerald-500/20 border-emerald-400' 
                        : !cell.isCurrentMonth
                          ? 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 opacity-40'
                          : rec?.status === 'Present'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                            : rec?.status === 'Late'
                              ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
                              : rec?.status === 'Leave' || rec?.status === 'Half Day'
                                ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30'
                                : rec?.status === 'Absent'
                                  ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                                  : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${
                        isToday 
                          ? 'text-emerald-700 dark:text-emerald-300' 
                          : cell.isCurrentMonth 
                            ? 'text-slate-900 dark:text-white' 
                            : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {cell.day}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-tight">
                          Today
                        </span>
                      )}
                    </div>
                    {rec ? (
                      <div className="text-[10px] font-extrabold truncate">
                        <span className={
                          rec.status === 'Present' 
                            ? 'text-emerald-700 dark:text-emerald-300' 
                            : rec.status === 'Late' 
                              ? 'text-amber-700 dark:text-amber-300' 
                              : rec.status === 'Leave' || rec.status === 'Half Day'
                                ? 'text-purple-700 dark:text-purple-300 font-black'
                                : 'text-rose-700 dark:text-rose-300'
                        }>
                          {rec.status}
                        </span>
                        <span className="block font-mono text-[9px] text-slate-500 dark:text-slate-400">
                          {rec.status === 'Leave' ? 'Approved Leave' : (rec.checkInTime || '--:--')}
                        </span>
                      </div>
                    ) : cell.isCurrentMonth ? (
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">--</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* REPORTS & HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search Employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-extrabold"
                />
              </div>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none font-extrabold cursor-pointer"
              >
                {departmentsList.map(d => (
                  <option key={d} value={d}>
                    Dept: {d}
                  </option>
                ))}
              </select>

              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none font-extrabold cursor-pointer"
              >
                {projectsListOptions.map(p => (
                  <option key={p} value={p}>
                    Project: {p}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none font-extrabold cursor-pointer"
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
                className="py-2 px-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={exportExcel}
                className="py-2 px-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0b0f19] shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-white border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="p-3.5 font-extrabold uppercase">Date</th>
                  <th className="p-3.5 font-extrabold uppercase">Employee</th>
                  <th className="p-3.5 font-extrabold uppercase">Department</th>
                  <th className="p-3.5 font-extrabold uppercase">Project</th>
                  <th className="p-3.5 font-extrabold uppercase">Check-In</th>
                  <th className="p-3.5 font-extrabold uppercase">Check-Out</th>
                  <th className="p-3.5 font-extrabold uppercase">Status</th>
                  <th className="p-3.5 font-extrabold uppercase">Method</th>
                  <th className="p-3.5 font-extrabold uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {filteredHistory.slice(0, 50).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">{r.date}</td>
                    <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">{r.employeeName} ({r.employeeId})</td>
                    <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{r.department || 'N/A'}</td>
                    <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{r.project || 'N/A'}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">{r.checkInTime || '--:--'}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">{r.checkOutTime || '--:--'}</td>
                    <td className="p-3.5">
                      {r.status === 'Present' || r.status === 'Late' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40">
                          Present
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40">
                          {r.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-medium text-slate-600 dark:text-slate-400">{r.markedBy || 'Self'}</td>
                    <td className="p-3.5 font-medium truncate max-w-xs text-slate-600 dark:text-slate-400">{r.remarks || 'N/A'}</td>
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
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span>Active Attendance Warnings (50% - 74%)</span>
            </div>

            {warningsList.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">No employees currently under attendance warning status.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {warningsList.map(u => {
                  const st = employeeStatsMap[u.id];
                  return (
                    <div key={u.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{u.name} ({u.id})</h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">{u.department} • {u.email}</p>
                        <span className="inline-block text-[10px] text-amber-800 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                          Warning Notice Issued
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono block">{st?.attendancePct}%</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Req: 75%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
              <UserX className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              <span>Deactivated / Terminated Accounts (&lt;50% Attendance)</span>
            </div>

            {terminatedList.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">No accounts deactivated under attendance policy.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {terminatedList.map(u => {
                  const st = employeeStatsMap[u.id];
                  return (
                    <div key={u.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{u.name} ({u.id})</h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">Reason: Attendance Below Company Policy</p>
                        <span className="inline-block text-[10px] text-rose-800 dark:text-rose-300 font-bold bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/60">
                          Login Access Revoked
                        </span>
                      </div>

                      <div className="text-right space-y-2">
                        <span className="text-lg font-black text-rose-700 dark:text-rose-400 font-mono block">{st?.attendancePct || 42}%</span>
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
        <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-6 max-w-3xl">
          <div className="border-b border-slate-100 dark:border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Attendance Policy Parameters</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">Configure global office timings, late entries, working days, and policy threshold percentages.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold mb-1 text-slate-700 dark:text-slate-200">Office End Time (Reference)</label>
              <input 
                type="time" 
                value={settingsForm.officeEndTime} 
                onChange={(e) => setSettingsForm({ ...settingsForm, officeEndTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-extrabold"
              />
            </div>
            <div className="flex items-center pt-5">
              <span className="text-xs font-extrabold px-3 py-2 rounded-xl border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60">
                ✓ Flexible Entry Enabled (No Office Start Time Restriction)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold mb-1 text-slate-700 dark:text-slate-200">Required Minimum %</label>
              <input 
                type="number" 
                value={settingsForm.minimumAttendancePct} 
                onChange={(e) => setSettingsForm({ ...settingsForm, minimumAttendancePct: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-extrabold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold mb-1 text-slate-700 dark:text-slate-200">Warning Threshold %</label>
              <input 
                type="number" 
                value={settingsForm.warningPercentage} 
                onChange={(e) => setSettingsForm({ ...settingsForm, warningPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-extrabold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold mb-1 text-slate-700 dark:text-slate-200">Termination Threshold %</label>
              <input 
                type="number" 
                value={settingsForm.terminationPercentage} 
                onChange={(e) => setSettingsForm({ ...settingsForm, terminationPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-extrabold"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex justify-end">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-sm cursor-pointer transition-colors"
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

      {/* Leave Application Modal */}
      <LeaveApplicationModal 
        isOpen={showApplyLeaveModal}
        onClose={() => setShowApplyLeaveModal(false)}
        currentUser={currentUser}
        users={users}
        onSubmit={handleApplyForLeave}
      />

      {/* Admin Leave Review Modal */}
      <AdminLeaveReviewModal 
        isOpen={showReviewLeaveModal}
        onClose={() => {
          setShowReviewLeaveModal(false);
          setSelectedLeaveApp(null);
        }}
        application={selectedLeaveApp}
        onReview={handleReviewLeaveApplication}
      />

      {/* Centered Global Attendance Notification Modal via Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {toast && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 15 }}
                transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border-2 flex flex-col items-center text-center space-y-4 relative my-auto ${
                  toast.type === 'error' ? 'border-rose-400' : 'border-emerald-500'
                }`}
              >
                <button
                  onClick={() => setToast(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                </button>

                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                  toast.type === 'error' ? 'bg-rose-100 text-rose-600 border border-rose-300' : 'bg-emerald-100 text-emerald-600 border border-emerald-300 shadow-md shadow-emerald-100'
                }`}>
                  {toast.type === 'error' ? (
                    <AlertTriangle className="h-8 w-8 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{toast.title || 'Notification'}</h3>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{toast.message}</p>
                </div>

                <button
                  onClick={() => setToast(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-sm cursor-pointer"
                >
                  Done
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
