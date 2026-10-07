import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  CalendarRange, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  Check, 
  X, 
  Briefcase
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import AttendanceStatCard from './AttendanceStatCard';
import { getTodayString } from '../../utils/attendanceDatabase';

export default function LeaveManagementView({
  currentUser,
  users = [],
  leaveApplications = [],
  onOpenApplyModal,
  onReviewApplication,
  onCancelApplication,
  showToast
}) {
  const isAdmin = currentUser?.role === 'admin';
  const todayStr = getTodayString();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDept, setFilterDept] = useState('All');

  // Member applications vs All applications
  const visibleApplications = useMemo(() => {
    if (isAdmin) {
      return leaveApplications;
    }
    return leaveApplications.filter(l => l.employeeId === currentUser?.id);
  }, [isAdmin, leaveApplications, currentUser]);

  const departmentsList = useMemo(() => {
    const set = new Set(users.map(u => u.department).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [users]);

  // Filtered applications list
  const filteredList = useMemo(() => {
    return visibleApplications.filter(app => {
      const matchSearch = 
        (app.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.startDate || '').includes(searchTerm) ||
        (app.endDate || '').includes(searchTerm);

      const matchStatus = filterStatus === 'All' || app.status === filterStatus;
      const matchType = filterType === 'All' || app.leaveType === filterType;
      const matchDept = filterDept === 'All' || app.department === filterDept;

      return matchSearch && matchStatus && matchType && matchDept;
    });
  }, [visibleApplications, searchTerm, filterStatus, filterType, filterDept]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = visibleApplications.length;
    const pending = visibleApplications.filter(l => l.status === 'Pending').length;
    const approved = visibleApplications.filter(l => l.status === 'Approved').length;
    const rejected = visibleApplications.filter(l => l.status === 'Rejected').length;
    
    // Approved days total
    const approvedDaysSum = visibleApplications
      .filter(l => l.status === 'Approved')
      .reduce((sum, l) => sum + (Number(l.totalDays) || 0), 0);

    // On-leave today count
    const onLeaveToday = visibleApplications.filter(l => {
      if (l.status !== 'Approved') return false;
      return l.startDate <= todayStr && l.endDate >= todayStr;
    }).length;

    // Member balance simulation: standard 18 annual days entitlement
    const annualEntitlement = 18;
    const remainingBalance = Math.max(0, annualEntitlement - approvedDaysSum);

    return {
      total,
      pending,
      approved,
      rejected,
      approvedDaysSum,
      onLeaveToday,
      annualEntitlement,
      remainingBalance
    };
  }, [visibleApplications, todayStr]);

  const getLeaveTypeBadge = (type) => {
    switch (type) {
      case 'Sick / Medical Leave':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
      case 'Casual Leave':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
      case 'Semester / Exam Leave':
        return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
      case 'Earned / Annual Leave':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      case 'Half-Day Leave':
        return 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60';
      case 'Emergency / Unpaid Leave':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40';
      case 'Rejected':
        return 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40';
      case 'Cancelled':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      default:
        return 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40';
    }
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Nexora Tech - Leave Applications Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated Date: ${new Date().toLocaleString()} | Total Records: ${filteredList.length}`, 14, 28);

    const tableColumn = ["ID", "Employee", "Type", "Start Date", "End Date", "Days", "Status", "Reason"];
    const tableRows = filteredList.map(l => [
      l.id,
      `${l.employeeName} (${l.employeeId})`,
      l.leaveType,
      l.startDate,
      l.endDate,
      `${l.totalDays}d`,
      l.status,
      l.reason || 'N/A'
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 34,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8 }
    });

    doc.save(`Leave_Applications_${todayStr}.pdf`);
    showToast('Leave Report PDF downloaded!');
  };

  // Export Excel
  const exportExcel = () => {
    const exportData = filteredList.map(l => ({
      "Application ID": l.id,
      "Employee ID": l.employeeId,
      "Employee Name": l.employeeName,
      "Department": l.department || 'N/A',
      "Leave Type": l.leaveType,
      "Start Date": l.startDate,
      "End Date": l.endDate,
      "Total Days": l.totalDays,
      "Status": l.status,
      "Reason": l.reason,
      "Emergency Contact": l.emergencyContact || 'N/A',
      "Handover To": l.handoverTo || 'N/A',
      "Applied At": l.appliedAt,
      "Reviewed By": l.reviewedBy || 'N/A',
      "Admin Remarks": l.adminRemarks || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave_Applications");
    XLSX.writeFile(workbook, `Leave_Applications_${todayStr}.xlsx`);
    showToast('Leave Report Excel sheet downloaded!');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Stat Cards */}
      {!isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AttendanceStatCard 
            title="Leave Balance Remaining"
            value={`${stats.remainingBalance} Days`}
            subtitle={`Out of ${stats.annualEntitlement} annual allowed days`}
            icon={Briefcase}
            color="emerald"
            badge="Available"
          />
          <AttendanceStatCard 
            title="Approved Leaves"
            value={`${stats.approvedDaysSum} Days`}
            subtitle={`${stats.approved} requests approved`}
            icon={CheckCircle2}
            color="purple"
          />
          <AttendanceStatCard 
            title="Pending Requests"
            value={`${stats.pending} Requests`}
            subtitle="Awaiting administration review"
            icon={Clock}
            color="amber"
          />
          <AttendanceStatCard 
            title="Total Applications"
            value={`${stats.total}`}
            subtitle="All time requests submitted"
            icon={CalendarDays}
            color="blue"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AttendanceStatCard 
            title="Pending Approvals"
            value={`${stats.pending} Requests`}
            subtitle="Requires Admin Action"
            icon={Clock}
            color={stats.pending > 0 ? 'amber' : 'blue'}
            badge={stats.pending > 0 ? 'Action Needed' : 'All Clear'}
          />
          <AttendanceStatCard 
            title="On-Leave Today"
            value={`${stats.onLeaveToday} Staff`}
            subtitle={`Currently active today (${todayStr})`}
            icon={CalendarRange}
            color="purple"
          />
          <AttendanceStatCard 
            title="Approved Leaves"
            value={`${stats.approved} Requests`}
            subtitle={`${stats.approvedDaysSum} cumulative days`}
            icon={CheckCircle2}
            color="emerald"
          />
          <AttendanceStatCard 
            title="Total Requests Logged"
            value={`${stats.total}`}
            subtitle="Across all team departments"
            icon={CalendarDays}
            color="blue"
          />
        </div>
      )}

      {/* Main Container */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-4">
        
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>{isAdmin ? 'Workforce Leave Management' : 'My Leave Applications'}</span>
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 mt-0.5">
              Apply for leave, track date ranges, view approval statuses and duration history
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenApplyModal}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 text-white" />
              <span>Apply for Leave</span>
            </button>

            <button
              onClick={exportPDF}
              className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              title="Download Leave Report PDF"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={exportExcel}
              className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              title="Download Leave Report Excel"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={isAdmin ? "Search Employee or Reason..." : "Search Reason or Date..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-bold"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none font-bold cursor-pointer"
            >
              <option value="All">Status: All</option>
              <option value="Pending">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none font-bold cursor-pointer"
            >
              <option value="All">Type: All Leaves</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick / Medical Leave">Sick / Medical Leave</option>
              <option value="Semester / Exam Leave">Semester / Exam Leave</option>
              <option value="Earned / Annual Leave">Earned / Annual Leave</option>
              <option value="Half-Day Leave">Half-Day Leave</option>
              <option value="Emergency / Unpaid Leave">Emergency Leave</option>
              <option value="Maternity / Paternity Leave">Maternity / Paternity Leave</option>
            </select>

            {/* Dept Filter (Admin only) */}
            {isAdmin && (
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none font-bold cursor-pointer"
              >
                {departmentsList.map(d => (
                  <option key={d} value={d}>
                    Dept: {d}
                  </option>
                ))}
              </select>
            )}
          </div>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-900 dark:text-white font-extrabold">{filteredList.length}</strong> applications
          </span>
        </div>

        {/* Applications Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0b0f19] shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-white border-b border-slate-200 dark:border-white/10">
              <tr>
                {isAdmin && <th className="p-3.5 font-black uppercase">Employee</th>}
                <th className="p-3.5 font-black uppercase">Leave Type</th>
                <th className="p-3.5 font-black uppercase">Start Date ➔ End Date</th>
                <th className="p-3.5 font-black uppercase">Duration</th>
                <th className="p-3.5 font-black uppercase">Reason & Remarks</th>
                <th className="p-3.5 font-black uppercase">Status</th>
                <th className="p-3.5 font-black uppercase">Review Info</th>
                <th className="p-3.5 text-right font-black uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CalendarRange className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-bold">No leave applications found matching your criteria.</p>
                      <button
                        onClick={onOpenApplyModal}
                        className="mt-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-500"
                      >
                        Apply for Leave Now
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((app) => {
                  const isPending = app.status === 'Pending';
                  const isApproved = app.status === 'Approved';
                  const isRejected = app.status === 'Rejected';

                  return (
                    <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      {/* Employee (for Admin) */}
                      {isAdmin && (
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold flex items-center justify-center text-xs">
                              {app.employeeName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <span className="font-black text-sm block text-slate-900 dark:text-white">
                                {app.employeeName}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                {app.employeeId} • {app.department || 'Engineering'}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Leave Type */}
                      <td className="p-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getLeaveTypeBadge(app.leaveType)}`}>
                          {app.leaveType}
                        </span>
                      </td>

                      {/* Start Date -> End Date */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-900 dark:text-white">
                          <span>{app.startDate}</span>
                          <span className="text-indigo-500 font-black">➔</span>
                          <span>{app.endDate}</span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black text-xs">
                          {app.totalDays} {app.totalDays === 1 ? 'Day' : 'Days'}
                        </span>
                      </td>

                      {/* Reason & Remarks */}
                      <td className="p-3.5 max-w-xs">
                        <p className="font-medium text-xs text-slate-800 dark:text-slate-200 truncate" title={app.reason}>
                          {app.reason}
                        </p>
                        {app.adminRemarks && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block mt-0.5 truncate" title={`Admin note: ${app.adminRemarks}`}>
                            Admin: {app.adminRemarks}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </td>

                      {/* Review Info */}
                      <td className="p-3.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {app.reviewedBy ? (
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">{app.reviewedBy}</span>
                            <span className="text-[10px] block">{app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : ''}</span>
                          </div>
                        ) : (
                          <span className="italic text-slate-400">Pending Review</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => onReviewApplication(app, 'Approved')}
                                  title="Approve Leave (Auto-syncs Attendance)"
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => onReviewApplication(app, 'Rejected')}
                                  title="Reject Leave"
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => onReviewApplication(app)}
                                title="View Details"
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Details</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div>
                            {isPending ? (
                              <button
                                onClick={() => onCancelApplication(app.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Cancel Request</span>
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400">--</span>
                            )}
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
