import React, { useState } from 'react';
import { X, Calendar, User, Briefcase, Clock, Percent, AlertCircle, FileText, CheckCircle2, XCircle, Edit, Download } from 'lucide-react';
import { reviewReportStatus } from '../utils/database';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ReportModal({ report, isOpen, onClose, currentUser, onActionSuccess }) {
  const [feedback, setFeedback] = useState(report?.feedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !report) return null;

  const isAdmin = currentUser?.role === 'admin';
  const canEdit = currentUser?.role === 'member' && report.status === 'Pending' && report.date === new Date().toISOString().split('T')[0];

  const handleReview = async (status) => {
    setIsSubmitting(true);
    try {
      const res = await reviewReportStatus(report.id, status, feedback, currentUser.name);
      if (res.success) {
        if (onActionSuccess) onActionSuccess(`Report ${status.toLowerCase()} successfully!`);
        onClose();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColors = {
    Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  const workStatusColors = {
    'Completed': 'bg-emerald-500/20 text-emerald-300',
    'In Progress': 'bg-blue-500/20 text-blue-300',
    'Blocked': 'bg-rose-500/20 text-rose-300',
    'Not Started': 'bg-slate-500/20 text-slate-300',
  };

  const handleSingleExportPDF = () => {
    const doc = new jsPDF();
    
    // Branding
    doc.setFillColor(3, 7, 18);
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(22);
    doc.text("NEXORA TECHNOLOGIES", 15, 25);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("DAILY PROGRESS REPORT", 15, 33);
    
    doc.setDrawColor(40, 50, 70);
    doc.line(15, 38, 195, 38);
    
    // Metadata block
    doc.setFontSize(10);
    doc.setTextColor(160, 170, 190);
    doc.text(`Report ID: ${report.id}`, 15, 48);
    doc.text(`Submission Date: ${report.date}`, 15, 54);
    
    doc.text(`Employee Name: ${report.employeeName}`, 120, 48);
    doc.text(`Employee ID: ${report.employeeId}`, 120, 54);
    
    doc.line(15, 62, 195, 62);
    
    // Detailed Table info
    const reportData = [
      ["Project Name", report.projectName],
      ["Module Name", report.moduleName],
      ["Assigned Task", report.taskAssigned],
      ["Task Completed Today", report.taskCompletedToday],
      ["Hours Worked", `${report.hoursWorked} hrs`],
      ["Completion Percentage", `${report.percentageCompleted}%`],
      ["Work Status", report.workStatus],
      ["Challenges Faced", report.challengesFaced || "None"],
      ["Tomorrow's Plan", report.tomorrowPlan || "N/A"],
      ["Status Summary", report.status],
      ["Manager Feedback", report.feedback || "None"]
    ];
    
    doc.autoTable({
      startY: 70,
      head: [["Field", "Details"]],
      body: reportData,
      theme: 'grid',
      styles: {
        fillColor: [15, 23, 42],
        textColor: [220, 225, 235],
        lineColor: [40, 50, 75],
        fontSize: 10
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { fontStyle: 'bold', width: 50 },
        1: { width: 130 }
      }
    });

    // Signature line
    const finalY = doc.previousAutoTable.finalY + 30;
    doc.line(15, finalY, 70, finalY);
    doc.text("Employee Signature", 15, finalY + 5);
    
    doc.line(130, finalY, 185, finalY);
    doc.text("Manager Signature", 130, finalY + 5);
    
    doc.save(`NexoraDPR_${report.employeeName.replace(/\s+/g, '_')}_${report.date}.pdf`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl glass-panel shadow-glass border border-slate-800 bg-slate-950 z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusColors[report.status]}`}>
                {report.status}
              </span>
              <span className="text-xs text-slate-500 font-medium">#{report.id}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleSingleExportPDF}
                title="Download PDF"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all"
              >
                <Download className="h-4.5 w-4.5" />
              </button>
              <button 
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body content (scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Meta User & Project Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/30 border border-slate-800/50">
                <div className="p-2 bg-nexora-blue/10 rounded-lg text-nexora-blue">
                  <User className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Employee</p>
                  <p className="text-xs font-semibold text-slate-200">{report.employeeName}</p>
                  <p className="text-[9px] text-slate-500">{report.employeeId} • {report.employeeEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/30 border border-slate-800/50">
                <div className="p-2 bg-nexora-purple/10 rounded-lg text-nexora-purple">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Project & Date</p>
                  <p className="text-xs font-semibold text-slate-200">{report.projectName}</p>
                  <p className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="h-2.5 w-2.5" /> {report.date}
                  </p>
                </div>
              </div>
            </div>

            {/* Task stats strip */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/40 rounded-xl border border-slate-800/30 text-center">
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Work Hours</p>
                <div className="flex items-center justify-center gap-1 text-slate-200 font-bold text-sm mt-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {report.hoursWorked} hrs
                </div>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Progress</p>
                <div className="flex items-center justify-center gap-1 text-slate-200 font-bold text-sm mt-1">
                  <Percent className="h-3.5 w-3.5 text-slate-400" />
                  {report.percentageCompleted}%
                </div>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Status</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold rounded-md ${workStatusColors[report.workStatus]}`}>
                  {report.workStatus}
                </span>
              </div>
            </div>

            {/* Task & Progress descriptions */}
            <div className="space-y-4 text-left">
              <div>
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Assigned Task Details</h4>
                <p className="text-xs text-slate-300 font-medium px-3.5 py-2.5 bg-slate-950/20 border border-slate-800/40 rounded-xl leading-relaxed">
                  {report.taskAssigned}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Module Name</h4>
                <p className="text-xs text-slate-300 font-semibold">
                  {report.moduleName || "Not Specified"}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Task Completed Today</h4>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed px-4 py-3 bg-slate-950/40 border border-slate-800/40 rounded-xl">
                  {report.taskCompletedToday}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Challenges Faced</h4>
                  <p className="text-xs text-slate-300 leading-relaxed px-3.5 py-2.5 bg-slate-950/20 border border-slate-800/40 rounded-xl flex items-start gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    {report.challengesFaced || "None reported"}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Tomorrow's Plan</h4>
                  <p className="text-xs text-slate-300 leading-relaxed px-3.5 py-2.5 bg-slate-950/20 border border-slate-800/40 rounded-xl">
                    {report.tomorrowPlan || "N/A"}
                  </p>
                </div>
              </div>

              {/* Attachments Section */}
              {((report.images && report.images.length > 0) || (report.files && report.files.length > 0)) && (
                <div className="space-y-3">
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Attachments</h4>
                  
                  {/* Images row */}
                  {report.images && report.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {report.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                          <img src={img} alt="Uploaded screenshot" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Documents row */}
                  {report.files && report.files.length > 0 && (
                    <div className="space-y-1.5">
                      {report.files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/30 border border-slate-800/50">
                          <div className="flex items-center gap-2 text-xs text-slate-300">
                            <FileText className="h-4 w-4 text-nexora-blue" />
                            <span>{file.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Approval status banner / feedback */}
            {report.status !== 'Pending' && (
              <div className={`p-4 rounded-xl border ${
                report.status === 'Approved' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
              } text-left`}>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Manager Review Notes</p>
                <div className="flex items-start gap-2 mt-2">
                  {report.status === 'Approved' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Reviewed by {report.approvedBy || 'Admin'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 italic leading-relaxed">
                      {report.feedback || "Approved with no comments."}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Admin Review Control Panel Footer */}
          {isAdmin && report.status === 'Pending' && (
            <div className="p-5 border-t border-slate-800 bg-slate-950/40 text-left space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                  Admin Feedback / Review Comments
                </label>
                <textarea
                  rows="2"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Optional: Enter reviewer notes (e.g. issues, guidelines, questions)..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl glass-input placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReview('Rejected')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all cursor-pointer"
                >
                  Reject Report
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReview('Approved')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-glow-emerald transition-all cursor-pointer"
                >
                  Approve Report
                </button>
              </div>
            </div>
          )}

          {/* Member Edit Shortcut Footer */}
          {canEdit && (
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  // Dispatch navigate event or click submit DPR tab
                  window.dispatchEvent(new CustomEvent('switch_tab', { detail: 'dpr-form' }));
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-nexora-purple text-white hover:bg-nexora-purple/90 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit Today's Report
              </button>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
