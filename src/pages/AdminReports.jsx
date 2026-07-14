import React, { useState, useEffect } from 'react';
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminReports({ searchFilter }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Filter states
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // UI state
  const [selectedReport, setSelectedReport] = useState(null);
  const [toast, setToast] = useState('');

  const loadData = async () => {
    setCurrentUser(getCurrentUser());
    const db = await getDatabase();
    if (db) {
      setReports(db.reports);
      setUsers(db.users.filter(u => u.role !== 'admin'));
      setProjects(db.projects);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('database_updated', handleUpdate);
    return () => window.removeEventListener('database_updated', handleUpdate);
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
      window.dispatchEvent(new Event('database_updated'));
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm("Are you sure you want to permanently delete this report? This action cannot be undone.")) {
      const res = await deleteReport(reportId);
      if (res.success) {
        triggerToast("Report successfully deleted.");
        window.dispatchEvent(new Event('database_updated'));
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

  // Filter logic
  const filteredReports = reports.filter(rep => {
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
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape
    
    // Branding title
    doc.setFillColor(3, 7, 18);
    doc.rect(0, 0, 297, 210, 'F');
    
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(22);
    doc.text("NEXORA TECHNOLOGIES", 15, 20);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("DAILY PROGRESS REPORT REGISTRY", 15, 28);
    
    doc.setFontSize(9);
    doc.setTextColor(140, 150, 170);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 33);
    doc.text(`Total Records Listed: ${filteredReports.length}`, 15, 38);

    doc.setDrawColor(40, 50, 70);
    doc.line(15, 42, 282, 42);

    // Columns config
    const tableHeaders = [["ID", "Date", "Employee", "Project", "Module", "Hours", "%", "Task", "Status"]];
    const tableRows = filteredReports.map(r => [
      r.id,
      r.date,
      r.employeeName,
      r.projectName,
      r.moduleName || "-",
      `${r.hoursWorked} hrs`,
      `${r.percentageCompleted}%`,
      r.taskCompletedToday.slice(0, 45) + (r.taskCompletedToday.length > 45 ? "..." : ""),
      r.status
    ]);

    doc.autoTable({
      startY: 48,
      head: tableHeaders,
      body: tableRows,
      theme: 'grid',
      styles: {
        fillColor: [15, 23, 42],
        textColor: [220, 225, 235],
        lineColor: [40, 50, 75],
        fontSize: 8.5
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { width: 18 },
        1: { width: 22 },
        2: { width: 35 },
        3: { width: 35 },
        4: { width: 30 },
        5: { width: 18 },
        6: { width: 12 },
        7: { width: 85 },
        8: { width: 20 }
      }
    });

    doc.save(`Nexora_DPR_Registry_${new Date().toISOString().split('T')[0]}.pdf`);
    triggerToast("PDF generated successfully!");
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
      <div className="glass-panel p-5 rounded-2xl shadow-glass text-left space-y-4">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Filter className="h-4.5 w-4.5 text-nexora-purple" />
            Report Filter Registry
          </h3>
          
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              disabled={filteredReports.length === 0}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </button>
            
            <button
              onClick={handleExportPDF}
              disabled={filteredReports.length === 0}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              disabled={currentUser?.role !== 'admin'}
              className="w-full px-3 py-2 text-xs rounded-xl glass-input focus:outline-none bg-slate-950 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
            >
              <option value="">All Employees</option>
              {users.map(u => (
                <option key={u.id} value={u.email}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Project dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl glass-input focus:outline-none bg-slate-950 cursor-pointer"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name}{p.status === 'Completed' ? ' (Completed)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl glass-input focus:outline-none bg-slate-950 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Specific Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl glass-input focus:outline-none cursor-pointer"
            />
          </div>

          {/* Clear Button */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          </div>

        </div>

      </div>

      {/* Main Table view */}
      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/20 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center font-bold">Hours Worked</th>
                <th className="px-6 py-4 text-center">Progress %</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-800/10 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-nexora-purple">
                      {rep.employeeName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200 block">{rep.employeeName}</span>
                      <span className="text-[9px] text-slate-500">{rep.employeeId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-200">{rep.projectName}</span>
                    <span className="text-[9px] text-slate-500 block truncate max-w-[120px]">{rep.moduleName || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-medium">
                    {rep.date}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-200">
                    {rep.hoursWorked} hrs
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold text-slate-200">{rep.percentageCompleted}%</span>
                      <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="h-full bg-nexora-purple" 
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
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {currentUser?.role === 'admin' && rep.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleReview(rep.id, 'Approved')}
                            title="Approve Report"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/20 cursor-pointer"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReview(rep.id, 'Rejected')}
                            title="Reject Report"
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/15 hover:bg-rose-500/20 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {currentUser?.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteReport(rep.id)}
                          title="Delete Report"
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/15 hover:bg-rose-500/20 cursor-pointer"
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
