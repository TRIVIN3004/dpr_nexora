import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  Layers, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  UploadCloud, 
  Image as ImageIcon, 
  FileCheck,
  X,
  Plus
} from 'lucide-react';
import { 
  getCurrentUser, 
  getDatabase, 
  submitDailyReport, 
  updateDailyReport 
} from '../utils/mockDatabase';
import confetti from 'canvas-confetti';

export default function DprForm({ onActionSuccess }) {
  const [currentUser, setCurrentUser] = useState(null);
  
  // Form values
  const [projectName, setProjectName] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [taskAssigned, setTaskAssigned] = useState('');
  const [taskCompletedToday, setTaskCompletedToday] = useState('');
  const [workStatus, setWorkStatus] = useState('In Progress');
  const [hoursWorked, setHoursWorked] = useState(8);
  const [percentageCompleted, setPercentageCompleted] = useState(50);
  const [challengesFaced, setChallengesFaced] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  
  // Attachments state
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  
  // Mode flag: submitting new report vs editing today's report
  const [editMode, setEditMode] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);
  const [existingStatus, setExistingStatus] = useState('');

  const loadOrCreate = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (!user) return;

    // Check if the user has already submitted a report for TODAY
    const db = getDatabase();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayReport = db.reports.find(r => r.employeeEmail === user.email && r.date === todayStr);

    if (todayReport) {
      setEditMode(true);
      setEditingReportId(todayReport.id);
      setExistingStatus(todayReport.status);
      
      // Prefill fields
      setProjectName(todayReport.projectName);
      setModuleName(todayReport.moduleName || '');
      setTaskAssigned(todayReport.taskAssigned || '');
      setTaskCompletedToday(todayReport.taskCompletedToday || '');
      setWorkStatus(todayReport.workStatus);
      setHoursWorked(todayReport.hoursWorked);
      setPercentageCompleted(todayReport.percentageCompleted);
      setChallengesFaced(todayReport.challengesFaced || '');
      setTomorrowPlan(todayReport.tomorrowPlan || '');
      setImages(todayReport.images || []);
      setFiles(todayReport.files || []);
    } else {
      setEditMode(false);
      setEditingReportId(null);
      setExistingStatus('');
      
      // Reset fields
      if (user.assignedProjects.length > 0 && user.assignedProjects[0] !== 'All') {
        setProjectName(user.assignedProjects[0]);
      } else {
        setProjectName('');
      }
      setModuleName('');
      setTaskAssigned('');
      setTaskCompletedToday('');
      setWorkStatus('In Progress');
      setHoursWorked(8);
      setPercentageCompleted(50);
      setChallengesFaced('');
      setTomorrowPlan('');
      setImages([]);
      setFiles([]);
    }
  };

  useEffect(() => {
    loadOrCreate();
    const handleUpdate = () => loadOrCreate();
    window.addEventListener('database_updated', handleUpdate);
    return () => window.removeEventListener('database_updated', handleUpdate);
  }, []);

  if (!currentUser) return null;

  // Handle image loading (base64 simulation)
  const handleImageUpload = (e) => {
    const selected = Array.from(e.target.files);
    selected.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle generic file attachment simulation
  const handleFileUpload = (e) => {
    const selected = Array.from(e.target.files);
    const mockFiles = selected.map(f => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`
    }));
    setFiles(prev => [...prev, ...mockFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!projectName) {
      alert("Please select a project.");
      return;
    }

    const payload = {
      employeeName: currentUser.name,
      employeeId: currentUser.id,
      employeeEmail: currentUser.email,
      projectName,
      moduleName,
      taskAssigned,
      taskCompletedToday,
      workStatus,
      hoursWorked: parseFloat(hoursWorked),
      percentageCompleted: parseInt(percentageCompleted),
      challengesFaced,
      tomorrowPlan,
      images,
      files
    };

    if (editMode) {
      if (existingStatus !== 'Pending') {
        alert("This report has already been reviewed by the admin and cannot be modified.");
        return;
      }
      const res = updateDailyReport(editingReportId, payload);
      if (res.success) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
        if (onActionSuccess) onActionSuccess("Daily Progress Report updated successfully!");
        window.dispatchEvent(new Event('database_updated'));
      } else {
        alert(res.error);
      }
    } else {
      const res = submitDailyReport(payload);
      if (res.success) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.8 } });
        if (onActionSuccess) onActionSuccess("Daily Progress Report submitted successfully!");
        window.dispatchEvent(new Event('database_updated'));
      }
    }
  };

  const todayStr = new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Upper info panel */}
      <div className="glass-panel p-5 rounded-2xl shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-nexora-purple animate-pulse" />
            {editMode ? "Modify Today's Progress Report" : "Daily Progress Report Submission"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Date: {todayStr}
          </p>
        </div>
        
        {editMode && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            existingStatus === 'Pending' 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            Status: {existingStatus}
          </span>
        )}
      </div>

      {/* Disable Form view if today's report is already approved/rejected */}
      {editMode && existingStatus !== 'Pending' ? (
        <div className="glass-panel p-10 rounded-2xl shadow-glass text-center space-y-3">
          <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-full">
            <FileCheck className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">Your DPR has been approved!</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Today's report was reviewed and locked by the manager. Modifications are disabled for the day. You can review the details on the reports history tab.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl shadow-glass p-6 text-left space-y-5">
          
          {/* Read Only Auto-Filled details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/30 border border-slate-800/40">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Employee Name</span>
              <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                {currentUser.name}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Employee ID</span>
              <p className="text-xs font-semibold text-slate-300">
                {currentUser.id}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Department</span>
              <p className="text-xs font-semibold text-slate-300">
                {currentUser.department}
              </p>
            </div>
          </div>

          {/* Project & Module */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-slate-400" /> Project Name *
              </label>
              <select
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl glass-input focus:outline-none bg-slate-950 cursor-pointer"
              >
                <option value="">Select Project</option>
                {currentUser.assignedProjects.includes('All') 
                  ? ['Nexora ERP', 'CloudSync', 'CyberShield', 'AI Analyst'].map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))
                  : currentUser.assignedProjects.map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))
                }
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Module / Feature Name *</label>
              <input
                type="text"
                required
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="e.g. Auth Controller, UI Layout, API Integration"
                className="w-full px-3 py-2.5 text-xs rounded-xl glass-input placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Tasks Descriptions */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-400" /> Task Assigned *
              </label>
              <textarea
                rows="2"
                required
                value={taskAssigned}
                onChange={(e) => setTaskAssigned(e.target.value)}
                placeholder="Details of the specific task assigned to you today..."
                className="w-full px-3 py-2 text-xs rounded-xl glass-input placeholder-slate-600 focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Task Completed Today *</label>
              <textarea
                rows="3"
                required
                value={taskCompletedToday}
                onChange={(e) => setTaskCompletedToday(e.target.value)}
                placeholder="Describe what you actually completed today. Be detailed (e.g. created endpoints, fixed styling bugs)..."
                className="w-full px-3 py-2.5 text-xs rounded-xl glass-input placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Metrics grid (Status, Hours, % Completion) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Work Status *</label>
              <select
                value={workStatus}
                onChange={(e) => setWorkStatus(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl glass-input focus:outline-none bg-slate-950 cursor-pointer"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" /> Hours Worked Today *
              </label>
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                required
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl glass-input focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <span>Completion Percentage</span>
                <span className="text-nexora-purple font-bold">{percentageCompleted}%</span>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={percentageCompleted}
                  onChange={(e) => setPercentageCompleted(e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-nexora-purple"
                />
              </div>
            </div>
          </div>

          {/* Tomorrow's Plan & Challenges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-slate-400" /> Challenges Faced (Optional)
              </label>
              <textarea
                rows="2.5"
                value={challengesFaced}
                onChange={(e) => setChallengesFaced(e.target.value)}
                placeholder="Mention blockers, environmental errors, design gaps, or type 'None'..."
                className="w-full px-3 py-2 text-xs rounded-xl glass-input placeholder-slate-600 focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Tomorrow's Plan *</label>
              <textarea
                rows="2.5"
                required
                value={tomorrowPlan}
                onChange={(e) => setTomorrowPlan(e.target.value)}
                placeholder="What tasks do you plan to tackle next workday?"
                className="w-full px-3 py-2 text-xs rounded-xl glass-input placeholder-slate-600 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Drag & Drop Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image attachment */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4" /> Screenshots / Images
              </span>
              <div className="relative border-2 border-dashed border-slate-800 hover:border-nexora-purple/50 bg-slate-950/20 rounded-xl p-4 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="h-6 w-6 text-slate-500 group-hover:text-nexora-purple transition-colors mb-2" />
                <span className="text-[11px] text-slate-400 font-medium">Click or Drag images here</span>
                <span className="text-[9px] text-slate-600">Supports PNG, JPG, JPEG</span>
              </div>
              
              {/* Images preview list */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative h-12 w-20 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 group">
                      <img src={img} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-md bg-black/60 text-slate-400 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Document attachment */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Documents / Code ZIPs
              </span>
              <div className="relative border-2 border-dashed border-slate-800 hover:border-nexora-blue/50 bg-slate-950/20 rounded-xl p-4 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="h-6 w-6 text-slate-500 group-hover:text-nexora-blue transition-colors mb-2" />
                <span className="text-[11px] text-slate-400 font-medium">Click or Drag documents here</span>
                <span className="text-[9px] text-slate-600">PDF, ZIP, DOCX, XLSX</span>
              </div>

              {/* Files preview list */}
              {files.length > 0 && (
                <div className="space-y-1.5 pt-1.5">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                      <span className="truncate max-w-[150px] text-slate-300 text-left">{file.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500">{file.size}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-slate-400 hover:text-rose-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form action button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-nexora-blue via-nexora-indigo to-nexora-purple text-white shadow-glow-purple hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex justify-center items-center gap-1.5"
          >
            {editMode ? "Update Progress Report" : "Submit Progress Report"}
          </button>

        </form>
      )}

    </div>
  );
}
