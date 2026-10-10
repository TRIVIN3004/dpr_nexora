import React, { useState, useEffect, useMemo } from 'react';
import { 
  getDatabase, 
  getCurrentUser, 
  reviewReportStatus,
  deleteReport
} from '../utils/database';
import { 
  FileSpreadsheet, 
  FileText, 
  Eye, 
  Check, 
  X, 
  Filter, 
  RefreshCw,
  Search,
  Download,
  Calendar,
  Trash2
} from 'lucide-react';
import ReportModal from '../components/ReportModal';
import * as XLSX from 'xlsx';
import { exportDPRRegistryPDF } from '../utils/pdfExportTemplates';

import { useDatabaseStore } from '../context/DatabaseContext';

export default function AdminReports({ searchFilter }) {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const { reports: dbReports, users: dbUsers, projects: dbProjects, invalidateStore } = useDatabaseStore();

  const reports = dbReports || [];
  const users = useMemo(() => (dbUsers || []).filter(u => u.role !== 'admin'), [dbUsers]);
  const projects = dbProjects || [];
  
  // Filter states
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // UI state
  const [selectedReport, setSelectedReport] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleReview = async (id, status) => {
    const defaultFeedback = status === 'Approved' ? 'Approved.' : 'Rejected.';
    const res = await reviewReportStatus(id, status, defaultFeedback, currentUser?.name || 'Admin');
    if (res.success) {
      triggerToast(`Report ${status} successfully!`);
      invalidateStore('reports');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm("Are you sure you want to permanently delete this report? This action cannot be undone.")) {
      const res = await deleteReport(reportId);
      if (res.success) {
        triggerToast("Report successfully deleted.");
        invalidateStore('reports');
      } else {
        alert(res.error || "Failed to delete report.");
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedEmployee('');
    setSelectedProject('');
    setSelectedStatus('');
    setSelectedDate('');
  };

  // Filter logic (memoized to prevent calculation delays)
  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return reports.filter(rep => {
      // Role-based scoping (Admins see all; team members see only theirs)
      const isOwner = currentUser?.role === 'admin' || rep.employeeEmail === currentUser?.email;
      if (!isOwner) return false;

      // Search query from header
      const searchMatch = searchFilter 
        ? (rep.employeeName.toLowerCase().includes(searchFilter.toLowerCase()) ||
           rep.projectName.toLowerCase().includes(searchFilter.toLowerCase()) ||
           rep.taskCompletedToday.toLowerCase().includes(searchFilter.toLowerCase()) ||
           rep.id.toLowerCase().includes(searchFilter.toLowerCase()))
        : true;

      // Direct selectors
      const employeeMatch = selectedEmployee ? rep.employeeEmail === selectedEmployee : true;
      const projectMatch = selectedProject ? rep.projectName === selectedProject : true;
      const statusMatch = selectedStatus ? rep.status === selectedStatus : true;
      const dateMatch = selectedDate ? rep.date === selectedDate : true;

      return searchMatch && employeeMatch && projectMatch && statusMatch && dateMatch;
    });
  }, [reports, currentUser, searchFilter, selectedEmployee, selectedProject, selectedStatus, selectedDate]);

  // Export to Excel sheet
  const handleExportExcel = () => {
    const formattedData = filteredReports.map(rep => ({
      "Report ID": rep.id,
      "Date": rep.date,
      "Employee": rep.employeeName,
      "Employee ID": rep.employeeId,
      "Project": rep.projectName,
      "Module": rep.moduleName || "N/A",
      "Hours": rep.hoursWorked,
      "Completion %": rep.percentageCompleted,
      "Work Status": rep.workStatus,
      "Status": rep.status,
      "Task Completed": rep.taskCompletedToday,
      "Challenges": rep.challengesFaced || "None",
      "Feedback": rep.feedback || "None"
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DPR Reports");
    
    // Auto column widths
    const maxLens = Object.keys(formattedData[0] || {}).map(key => 
      Math.max(key.length, ...formattedData.map(row => String(row[key] || '').length))
    );
    ws['!cols'] = maxLens.map(len => ({ wch: Math.min(len + 2, 40) }));

    XLSX.writeFile(wb, `Nexora_DPR_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    triggerToast("Excel file generated successfully!");
  };

  // Export to PDF using jsPDF Autotable
  const handleExportPDF = () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      exportDPRRegistryPDF({
        reports: filteredReports,
        dateStr: todayStr
      });
      triggerToast("PDF generated successfully!");
    } catch (err) {
      console.error('Error exporting DPR Registry PDF:', err);
      triggerToast("Error exporting PDF report");
    }
  };

  const statusBadges = {
    Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className="space-y-6">
      
      {/* Toast alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-nexora-purple shadow-glow-purple text-xs text-slate-200 animate-slide-in flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-nexora-purple animate-ping" />
          {toast}
        </div>
      )}

      {/* Control panel filter card */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/[0.08] backdrop-blur-2xl shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-left space-y-4">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Filter className="h-4.5 w-4.5 text-indigo-600 dark:text-[#818cf8]" />
            Report Filter Registry
          </h3>
          
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              disabled={filteredReports.length === 0}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </button>
            
            <button
              onClick={handleExportPDF}
              disabled={filteredReports.length === 0}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-4 w-4" />
              Export PDF Registry
            </button>
          </div>
        </div>

        {/* Filters grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 pt-2">
          
          {/* Employee dropdown (only for Admin) */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              disabled={currentUser?.role !== 'admin'}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Employees</option>
              {users.map(u => (
                <option key={u.id} value={u.email} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{u.name}</option>
              ))}
            </select>
          </div>

          {/* Project dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {p.name}{p.status === 'Completed' ? ' (Completed)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Statuses</option>
              <option value="Approved" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Approved</option>
              <option value="Rejected" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Rejected</option>
              <option value="Pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pending</option>
            </select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Specific Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>

          {/* Clear Button */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          </div>

        </div>

      </div>

      {/* Main Table view */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/[0.08] backdrop-blur-2xl shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center font-bold">Hours Worked</th>
                <th className="px-6 py-4 text-center">Progress %</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-900 dark:text-slate-200">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-cyan-300">
                      {rep.employeeName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{rep.employeeName}</span>
                      <span className="text-[9px] text-slate-500">{rep.employeeId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{rep.projectName}</span>
                    <span className="text-[9px] text-slate-500 block truncate max-w-[120px]">{rep.moduleName || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                    {rep.date}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-white">
                    {rep.hoursWorked} hrs
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{rep.percentageCompleted}%</span>
                      <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="h-full bg-indigo-600 dark:bg-cyan-400" 
                          style={{ width: `${rep.percentageCompleted}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadges[rep.status]}`}>
                      {rep.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setSelectedReport(rep)}
                        title="Inspect DPR"
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {currentUser?.role === 'admin' && rep.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleReview(rep.id, 'Approved')}
                            title="Approve Report"
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 cursor-pointer"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReview(rep.id, 'Rejected')}
                            title="Reject Report"
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/20 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {currentUser?.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteReport(rep.id)}
                          title="Delete Report"
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/20 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">No reports found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Report Inspector Drawer */}
      {selectedReport && (
        <ReportModal 
          isOpen={!!selectedReport}
          report={selectedReport}
          currentUser={currentUser}
          onClose={() => setSelectedReport(null)}
          onActionSuccess={(msg) => {
            triggerToast(msg);
            loadData();
          }}
        />
      )}

    </div>
  );
}
