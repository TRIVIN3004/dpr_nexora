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
import { exportTodayAttendancePDF, exportAttendanceHistoryPDF } from '../utils/pdfExportTemplates';
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
  cancelLeaveApplication,
  autoMarkEveningAbsences
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

  // Filters for Workforce Attendance Rates Leaderboard (Admin)
  const [rateSearchTerm, setRateSearchTerm] = useState('');
  const [rateFilterDept, setRateFilterDept] = useState('All');
  const [rateSortBy, setRateSortBy] = useState('lowest'); // 'lowest', 'highest', 'name'

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

      // Automated 7:00 PM cutoff evaluation
      const currentUsers = (dbUsers && dbUsers.length > 0) ? dbUsers : users;
      const currentRecords = (attRecords && attRecords.length > 0) ? attRecords : (dbAttendance || []);
      if (currentUsers.length > 0) {
        const cutoffRes = await autoMarkEveningAbsences(currentUsers, currentRecords);
        if (cutoffRes.processed && cutoffRes.newRecords?.length > 0) {
          setRecords(prev => {
            const next = [...prev];
            cutoffRes.newRecords.forEach(nr => {
              const idx = next.findIndex(r => r.id === nr.id);
              if (idx >= 0) next[idx] = nr;
              else next.unshift(nr);
            });
            return next;
          });
          invalidateStore('attendance');
        }
      }
    } catch (err) {
      console.warn("Attendance load note:", err);
    }
  };

  useEffect(() => {
    loadData();

    // Background 1-minute ticker for 7:00 PM daily cutoff
    const ticker = setInterval(() => {
      const now = new Date();
      if (now.getHours() >= 19 && now.getDay() !== 0) {
        autoMarkEveningAbsences(users, records).then(res => {
          if (res.processed && res.newRecords?.length > 0) {
            setRecords(prev => {
              const next = [...prev];
              res.newRecords.forEach(nr => {
                const idx = next.findIndex(r => r.id === nr.id);
                if (idx >= 0) next[idx] = nr;
                else next.unshift(nr);
              });
              return next;
            });
            invalidateStore('attendance');
          }
        });
      }
    }, 60000);

    return () => clearInterval(ticker);
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

  const staffAttendanceRankings = useMemo(() => {
    return staffUsers.map(u => {
      const stats = employeeStatsMap[u.id] || calculateEmployeeStats(u.id, records, settings);
      return {
        user: u,
        stats
      };
    }).filter(item => {
      const matchSearch = item.user.name.toLowerCase().includes(rateSearchTerm.toLowerCase()) ||
                          item.user.id.toLowerCase().includes(rateSearchTerm.toLowerCase()) ||
                          (item.user.email && item.user.email.toLowerCase().includes(rateSearchTerm.toLowerCase()));
      const matchDept = rateFilterDept === 'All' || item.user.department === rateFilterDept;
      return matchSearch && matchDept;
    }).sort((a, b) => {
      if (rateSortBy === 'lowest') return a.stats.attendancePct - b.stats.attendancePct;
      if (rateSortBy === 'highest') return b.stats.attendancePct - a.stats.attendancePct;
      return a.user.name.localeCompare(b.user.name);
    });
  }, [staffUsers, employeeStatsMap, records, settings, rateSearchTerm, rateFilterDept, rateSortBy]);

  const isTodaySunday = new Date(todayStr + 'T00:00:00').getDay() === 0;
  const isPast7PM = new Date().getHours() >= 19;
  const todayRecords = records.filter(r => r.date === todayStr);
  const presentTodayCount = todayRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const lateTodayCount = todayRecords.filter(r => r.status === 'Late').length;
  const leaveTodayCount = todayRecords.filter(r => r.status === 'Leave' || r.status === 'Half Day').length;
  const absentTodayCount = isTodaySunday ? 0 : Math.max(0, staffUsers.length - presentTodayCount - leaveTodayCount);

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
    try {
      const filterSummary = `Dept: ${filterDept} | Project: ${filterProject} | Status: ${filterStatus}`;
      exportAttendanceHistoryPDF({
        records: filteredHistory,
        todayStr: getTodayString(),
        filterSummary
      });
      showToast('Attendance History PDF downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast('Error generating PDF export');
    }
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
      let calculatedStatus = isTodaySunday ? 'Sunday (Holiday)' : (isPast7PM ? 'Absent' : 'Pending Check-In');
      if (r?.status === 'Present' || r?.status === 'Late') {
        calculatedStatus = 'Present';
      } else if (r?.status === 'Leave' || r?.status === 'Half Day') {
        calculatedStatus = 'Leave';
      } else if (r?.status === 'Absent') {
        calculatedStatus = isTodaySunday ? 'Sunday (Holiday)' : 'Absent';
      } else if (isPast7PM && !isTodaySunday) {
        calculatedStatus = 'Absent';
      }

      return {
        user: u,
        record: r,
        status: calculatedStatus,
        attendancePct: employeeStatsMap[u.id]?.attendancePct ?? 100
      };
    }).filter(item => {
      if (categoryType === 'present') return item.status === 'Present';
      if (categoryType === 'absent') return !isTodaySunday && (item.status === 'Absent' || (isPast7PM && item.status.includes('Absent')));
      if (categoryType === 'leave') return item.status === 'Leave';
      return true;
    });
  };

  const exportTodayPDF = (categoryType) => {
    try {
      const list = getTodayCategoryData(categoryType);
      exportTodayAttendancePDF({
        list,
        categoryType,
        todayStr,
        staffTotal: staffUsers.length,
        isSunday: isTodaySunday
      });
      showToast("Today's Attendance PDF generated successfully!");
    } catch (err) {
      console.error('Error generating Today Attendance PDF:', err);
      showToast('Error generating PDF export');
    }
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
      "Attendance Rate (%)": `${item.attendancePct ?? 100}%`,
      "Remarks": item.record?.remarks || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${categoryTitle}_Attendance`);
    XLSX.writeFile(workbook, `Today_${categoryTitle}_Attendance_${todayStr}.xlsx`);
    showToast(`Today's ${categoryTitle} Excel sheet downloaded!`);
  };

  const exportRankingsExcel = () => {
    const exportData = staffAttendanceRankings.map(({ user: u, stats }) => ({
      "Employee ID": u.id,
      "Employee Name": u.name,
      "Department": u.department || 'N/A',
      "Role": u.role || 'Staff',
      "Working Days": stats.totalWorkingDays,
      "Present Days": stats.presentDays,
      "Late Days": stats.lateDays,
      "Absent Days": stats.absentDays,
      "Leave Days": stats.leaveDays,
      "Attendance Rate (%)": `${stats.attendancePct}%`,
      "Policy Standing": stats.indicator?.label || (stats.attendancePct >= 75 ? 'Good Standing' : 'At Risk')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Workforce_Percentages");
    XLSX.writeFile(workbook, `Workforce_Attendance_Rates_${todayStr}.xlsx`);
    showToast("Workforce attendance percentages exported successfully!");
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
                  title={isTodaySunday ? "Weekly Holiday" : "Absent Today"}
                  value={isTodaySunday ? "Sunday" : absentTodayCount}
                  subtitle={isTodaySunday ? "All staff off (Weekly holiday)" : `Out of ${staffUsers.length} active staff`}
                  icon={isTodaySunday ? CalendarDays : XCircle}
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

          {/* Workforce Attendance Percentages & Compliance Roster (Admin) */}
          {isAdmin && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <BarChart3 className="h-5 w-5" />
                    </span>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      Workforce Attendance Percentages & Compliance Roster
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Live cumulative attendance rates, working days breakdown, and policy tier standing for all staff members.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200">
                    Staff: <strong className="font-black text-slate-900 dark:text-white">{staffUsers.length}</strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
                    Compliant (≥75%): <strong className="font-black">{staffUsers.filter(u => (employeeStatsMap[u.id]?.attendancePct ?? 100) >= 75).length}</strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300">
                    Warning (&lt;75%): <strong className="font-black">{staffUsers.filter(u => (employeeStatsMap[u.id]?.attendancePct ?? 100) < 75 && (employeeStatsMap[u.id]?.attendancePct ?? 100) >= 50).length}</strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300">
                    Critical (&lt;50%): <strong className="font-black">{staffUsers.filter(u => (employeeStatsMap[u.id]?.attendancePct ?? 100) < 50).length}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={exportRankingsExcel}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-5 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={rateSearchTerm}
                    onChange={(e) => setRateSearchTerm(e.target.value)}
                    placeholder="Search staff by name, ID or email..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={rateFilterDept}
                    onChange={(e) => setRateFilterDept(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {departmentsList.map(dept => (
                      <option key={dept} value={dept} className="text-slate-900 dark:text-slate-900">
                        {dept === 'All' ? 'All Departments' : dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4 flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                  <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 px-2 shrink-0">
                    Sort:
                  </span>
                  <button
                    type="button"
                    onClick={() => setRateSortBy('lowest')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-colors cursor-pointer ${
                      rateSortBy === 'lowest'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                    title="Show lowest percentage first (prioritize at-risk staff)"
                  >
                    Lowest %
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateSortBy('highest')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-colors cursor-pointer ${
                      rateSortBy === 'highest'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                    title="Show highest percentage first"
                  >
                    Highest %
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateSortBy('name')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-colors cursor-pointer ${
                      rateSortBy === 'name'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                    title="Sort alphabetically by name"
                  >
                    Name
                  </button>
                </div>
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[11px] text-slate-600 dark:text-slate-400">
                      <th className="p-3.5 font-extrabold uppercase">Staff Member</th>
                      <th className="p-3.5 font-extrabold uppercase">Department / Role</th>
                      <th className="p-3.5 font-extrabold uppercase text-center">Working Days</th>
                      <th className="p-3.5 font-extrabold uppercase text-center">Present (Late)</th>
                      <th className="p-3.5 font-extrabold uppercase text-center">Absent</th>
                      <th className="p-3.5 font-extrabold uppercase text-center">Leaves</th>
                      <th className="p-3.5 font-extrabold uppercase min-w-[190px]">Attendance Rate %</th>
                      <th className="p-3.5 font-extrabold uppercase">Policy Status</th>
                      <th className="p-3.5 font-extrabold uppercase text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {staffAttendanceRankings.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-600 dark:text-slate-400 font-semibold">
                          No staff found matching the selected search or filters.
                        </td>
                      </tr>
                    ) : (
                      staffAttendanceRankings.map(({ user: u, stats }) => {
                        const pct = stats.attendancePct ?? 100;
                        const isWarning = pct < 75 && pct >= 50;
                        const isCritical = pct < 50;
                        const isGreat = pct >= 90;

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                                  {u.avatar ? (
                                    <img src={u.avatar} alt={u.name} className="h-full w-full rounded-full object-cover" />
                                  ) : (
                                    u.name?.charAt(0) || 'U'
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-extrabold text-slate-900 dark:text-white block truncate">
                                    {u.name}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block truncate">
                                    {u.id} {u.email ? `• ${u.email}` : ''}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                {u.department || 'General'}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                                {u.role || 'Staff'}
                              </span>
                            </td>

                            <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                              {stats.totalWorkingDays}
                            </td>

                            <td className="p-3.5 text-center">
                              <span className="font-black text-emerald-600 dark:text-emerald-400">
                                {stats.presentDays}
                              </span>
                              {stats.lateDays > 0 && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1">
                                  ({stats.lateDays} late)
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 text-center">
                              <span className={`font-black ${stats.absentDays > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                {stats.absentDays}
                              </span>
                            </td>

                            <td className="p-3.5 text-center font-bold text-blue-600 dark:text-blue-400">
                              {stats.leaveDays}
                            </td>

                            <td className="p-3.5">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className={`font-black font-mono text-sm ${
                                    isGreat ? 'text-emerald-600 dark:text-emerald-400' :
                                    pct >= 75 ? 'text-blue-600 dark:text-blue-400' :
                                    isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {pct}%
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    {stats.presentDays}/{stats.totalWorkingDays || 1} days
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isGreat ? 'bg-emerald-500' :
                                      pct >= 75 ? 'bg-blue-500' :
                                      isWarning ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(100, pct)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                                isGreat
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                                  : pct >= 75
                                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                  : isWarning
                                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  isGreat ? 'bg-emerald-500' : pct >= 75 ? 'bg-blue-500' : isWarning ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'
                                }`} />
                                {stats.indicator?.label || (pct >= 75 ? 'Good Standing' : 'At Risk')}
                              </span>
                            </td>

                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchTerm(u.name);
                                    setActiveTab('history');
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-[11px] font-bold cursor-pointer transition-colors"
                                  title="View employee attendance logs"
                                >
                                  Logs
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const todayRec = records.find(r => r.employeeId === u.id && r.date === todayStr);
                                    setSelectedRecord(todayRec || { employeeId: u.id, employeeName: u.name, date: todayStr, status: 'Present' });
                                    setShowAdminModal(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black cursor-pointer shadow-xs transition-colors"
                                  title="Edit or override attendance"
                                >
                                  Manage
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                <span className="text-[11px] font-extrabold text-rose-900 dark:text-rose-300 px-1.5">
                  {isTodaySunday ? 'Sunday Holiday (0 Absent)' : `Absent (${absentTodayCount})`}
                </span>
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
                  <th className="p-3.5 font-extrabold uppercase min-w-[150px]">Attendance %</th>
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
                        ) : r?.status === 'Leave' || r?.status === 'Half Day' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/40">
                            {r.status === 'Half Day' ? 'Half Day' : 'On Leave'}
                          </span>
                        ) : r?.status === 'Absent' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40">
                            Absent (7 PM Cutoff)
                          </span>
                        ) : isTodaySunday ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800">
                            Sunday (Holiday)
                          </span>
                        ) : isPast7PM ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40">
                            Absent (7 PM Cutoff)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700">
                            Pending Check-In
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden shrink-0">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                (employeeStatsMap[u.id]?.attendancePct || 0) >= 90 ? 'bg-emerald-500' :
                                (employeeStatsMap[u.id]?.attendancePct || 0) >= 75 ? 'bg-blue-500' :
                                (employeeStatsMap[u.id]?.attendancePct || 0) >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, employeeStatsMap[u.id]?.attendancePct || 0)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-black font-mono ${
                            (employeeStatsMap[u.id]?.attendancePct || 0) >= 90 ? 'text-emerald-700 dark:text-emerald-300' :
                            (employeeStatsMap[u.id]?.attendancePct || 0) >= 75 ? 'text-blue-700 dark:text-blue-300' :
                            (employeeStatsMap[u.id]?.attendancePct || 0) >= 50 ? 'text-amber-700 dark:text-amber-300' : 'text-rose-700 dark:text-rose-300'
                          }`}>
                            {employeeStatsMap[u.id]?.attendancePct ?? 100}%
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mt-0.5">
                          {employeeStatsMap[u.id]?.indicator?.label || 'Good'}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium truncate max-w-xs text-slate-600 dark:text-slate-400">
                        {r?.remarks || (isPast7PM && !isTodaySunday ? 'Auto-Marked Absent (7:00 PM cutoff)' : 'N/A')}
                      </td>
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
                <div 
                  key={day} 
                  className={`p-2 rounded-xl border ${
                    day === 'Sun'
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs'
                      : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5'
                  }`}
                >
                  {day} {day === 'Sun' && <span className="block text-[9px] font-extrabold text-rose-500 tracking-tight">Holiday</span>}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calDays.map((cell, i) => {
                const isToday = cell.dateKey === todayStr;
                const rec = records.find(r => r.employeeId === currentUser?.id && r.date === cell.dateKey);
                const isSunday = new Date(cell.dateKey + 'T00:00:00').getDay() === 0;

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
                                  : isSunday
                                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40 text-rose-800 dark:text-rose-200'
                                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${
                        isToday 
                          ? 'text-emerald-700 dark:text-emerald-300' 
                          : isSunday && cell.isCurrentMonth
                            ? 'text-rose-600 dark:text-rose-400'
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
                          {rec.status}{isSunday ? ' (Holiday)' : ''}
                        </span>
                        <span className="block font-mono text-[9px] text-slate-500 dark:text-slate-400">
                          {rec.status === 'Leave' ? 'Approved Leave' : (rec.checkInTime || '--:--')}
                        </span>
                      </div>
                    ) : isSunday && cell.isCurrentMonth ? (
                      <div className="text-[10px] font-extrabold truncate">
                        <span className="text-rose-600 dark:text-rose-400 font-black flex items-center gap-1">
                          Holiday
                        </span>
                        <span className="block font-mono text-[9px] text-rose-500/80 dark:text-rose-400/70">
                          Sunday Off
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
                  <th className="p-3.5 font-extrabold uppercase">Attendance %</th>
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
                    <td className="p-3.5">
                      <span className={`font-mono font-black text-xs ${
                        (employeeStatsMap[r.employeeId]?.attendancePct ?? 100) >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                        (employeeStatsMap[r.employeeId]?.attendancePct ?? 100) >= 75 ? 'text-blue-600 dark:text-blue-400' :
                        (employeeStatsMap[r.employeeId]?.attendancePct ?? 100) >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {employeeStatsMap[r.employeeId]?.attendancePct ?? 100}%
                      </span>
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
