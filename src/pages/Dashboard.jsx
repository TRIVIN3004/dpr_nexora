import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Layers, 
  CheckSquare, 
  Clock, 
  Clock3, 
  Send, 
  TrendingUp, 
  Check, 
  X,
  Eye,
  Megaphone,
  BellRing,
  Mail,
  Inbox,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  AtSign,
  RefreshCw,
  ExternalLink,
  Sparkles,
  UserX,
  UserCheck,
  Copy
} from 'lucide-react';
import StatCard from '../components/StatCard';
import ReportModal from '../components/ReportModal';
import ProjectsModal from '../components/ProjectsModal';
import EmailPreviewModal from '../components/EmailPreviewModal';
import { 
  getDatabase, 
  getCurrentUser, 
  postAnnouncement, 
  reviewReportStatus 
} from '../utils/database';
import { 
  getPersonalEmail, 
  sendEmailAlert, 
  getResendConfig, 
  getEmailAlertLogs, 
  generateAttendanceAbsentEmail, 
  generateAttendanceWarningEmail, 
  generateAttendanceTerminationEmail,
  generateManualBroadcastEmail,
  generateTestEmail,
  generateDprAutomationAnnouncementEmail
} from '../utils/emailService';
import { 
  getAttendanceRecords, 
  getAttendanceSettings, 
  calculateEmployeeStats,
  getTodayString 
} from '../utils/attendanceDatabase';
import { motion, AnimatePresence } from 'framer-motion';

// Chart JS registration
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

import { useDatabaseStore } from '../context/DatabaseContext';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard({ searchFilter, onNavigate }) {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const { users, projects, reports, announcements, invalidateStore } = useDatabaseStore();
  const { isLight } = useTheme();

  const [selectedReport, setSelectedReport] = useState(null);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  
  // Quick announcement composer state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [toast, setToast] = useState('');

  // Admin Dashboard Tabs & Mail Center State
  const [adminActiveTab, setAdminActiveTab] = useState('overview'); // 'overview' | 'manual-mail' | 'mail-info'
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceSettings, setAttendanceSettings] = useState(null);

  // Manual Email Dispatch Console state
  const [recipientType, setRecipientType] = useState('individual'); // 'individual' | 'department' | 'at_risk' | 'suspended' | 'all' | 'custom'
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('Engineering');
  const [customRecipientEmail, setCustomRecipientEmail] = useState('');
  const [emailTemplateType, setEmailTemplateType] = useState('custom');
  const [mailSubject, setMailSubject] = useState('Nexora DPR - Official Communication');
  const [mailMessage, setMailMessage] = useState('Hello,\n\nPlease review the following official communication from Nexora administration.');
  const [mailSending, setMailSending] = useState(false);
  const [previewModalData, setPreviewModalData] = useState(null);
  const [mailLogs, setMailLogs] = useState(() => getEmailAlertLogs());
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryDeptFilter, setDirectoryDeptFilter] = useState('All');
  const [copiedEmail, setCopiedEmail] = useState('');

  // Load attendance records for stats calculations
  useEffect(() => {
    getAttendanceRecords().then(recs => { if (recs) setAttendanceRecords(recs); });
    getAttendanceSettings().then(st => { if (st) setAttendanceSettings(st); });
  }, []);

  const db = useMemo(() => ({
    users: users || [],
    projects: projects || [],
    reports: reports || [],
    announcements: announcements || []
  }), [users, projects, reports, announcements]);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  if (!currentUser) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-nexora-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  // Trigger toast alert helper
  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleQuickReview = async (reportId, status) => {
    const feedbackMsg = status === 'Approved' ? 'Approved via Quick Review.' : 'Rejected via Quick Review.';
    const res = await reviewReportStatus(reportId, status, feedbackMsg, currentUser.name);
    if (res.success) {
      triggerToast(`Report ${status} successfully!`);
      invalidateStore('reports');
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    const res = await postAnnouncement(annTitle, annContent, currentUser.name);
    if (res.success) {
      triggerToast('Announcement published successfully!');
      setAnnTitle('');
      setAnnContent('');
      invalidateStore('announcements');
    }
  };

  const resendConfig = useMemo(() => getResendConfig(), []);

  const staffMembers = useMemo(() => {
    return (db.users || []).filter(u => u.role !== 'admin');
  }, [db.users]);

  // Pre-select first staff member if targetEmployeeId is empty
  useEffect(() => {
    if (!targetEmployeeId && staffMembers.length > 0) {
      setTargetEmployeeId(staffMembers[0].id);
    }
  }, [staffMembers, targetEmployeeId]);

  // Calculate employee stats map
  const employeeStatsMap = useMemo(() => {
    const map = {};
    (db.users || []).forEach(u => {
      map[u.id] = calculateEmployeeStats(u.id, attendanceRecords, attendanceSettings);
    });
    return map;
  }, [db.users, attendanceRecords, attendanceSettings]);

  const atRiskStaff = useMemo(() => {
    return staffMembers.filter(u => {
      const pct = employeeStatsMap[u.id]?.attendancePct ?? 100;
      return pct < 75;
    });
  }, [staffMembers, employeeStatsMap]);

  const suspendedStaff = useMemo(() => {
    return staffMembers.filter(u => {
      const pct = employeeStatsMap[u.id]?.attendancePct ?? 100;
      return pct < 50 || u.status === 'Terminated' || u.isTerminated;
    });
  }, [staffMembers, employeeStatsMap]);

  const departmentsList = useMemo(() => {
    const set = new Set(staffMembers.map(u => u.department).filter(Boolean));
    return Array.from(set);
  }, [staffMembers]);

  // Handle template selection with auto-filling
  const handleSelectTemplate = (type) => {
    setEmailTemplateType(type);
    const targetUser = staffMembers.find(u => u.id === targetEmployeeId) || staffMembers[0];
    const targetName = targetUser?.name || 'Team Member';
    const st = targetUser ? employeeStatsMap[targetUser.id] : null;

    if (type === 'attendance_absent') {
      setMailSubject(`⚠️ Official Notice: Absence Recorded [${targetName}]`);
      setMailMessage(`Your absence was recorded for today (${getTodayString()}). Company attendance policy mandates check-in before 09:15 AM on all scheduled working days.\n\nIf this absence was due to an approved leave or emergency, please submit an official leave application via the Nexora portal or contact HR administration immediately.`);
    } else if (type === 'attendance_warning') {
      const currentPct = st?.attendancePct ?? 64;
      setMailSubject(`⚠️ Official Warning: Attendance Below Requirement (${currentPct}%)`);
      setMailMessage(`This is an official warning notice that your attendance standing is currently at ${currentPct}%, which falls below the mandatory 75% company requirement.\n\nConsistent attendance is essential to maintain good employment standing. Continued delinquency below 50% will lead to immediate portal access suspension and formal HR disciplinary review.`);
    } else if (type === 'attendance_termination') {
      setMailSubject(`🚨 Urgent: Nexora Portal Access Suspended [${targetName}]`);
      setMailMessage(`Your Nexora portal access has been deactivated due to attendance falling below the critical 50% company threshold under official policy.\n\nYou are required to report to the HR administration office or reply immediately to this email to schedule an official policy review hearing.`);
    } else if (type === 'official_announcement') {
      setMailSubject(`📢 Important Company Communication: Nexora Administration`);
      setMailMessage(`Please be advised of an important company announcement regarding team milestone schedules, deliverables, and workplace guidelines.\n\nAll members are expected to review the DPR portal and align with their project leads.`);
    } else if (type === 'dpr_automation') {
      setMailSubject(`🚀 Nexora DPR Email Automation is Live: Real-Time Alerts Direct to Your Inbox`);
      setMailMessage(`We are thrilled to announce that the Nexora DPR (Daily Progress Report) Portal has launched an automated email notification system.\n\nYou will now receive instant, transparent, and color-coded updates for DPR approvals, reviewer feedback, daily attendance monitoring, and leave status directly in your verified personal mailbox.`);
    } else {
      setMailSubject('Nexora DPR - Official Team Update');
      setMailMessage('Hello,\n\nPlease review the following communication from management.');
    }
  };

  // Resolve target recipients list
  const resolveRecipients = () => {
    if (recipientType === 'individual') {
      const u = staffMembers.find(m => m.id === targetEmployeeId) || staffMembers[0];
      if (!u) return [];
      return [{
        user: u,
        name: u.name,
        email: getPersonalEmail(u),
        employeeId: u.id,
        department: u.department
      }];
    }
    if (recipientType === 'department') {
      return staffMembers
        .filter(u => u.department === targetDepartment)
        .map(u => ({
          user: u,
          name: u.name,
          email: getPersonalEmail(u),
          employeeId: u.id,
          department: u.department
        }));
    }
    if (recipientType === 'at_risk') {
      return atRiskStaff.map(u => ({
        user: u,
        name: u.name,
        email: getPersonalEmail(u),
        employeeId: u.id,
        department: u.department
      }));
    }
    if (recipientType === 'suspended') {
      return suspendedStaff.map(u => ({
        user: u,
        name: u.name,
        email: getPersonalEmail(u),
        employeeId: u.id,
        department: u.department
      }));
    }
    if (recipientType === 'all') {
      return staffMembers.map(u => ({
        user: u,
        name: u.name,
        email: getPersonalEmail(u),
        employeeId: u.id,
        department: u.department
      }));
    }
    if (recipientType === 'custom') {
      if (!customRecipientEmail || !customRecipientEmail.includes('@')) return [];
      return [{
        user: { name: 'Recipient', email: customRecipientEmail },
        name: 'Team Member',
        email: customRecipientEmail.trim(),
        employeeId: 'CUSTOM',
        department: 'External/Direct'
      }];
    }
    return [];
  };

  // Generate HTML for recipient
  const buildHtmlForRecipient = (target) => {
    const st = employeeStatsMap[target.employeeId] || { attendancePct: 65 };
    if (emailTemplateType === 'attendance_absent') {
      return generateAttendanceAbsentEmail({
        employeeName: target.name,
        employeeId: target.employeeId,
        department: target.department || 'General',
        date: getTodayString(),
        reason: mailMessage || 'Unexcused Absence',
        attendancePct: st.attendancePct
      });
    }
    if (emailTemplateType === 'attendance_warning') {
      return generateAttendanceWarningEmail({
        employeeName: target.name,
        employeeId: target.employeeId,
        department: target.department || 'General',
        attendancePct: st.attendancePct || 64,
        requiredPct: 75
      });
    }
    if (emailTemplateType === 'attendance_termination') {
      return generateAttendanceTerminationEmail({
        employeeName: target.name,
        employeeId: target.employeeId,
        department: target.department || 'General',
        attendancePct: st.attendancePct || 42
      });
    }
    if (emailTemplateType === 'dpr_automation') {
      return generateDprAutomationAnnouncementEmail({
        employeeName: target.name,
        recipientEmail: target.email
      });
    }
    return generateManualBroadcastEmail({
      recipientName: target.name,
      subject: mailSubject,
      message: mailMessage,
      senderName: currentUser?.name || 'Administrator',
      badgeText: emailTemplateType === 'official_announcement' ? 'COMPANY ANNOUNCEMENT' : 'ADMIN NOTICE'
    });
  };

  // Preview Email
  const handlePreviewManualMail = () => {
    const targets = resolveRecipients();
    if (targets.length === 0) {
      triggerToast('Please select valid recipient(s) to preview email.');
      return;
    }
    const sampleTarget = targets[0];
    const html = buildHtmlForRecipient(sampleTarget);
    setPreviewModalData({
      isOpen: true,
      recipientName: targets.length > 1 ? `${sampleTarget.name} (+${targets.length - 1} more)` : sampleTarget.name,
      personalEmail: targets.length > 1 ? `${sampleTarget.email} (Batch of ${targets.length})` : sampleTarget.email,
      subject: mailSubject,
      html,
      type: emailTemplateType,
      metadata: { recipientCount: targets.length }
    });
  };

  // Dispatch Email Alert(s)
  const handleSendManualMail = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const targets = resolveRecipients();
    if (targets.length === 0) {
      triggerToast('No valid recipients selected.');
      return;
    }

    setMailSending(true);
    let sentCount = 0;
    let failedCount = 0;

    for (const target of targets) {
      try {
        const html = buildHtmlForRecipient(target);
        const res = await sendEmailAlert({
          to: target.email,
          recipientName: target.name,
          subject: mailSubject,
          html,
          type: emailTemplateType,
          metadata: { employeeId: target.employeeId, department: target.department }
        });

        if (res.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        failedCount++;
      }
    }

    setMailSending(false);
    setMailLogs(getEmailAlertLogs());
    if (sentCount > 0) {
      triggerToast(`Successfully dispatched email alert${sentCount > 1 ? 's' : ''} to ${sentCount} recipient${sentCount > 1 ? 's' : ''}!`);
    } else {
      triggerToast('Failed to dispatch emails. Please check your email delivery configuration.');
    }
  };

  // Send quick test email
  const handleSendTestAlert = async () => {
    const testTarget = 'trivintrivin2005@gmail.com';
    setMailSending(true);
    try {
      const html = generateTestEmail({ userName: 'Trivin (Admin)', personalEmail: testTarget });
      const res = await sendEmailAlert({
        to: testTarget,
        recipientName: 'Trivin (Admin)',
        subject: '🧪 DPR Email Automation Test Alert - Nexora DPR',
        html,
        type: 'test_alert',
        metadata: { triggeredFrom: 'Admin Dashboard' }
      });
      setMailSending(false);
      setMailLogs(getEmailAlertLogs());
      if (res.success) {
        triggerToast(`Live test email delivered to ${testTarget}!`);
      } else {
        triggerToast('Test alert failed: ' + (res.error || 'Check delivery configuration'));
      }
    } catch (err) {
      setMailSending(false);
      triggerToast('Error sending test alert: ' + err.message);
    }
  };

  const filteredDirectory = useMemo(() => {
    return staffMembers.filter(u => {
      const personalMail = getPersonalEmail(u).toLowerCase();
      const workMail = (u.email || '').toLowerCase();
      const name = u.name.toLowerCase();
      const id = u.id.toLowerCase();
      const query = directorySearch.toLowerCase().trim();

      const matchesSearch = !query || name.includes(query) || id.includes(query) || personalMail.includes(query) || workMail.includes(query);
      const matchesDept = directoryDeptFilter === 'All' || u.department === directoryDeptFilter;

      return matchesSearch && matchesDept;
    });
  }, [staffMembers, directorySearch, directoryDeptFilter]);

  const handleStartComposeForUser = (user) => {
    setRecipientType('individual');
    setTargetEmployeeId(user.id);
    setAdminActiveTab('manual-mail');
  };

  const handleCopyText = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedEmail(text);
      triggerToast(`Copied ${text} to clipboard`);
      setTimeout(() => setCopiedEmail(''), 2000);
    }
  };


  // Filtered Reports (supporting search query from Header)
  const filteredReportsList = useMemo(() => {
    if (!db || !db.reports) return [];
    const term = searchFilter ? searchFilter.toLowerCase() : '';
    if (!term) return db.reports;
    return db.reports.filter(rep => (
      rep.employeeName.toLowerCase().includes(term) ||
      rep.projectName.toLowerCase().includes(term) ||
      rep.taskCompletedToday.toLowerCase().includes(term) ||
      rep.workStatus.toLowerCase().includes(term)
    ));
  }, [db, searchFilter]);

  // Memoized calculations for Admin Dashboard KPIs & Charts
  const adminStatsAndCharts = useMemo(() => {
    if (!db) return null;

    const totalMembers = db.users.filter(u => u.role !== 'admin').length;
    const activeProjects = db.projects.filter(p => p.status !== 'Completed').length;
    const completedProjectsCount = db.projects.filter(p => p.status === 'Completed').length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayReports = db.reports.filter(r => r.date === todayStr);
    const submittedToday = todayReports.length;
    const pendingToday = todayReports.filter(r => r.status === 'Pending').length;
    const completedTasksCount = db.reports.filter(r => r.workStatus === 'Completed').length;
    
    const avgProgress = Math.round(
      db.reports.reduce((acc, curr) => acc + curr.percentageCompleted, 0) / (db.reports.length || 1)
    );

    const datesLabels = [];
    const hoursData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dLabel = d.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
      datesLabels.push(dLabel);

      const hoursSum = db.reports
        .filter(r => r.date === dStr)
        .reduce((sum, curr) => sum + curr.hoursWorked, 0);
      hoursData.push(hoursSum);
    }

    const barChartData = {
      labels: datesLabels,
      datasets: [
        {
          label: 'Total Hours Worked',
          data: hoursData,
          backgroundColor: 'rgba(168, 85, 247, 0.45)',
          borderColor: '#a855f7',
          borderWidth: 1.5,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(59, 130, 246, 0.65)',
        }
      ]
    };

    const projectNames = db.projects.map(p => p.status === 'Completed' ? `${p.name} (Completed)` : p.name);
    const reportsCountPerProject = db.projects.map(p => 
      db.reports.filter(r => r.projectName === p.name).length
    );

    const doughnutChartData = {
      labels: projectNames,
      datasets: [
        {
          data: reportsCountPerProject,
          backgroundColor: [
            'rgba(59, 130, 246, 0.6)',
            'rgba(168, 85, 247, 0.6)',
            'rgba(236, 72, 153, 0.6)',
            'rgba(99, 102, 241, 0.6)',
          ],
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
        }
      ]
    };

    // Chart 3 Data: Team Performance Trend (Average Completion % over the last 6 days)
    const completionTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayReps = db.reports.filter(r => r.date === dStr);
      const avg = dayReps.length 
        ? Math.round(dayReps.reduce((sum, r) => sum + r.percentageCompleted, 0) / dayReps.length)
        : 65; // default benchmark
      completionTrends.push(avg);
    }

    const lineChartData = {
      labels: datesLabels.slice(1),
      datasets: [
        {
          fill: true,
          label: 'Avg Completion Rate (%)',
          data: completionTrends,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          tension: 0.4,
          borderWidth: 2.5,
          pointBackgroundColor: '#3b82f6',
        }
      ]
    };

    return {
      totalMembers,
      activeProjects,
      completedProjectsCount,
      submittedToday,
      pendingToday,
      completedTasksCount,
      avgProgress,
      barChartData,
      doughnutChartData,
      lineChartData
    };
  }, [db]);

  // RENDER ADMIN DASHBOARD WIDGETS
  const renderAdminDashboard = () => {
    if (!adminStatsAndCharts) return null;

    const {
      totalMembers,
      activeProjects,
      completedProjectsCount,
      submittedToday,
      pendingToday,
      avgProgress,
      barChartData,
      doughnutChartData,
      lineChartData
    } = adminStatsAndCharts;

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: isLight ? '#0f172a' : '#ffffff', font: { size: 11, family: 'Inter', weight: 'bold' } }
        }
      },
      scales: {
        x: { grid: { color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.1)' }, ticks: { color: isLight ? '#0f172a' : '#ffffff', font: { size: 11, weight: 'bold' } } },
        y: { grid: { color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.1)' }, ticks: { color: isLight ? '#0f172a' : '#ffffff', font: { size: 11, weight: 'bold' } } }
      }
    };

    const resolvedRecipients = resolveRecipients();

    return (
      <div className="space-y-6">
        
        {/* Top Tab Switcher & Domain Live Status Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-white/70 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/15 backdrop-blur-xl shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setAdminActiveTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adminActiveTab === 'overview'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>System Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminActiveTab('manual-mail')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                adminActiveTab === 'manual-mail'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <Send className="h-4 w-4" />
              <span>Manual Mail Dispatch</span>
              {atRiskStaff.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {atRiskStaff.length} at-risk
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setAdminActiveTab('mail-info')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adminActiveTab === 'mail-info'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <Inbox className="h-4 w-4" />
              <span>Mail Information & Directory</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                47/47 Linked
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-1 self-end sm:self-auto">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-bold">
              dpralerts.nexoratechs.xyz
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
              Verified
            </span>
          </div>
        </div>

        {/* TAB 1: SYSTEM OVERVIEW */}
        {adminActiveTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Team Members" value={totalMembers} change="+2 new members" changeType="positive" icon={Users} delay={0.05} />
          <StatCard title="Active Projects" value={activeProjects} change={`${completedProjectsCount} completed project${completedProjectsCount === 1 ? '' : 's'}`} changeType="positive" icon={Layers} delay={0.1} onClick={() => setShowProjectsModal(true)} />
          <StatCard title="Submitted Today" value={`${submittedToday}/${totalMembers}`} change={`${pendingToday} pending review`} changeType="negative" icon={CheckSquare} delay={0.15} />
          <StatCard title="Average Progress" value={`${avgProgress}%`} change={`+4.2% since yesterday`} changeType="positive" icon={TrendingUp} delay={0.2} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/[0.08] backdrop-blur-2xl shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col h-80">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 text-left">Weekly Engineering Hours Log</h3>
            <div className="flex-1 relative">
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/[0.08] backdrop-blur-2xl shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col h-80">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 text-left">DPR Project Allocation</h3>
            <div className="flex-1 relative flex items-center justify-center">
              <Doughnut 
                data={doughnutChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: isLight ? '#0f172a' : '#ffffff', boxWidth: 10, font: { size: 10, weight: 'bold' } }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Third Row: Recent Reports Queue & Announcement Composer */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Reports Table Queue */}
          <div className="xl:col-span-2 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/[0.08] backdrop-blur-2xl shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white text-left">Recent Submissions Review Queue</h3>
              <button 
                onClick={() => onNavigate('reports')} 
                className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline transition-all cursor-pointer"
              >
                View all reports
              </button>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/15 text-slate-600 dark:text-white/90 text-[11px] font-extrabold uppercase tracking-wider">
                    <th className="pb-2.5">Member</th>
                    <th className="pb-2.5">Project</th>
                    <th className="pb-2.5 text-center">Status</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-xs text-slate-900 dark:text-white">
                  {filteredReportsList.slice(0, 5).map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-white/15 border border-indigo-200 dark:border-white/20 flex items-center justify-center font-bold text-[11px] text-indigo-600 dark:text-cyan-300">
                          {rep.employeeName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{rep.employeeName}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-300">{rep.date}</span>
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-100">{rep.projectName}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          rep.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30' :
                          rep.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-400/30' :
                          'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-400/30'
                        }`}>
                          {rep.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setSelectedReport(rep)}
                            title="Inspect Details"
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {rep.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleQuickReview(rep.id, 'Approved')}
                                title="Approve"
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 cursor-pointer"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleQuickReview(rep.id, 'Rejected')}
                                title="Reject"
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-400/30 hover:bg-rose-100 dark:hover:bg-rose-500/30 cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReportsList.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500 dark:text-slate-300">No reports found matching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Announcement Composer */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/[0.08] backdrop-blur-2xl shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-5 flex flex-col justify-between text-left">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center gap-1.5">
                <Megaphone className="h-4 w-4 text-indigo-600 dark:text-cyan-400" />
                Publish Announcement
              </h3>
              
              <form onSubmit={handlePostAnnouncement} className="space-y-3.5">
                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-200 font-bold uppercase tracking-wider block mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. Q2 Performance Reviews..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-white/40"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-200 font-bold uppercase tracking-wider block mb-1">Message Content</label>
                  <textarea
                    rows="3"
                    required
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Enter details for the team members notifications feed..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-white/40 resize-none"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                  <span>Publish To Everyone</span>
                </button>
              </form>
            </div>
          </div>

        </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MANUAL MAIL SENDING CONSOLE                       */}
        {/* ========================================================= */}
        {adminActiveTab === 'manual-mail' && (
          <div className="space-y-6 text-left">
            {/* Header Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/40 border border-indigo-500/30 backdrop-blur-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <Mail className="h-4 w-4" />
                    </span>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Manual Mail Dispatch Console</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Live Delivery Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                    Directly dispatch official attendance warning alerts, deactivation notices, or company announcements straight to employees' linked personal mail IDs via verified delivery domain (<span className="font-mono text-indigo-400">alerts@dpralerts.nexoratechs.xyz</span>).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendTestAlert}
                    disabled={mailSending}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Send Test Alert to Admin</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Composer & Dispatch Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Recipient Setup & Email Composer */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* 1. Recipient Selection Card */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.06] backdrop-blur-xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      1. Select Target Recipient Audience
                    </h3>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {resolvedRecipients.length} Recipient{resolvedRecipients.length === 1 ? '' : 's'} Selected
                    </span>
                  </div>

                  {/* Recipient Audience Mode Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'individual', label: 'Single Member', icon: Users },
                      { id: 'department', label: 'By Department', icon: Layers },
                      { id: 'at_risk', label: 'At-Risk (<75%)', icon: AlertTriangle, count: atRiskStaff.length },
                      { id: 'suspended', label: 'Suspended (<50%)', icon: ShieldAlert, count: suspendedStaff.length },
                      { id: 'all', label: 'All Staff (47)', icon: CheckSquare },
                      { id: 'custom', label: 'Direct Custom Email', icon: AtSign }
                    ].map(tab => {
                      const Icon = tab.icon;
                      const active = recipientType === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setRecipientType(tab.id)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25'
                              : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
                            <span>{tab.label}</span>
                          </div>
                          {tab.count !== undefined && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                              active ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-500'
                            }`}>
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Contextual Pickers */}
                  {recipientType === 'individual' && (
                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        Select Staff Member (Linked Personal Mail will be resolved):
                      </label>
                      <select
                        value={targetEmployeeId}
                        onChange={(e) => setTargetEmployeeId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      >
                        {staffMembers.map(u => {
                          const pMail = getPersonalEmail(u);
                          const st = employeeStatsMap[u.id];
                          return (
                            <option key={u.id} value={u.id} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                              {u.name} ({u.id}) — {pMail} {st ? `[${st.attendancePct}% Attendance]` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {recipientType === 'department' && (
                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        Select Department to Target:
                      </label>
                      <select
                        value={targetDepartment}
                        onChange={(e) => setTargetDepartment(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      >
                        {departmentsList.map(dept => {
                          const count = staffMembers.filter(m => m.department === dept).length;
                          return (
                            <option key={dept} value={dept} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                              {dept} ({count} members)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {recipientType === 'custom' && (
                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        Enter Custom Destination Email Address:
                      </label>
                      <input
                        type="email"
                        value={customRecipientEmail}
                        onChange={(e) => setCustomRecipientEmail(e.target.value)}
                        placeholder="e.g. employee.personal@gmail.com"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* Resolved Audience Chips Preview */}
                  <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                      Target Destination Personal Mail IDs ({resolvedRecipients.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {resolvedRecipients.slice(0, 15).map((r, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 rounded-lg text-[11px] font-mono bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                        >
                          <span className="font-sans font-bold text-indigo-600 dark:text-cyan-400">{r.name}</span>
                          <span className="text-slate-500 dark:text-slate-400">&lt;{r.email}&gt;</span>
                        </span>
                      ))}
                      {resolvedRecipients.length > 15 && (
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-cyan-300 bg-indigo-50 dark:bg-indigo-500/20">
                          +{resolvedRecipients.length - 15} more staff
                        </span>
                      )}
                      {resolvedRecipients.length === 0 && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 italic">No matching recipients for selected filters.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Message Template & Content Composer */}
                <form onSubmit={handleSendManualMail} className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.06] backdrop-blur-xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      2. Choose Template & Compose Email
                    </h3>
                  </div>

                  {/* Template Presets Chips */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Quick Template Presets (Auto-fills subject & message):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'dpr_automation', label: '🚀 DPR Automation Rollout', icon: Sparkles },
                        { id: 'custom', label: 'Custom Notice', icon: Mail },
                        { id: 'attendance_absent', label: '⚠️ Marked Absent', icon: UserX },
                        { id: 'attendance_warning', label: '🚨 Low Attendance (<75%)', icon: AlertTriangle },
                        { id: 'attendance_termination', label: '🛑 Portal Suspended (<50%)', icon: ShieldAlert },
                        { id: 'official_announcement', label: '📢 Company Announcement', icon: Megaphone }
                      ].map(tmpl => {
                        const active = emailTemplateType === tmpl.id;
                        return (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => handleSelectTemplate(tmpl.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              active
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20'
                            }`}
                          >
                            <span>{tmpl.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subject Input */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Email Subject Line:
                    </label>
                    <input
                      type="text"
                      required
                      value={mailSubject}
                      onChange={(e) => setMailSubject(e.target.value)}
                      placeholder="e.g. Official Warning Notice..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Message Body Textarea */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        Message Content / Notice Body:
                      </label>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Supports paragraph breaks
                      </span>
                    </div>
                    <textarea
                      rows="6"
                      required
                      value={mailMessage}
                      onChange={(e) => setMailMessage(e.target.value)}
                      placeholder="Enter the official text for this notice..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={handlePreviewManualMail}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="h-4 w-4 text-indigo-500" />
                      <span>Preview HTML Email</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={mailSending || resolvedRecipients.length === 0}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {mailSending ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            <span>Dispatching via Resend...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 text-white" />
                            <span>Dispatch To {resolvedRecipients.length} Recipient{resolvedRecipients.length === 1 ? '' : 's'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

              </div>

              {/* Right Column: Attendance Policy Reference & Recent Dispatches */}
              <div className="space-y-6">
                
                {/* Official Nexora Policy Reference */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.06] backdrop-blur-xl space-y-3 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    Attendance Policy Guidelines
                  </h3>
                  
                  <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">75% Mandatory Attendance:</span>
                      <span>Staff falling below 75% attendance are categorized as <strong>At-Risk</strong> and automatically receive formal warning alerts.</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <span className="font-bold text-rose-700 dark:text-rose-400 block mb-0.5">50% Critical Suspension Threshold:</span>
                      <span>Staff falling below 50% attendance have their daily reporting access deactivated and are subject to HR disciplinary review.</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-0.5">Daily Absence Notifications:</span>
                      <span>Marking an employee Absent dispatches an instant unexcused absence alert with time of recording.</span>
                    </div>
                  </div>
                </div>

                {/* Recent Outbound Dispatches Feed */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.06] backdrop-blur-xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-500" />
                      Recent Dispatch Activity
                    </h3>
                    <button
                      type="button"
                      onClick={() => setMailLogs(getEmailAlertLogs())}
                      className="p-1 rounded-lg text-slate-500 hover:text-indigo-500 transition-colors"
                      title="Refresh logs"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {mailLogs.slice(0, 6).map((log) => (
                      <div 
                        key={log.id} 
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {log.recipientName || log.to}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            log.success ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          }`}>
                            {log.success ? (log.simulated ? 'Simulated' : 'Sent') : 'Failed'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {log.subject}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span className="font-mono">{log.to}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                    {mailLogs.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        No email alerts logged yet.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MAIL INFORMATION & STAFF DIRECTORY                */}
        {/* ========================================================= */}
        {adminActiveTab === 'mail-info' && (
          <div className="space-y-6 text-left">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Linked Personal Emails" 
                value="47 / 47" 
                change="100% Coverage" 
                changeType="positive" 
                icon={Mail} 
                delay={0.05} 
              />
              <StatCard 
                title="At-Risk Attendance" 
                value={atRiskStaff.length} 
                change="Below 75% threshold" 
                changeType={atRiskStaff.length > 0 ? "negative" : "positive"} 
                icon={AlertTriangle} 
                delay={0.1} 
              />
              <StatCard 
                title="Suspended / Deactivated" 
                value={suspendedStaff.length} 
                change="Below 50% threshold" 
                changeType={suspendedStaff.length > 0 ? "negative" : "positive"} 
                icon={ShieldAlert} 
                delay={0.15} 
              />
              <StatCard 
                title="Total Dispatch Logs" 
                value={mailLogs.length} 
                change="Resend email alerts" 
                changeType="positive" 
                icon={Inbox} 
                delay={0.2} 
              />
            </div>

            {/* Resend Service & Sender Health Card */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.06] backdrop-blur-xl shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Resend Domain & Email Service Infrastructure</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                      Production Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Live email transmission pipeline utilizing Resend REST API on Tokyo infrastructure.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestAlert}
                  disabled={mailSending}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/25 active:scale-95 disabled:opacity-50 self-start md:self-auto"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{mailSending ? 'Sending Test...' : 'Send Live Test Email to Admin'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Verified Sender</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white text-[11px] block truncate">
                    alerts@dpralerts.nexoratechs.xyz
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Domain & Region</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white text-[11px] block truncate">
                    dpralerts.nexoratechs.xyz (Tokyo)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Resend API Key</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white text-[11px] block truncate">
                    re_e4QmJ...RCWM (Active)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Admin Notification Recipient</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white text-[11px] block truncate">
                    trivintrivin2005@gmail.com
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Personal Email Directory & Attendance Registry */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.06] backdrop-blur-xl shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-500" />
                    Staff Personal Email Directory ({filteredDirectory.length} Members)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Official records linking each staff member's work account with their personal email for alerts.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={directorySearch}
                      onChange={(e) => setDirectorySearch(e.target.value)}
                      placeholder="Search name, ID, or mail..."
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-52"
                    />
                  </div>

                  {/* Department Filter */}
                  <select
                    value={directoryDeptFilter}
                    onChange={(e) => setDirectoryDeptFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="All" className="dark:bg-slate-900">All Departments</option>
                    {departmentsList.map(dept => (
                      <option key={dept} value={dept} className="dark:bg-slate-900">{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Directory Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/15 text-slate-600 dark:text-white/80 text-[11px] font-black uppercase tracking-wider">
                      <th className="pb-3">Staff Member</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Linked Personal Email (Alerts)</th>
                      <th className="pb-3">Work Email</th>
                      <th className="pb-3 text-center">Attendance Standing</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-xs text-slate-900 dark:text-white">
                    {filteredDirectory.map((user) => {
                      const personalEmail = getPersonalEmail(user);
                      const stats = employeeStatsMap[user.id] || { attendancePct: 100 };
                      const pct = stats.attendancePct ?? 100;
                      const isAtRisk = pct < 75;
                      const isSuspended = pct < 50 || user.status === 'Terminated' || user.isTerminated;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-white/10 border border-indigo-200 dark:border-white/20 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-cyan-300">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{user.name}</span>
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{user.id}</span>
                            </div>
                          </td>

                          <td className="py-3 font-semibold text-slate-700 dark:text-slate-200">
                            {user.department || 'General'}
                          </td>

                          <td className="py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-indigo-600 dark:text-cyan-400 font-medium">
                                {personalEmail}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(personalEmail)}
                                title="Copy Personal Email"
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                              >
                                {copiedEmail === personalEmail ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                            {user.email}
                          </td>

                          <td className="py-3 text-center">
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                isSuspended
                                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                  : isAtRisk
                                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              }`}>
                                {pct}% {isSuspended ? '• Suspended' : isAtRisk ? '• Warning' : '• Good'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleStartComposeForUser(user)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-cyan-300 hover:bg-indigo-100 dark:hover:bg-white/20 transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Send className="h-3 w-3" />
                              <span>Compose</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredDirectory.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                          No staff found matching directory search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Email Dispatch History Audit Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.06] backdrop-blur-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-purple-500" />
                    Complete Resend Dispatch Audit Trail ({mailLogs.length} Records)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Immutable log of all automated attendance warnings, absence alerts, and manual broadcasts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMailLogs(getEmailAlertLogs())}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh Log</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/15 text-slate-600 dark:text-white/80 text-[11px] font-black uppercase tracking-wider">
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Recipient</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Subject</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right">Message ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-xs text-slate-900 dark:text-white">
                    {mailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-2.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>

                        <td className="py-2.5">
                          <span className="font-bold block text-slate-900 dark:text-white">{log.recipientName || 'Member'}</span>
                          <span className="font-mono text-[10px] text-indigo-600 dark:text-cyan-400">{log.to}</span>
                        </td>

                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                            {log.type}
                          </span>
                        </td>

                        <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
                          {log.subject}
                        </td>

                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            log.success
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          }`}>
                            {log.success ? (log.simulated ? 'Simulated' : 'Delivered') : 'Failed'}
                          </span>
                        </td>

                        <td className="py-2.5 text-right font-mono text-[10px] text-slate-400">
                          {log.resendMessageId ? log.resendMessageId.slice(0, 18) + '...' : 'local-record'}
                        </td>
                      </tr>
                    ))}
                    {mailLogs.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                          No email alert dispatches recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    );
  };

  // RENDER TEAM MEMBER INDIVIDUAL DASHBOARD
  const renderMemberDashboard = () => {
    const myEmail = currentUser?.email || '';
    const myReports = (db.reports || []).filter(r => r.employeeEmail === myEmail);
    const submittedCount = myReports.length;
    const approvedCount = myReports.filter(r => r.status === 'Approved').length;
    const rate = submittedCount ? Math.round((approvedCount / submittedCount) * 100) : 100;
    
    const recentActivity = myReports.slice(0, 4);

    // Calculate active vs completed assigned projects
    const assigned = Array.isArray(currentUser?.assignedProjects) ? currentUser.assignedProjects : ['All'];
    const myProjects = (db.projects || []).filter(p => assigned.includes(p.name) || assigned.includes('All'));
    const activeAssignedProjects = myProjects.filter(p => p.status !== 'Completed').length;
    const completedAssignedProjects = myProjects.filter(p => p.status === 'Completed').length;

    return (
      <div className="space-y-6">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Assigned Projects" value={activeAssignedProjects} change={`${completedAssignedProjects} completed project${completedAssignedProjects === 1 ? '' : 's'}`} changeType="positive" icon={Layers} delay={0.05} onClick={() => setShowProjectsModal(true)} />
          <StatCard title="Reports Logged" value={submittedCount} change="Since account start" changeType="neutral" icon={CheckSquare} delay={0.1} />
          <StatCard title="Approval Rate" value={`${rate}%`} change={`${approvedCount} reports approved`} changeType="positive" icon={TrendingUp} delay={0.15} />
          <StatCard title="Logged Hours" value={`${myReports.reduce((sum, r) => sum + r.hoursWorked, 0)}h`} change="Weekly tracking active" changeType="neutral" icon={Clock} delay={0.2} />
        </div>

        {/* Second Row: Team Announcements & Recent Personal Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Personal Reports History List */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/[0.08] backdrop-blur-2xl shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-5 flex flex-col text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">My Recent Progress Submissions</h3>
              <button 
                onClick={() => onNavigate('reports')} 
                className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline transition-all cursor-pointer"
              >
                View full history
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {recentActivity.map(rep => (
                <div 
                  key={rep.id} 
                  onClick={() => setSelectedReport(rep)}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{rep.projectName} - {rep.moduleName}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock3 className="h-3 w-3 text-indigo-600 dark:text-cyan-400" /> {rep.date} • {rep.hoursWorked} hrs worked
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      rep.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30' :
                      rep.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-400/30' :
                      'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-400/30'
                    }`}>
                      {rep.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="py-12 text-center text-slate-500 dark:text-slate-300 text-xs">
                  No reports logged yet. Start by creating a report.
                </div>
              )}
            </div>
          </div>

          {/* Announcements Card Board */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/[0.08] backdrop-blur-2xl shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-5 flex flex-col text-left">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center gap-1.5 border-b border-slate-200 dark:border-white/15 pb-2.5">
              <BellRing className="h-4 w-4 text-indigo-600 dark:text-cyan-400 animate-bounce" />
              Company Announcements
            </h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {db.announcements.map((ann) => (
                <div key={ann.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{ann.title}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-200 mt-1 leading-relaxed">{ann.content}</p>
                  <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-300 mt-3 font-medium">
                    <span>By {ann.sender}</span>
                    <span>{ann.date}</span>
                  </div>
                </div>
              ))}
              {db.announcements.length === 0 && (
                <div className="text-center text-slate-500 dark:text-slate-400 text-xs py-8">No announcements posted.</div>
              )}
            </div>
          </div>

        </div>

      </div>
    );
  };

  return (
    <>
      {/* Toast popup */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-nexora-purple shadow-glow-purple text-xs text-slate-200 animate-slide-in flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-nexora-purple animate-ping" />
          {toast}
        </div>
      )}

      {/* Render selected view */}
      {isAdmin ? renderAdminDashboard() : renderMemberDashboard()}

      {/* Report detail drawer inspector */}
      {selectedReport && (
        <ReportModal 
          isOpen={!!selectedReport}
          report={selectedReport}
          currentUser={currentUser}
          onClose={() => setSelectedReport(null)}
          onActionSuccess={(msg) => {
            triggerToast(msg);
            invalidateStore('reports');
          }}
        />
      )}

      {/* Projects list registry modal */}
      <ProjectsModal
        isOpen={showProjectsModal}
        projects={db.projects || []}
        onClose={() => setShowProjectsModal(false)}
      />

      {/* Email Preview Modal */}
      {previewModalData && (
        <EmailPreviewModal
          isOpen={previewModalData.isOpen}
          onClose={() => setPreviewModalData(null)}
          recipientName={previewModalData.recipientName}
          personalEmail={previewModalData.personalEmail}
          subject={previewModalData.subject}
          html={previewModalData.html}
          type={previewModalData.type}
          metadata={previewModalData.metadata}
          onSent={() => {
            setMailLogs(getEmailAlertLogs());
            triggerToast('Email alert successfully dispatched via Resend!');
          }}
        />
      )}
    </>
  );
}
