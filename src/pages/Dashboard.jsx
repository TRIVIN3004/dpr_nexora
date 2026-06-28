import React, { useState, useEffect } from 'react';
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
  BellRing
} from 'lucide-react';
import StatCard from '../components/StatCard';
import ReportModal from '../components/ReportModal';
import { 
  getDatabase, 
  getCurrentUser, 
  postAnnouncement, 
  reviewReportStatus 
} from '../utils/database';
import { motion } from 'framer-motion';

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

export default function Dashboard({ searchFilter, onNavigate }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [db, setDb] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Quick announcement composer state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [toast, setToast] = useState('');

  const loadData = async () => {
    setCurrentUser(getCurrentUser());
    const data = await getDatabase();
    setDb(data);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('database_updated', handleUpdate);
    return () => window.removeEventListener('database_updated', handleUpdate);
  }, []);

  if (!db || !currentUser) {
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
      window.dispatchEvent(new Event('database_updated'));
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
      window.dispatchEvent(new Event('database_updated'));
    }
  };

  // Filtered Reports (supporting search query from Header)
  const filteredReportsList = db.reports.filter(rep => {
    const term = searchFilter ? searchFilter.toLowerCase() : '';
    if (!term) return true;
    return (
      rep.employeeName.toLowerCase().includes(term) ||
      rep.projectName.toLowerCase().includes(term) ||
      rep.taskCompletedToday.toLowerCase().includes(term) ||
      rep.workStatus.toLowerCase().includes(term)
    );
  });

  // RENDER ADMIN DASHBOARD WIDGETS
  const renderAdminDashboard = () => {
    // Math indicators
    const totalMembers = db.users.filter(u => u.role !== 'admin').length;
    const activeProjects = db.projects.length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayReports = db.reports.filter(r => r.date === todayStr);
    const submittedToday = todayReports.length;
    const pendingToday = todayReports.filter(r => r.status === 'Pending').length;

    const completedTasksCount = db.reports.filter(r => r.workStatus === 'Completed').length;
    
    // Average completion percentage for pending and approved items
    const avgProgress = Math.round(
      db.reports.reduce((acc, curr) => acc + curr.percentageCompleted, 0) / (db.reports.length || 1)
    );

    // Chart 1 Data: Weekly Productivity (aggregate hours by date in the last 7 days)
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

    // Chart 2 Data: Project Progress (Share of reports per project name)
    const projectNames = db.projects.map(p => p.name);
    const reportsCountPerProject = projectNames.map(name => 
      db.reports.filter(r => r.projectName === name).length
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

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#334155', font: { size: 10, family: 'Inter' } }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: '#475569', font: { size: 10 } } },
        y: { grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: '#475569', font: { size: 10 } } }
      }
    };

    return (
      <div className="space-y-6">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Team Members" value={totalMembers} change="+2 new members" changeType="positive" icon={Users} delay={0.05} />
          <StatCard title="Active Projects" value={activeProjects} change="All targets active" changeType="neutral" icon={Layers} delay={0.1} />
          <StatCard title="Submitted Today" value={`${submittedToday}/${totalMembers}`} change={`${pendingToday} pending review`} changeType="negative" icon={CheckSquare} delay={0.15} />
          <StatCard title="Average Progress" value={`${avgProgress}%`} change={`+4.2% since yesterday`} changeType="positive" icon={TrendingUp} delay={0.2} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 glass-panel p-5 rounded-2xl shadow-glass flex flex-col h-80">
            <h3 className="text-sm font-bold text-slate-300 mb-3 text-left">Weekly Engineering Hours Log</h3>
            <div className="flex-1 relative">
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="glass-panel p-5 rounded-2xl shadow-glass flex flex-col h-80">
            <h3 className="text-sm font-bold text-slate-300 mb-3 text-left">DPR Project Allocation</h3>
            <div className="flex-1 relative flex items-center justify-center">
              <Doughnut 
                data={doughnutChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: '#94a3b8', boxWidth: 10, font: { size: 9 } }
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
          <div className="xl:col-span-2 glass-panel rounded-2xl shadow-glass p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-300 text-left">Recent Submissions Review Queue</h3>
              <button 
                onClick={() => onNavigate('reports')} 
                className="text-xs font-semibold text-nexora-blue hover:text-nexora-purple transition-all cursor-pointer"
              >
                View all reports
              </button>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-2.5">Member</th>
                    <th className="pb-2.5">Project</th>
                    <th className="pb-2.5 text-center">Status</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                  {filteredReportsList.slice(0, 5).map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-3 flex items-center gap-2">
                        <div className="h-6.5 w-6.5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-nexora-purple">
                          {rep.employeeName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200 block">{rep.employeeName}</span>
                          <span className="text-[9px] text-slate-500">{rep.date}</span>
                        </div>
                      </td>
                      <td className="py-3 font-medium">{rep.projectName}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rep.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                          rep.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                        }`}>
                          {rep.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setSelectedReport(rep)}
                            title="Inspect Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {rep.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleQuickReview(rep.id, 'Approved')}
                                title="Approve"
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleQuickReview(rep.id, 'Rejected')}
                                title="Reject"
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/10 hover:bg-rose-500/20 cursor-pointer"
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
                      <td colSpan="4" className="py-8 text-center text-slate-500">No reports found matching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Announcement Composer */}
          <div className="glass-panel rounded-2xl shadow-glass p-5 flex flex-col justify-between text-left">
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-1.5">
                <Megaphone className="h-4 w-4 text-nexora-purple" />
                Publish Announcement
              </h3>
              
              <form onSubmit={handlePostAnnouncement} className="space-y-3.5">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. Q2 Performance Reviews..."
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input placeholder-slate-600 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Message Content</label>
                  <textarea
                    rows="3"
                    required
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Enter details for the team members notifications feed..."
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input placeholder-slate-600 focus:outline-none resize-none"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-nexora-purple to-nexora-blue hover:brightness-110 active:scale-[0.98] transition-all text-white flex items-center justify-center gap-2 cursor-pointer shadow-glow-purple"
                >
                  <Send className="h-3.5 w-3.5" />
                  Publish To Everyone
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    );
  };

  // RENDER TEAM MEMBER INDIVIDUAL DASHBOARD
  const renderMemberDashboard = () => {
    const myReports = db.reports.filter(r => r.employeeEmail === currentUser.email);
    const submittedCount = myReports.length;
    const approvedCount = myReports.filter(r => r.status === 'Approved').length;
    const rate = submittedCount ? Math.round((approvedCount / submittedCount) * 100) : 100;
    
    const recentActivity = myReports.slice(0, 4);

    return (
      <div className="space-y-6">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Assigned Projects" value={currentUser.assignedProjects.length} change="Connected to workflow" changeType="neutral" icon={Layers} delay={0.05} />
          <StatCard title="Reports Logged" value={submittedCount} change="Since account start" changeType="neutral" icon={CheckSquare} delay={0.1} />
          <StatCard title="Approval Rate" value={`${rate}%`} change={`${approvedCount} reports approved`} changeType="positive" icon={TrendingUp} delay={0.15} />
          <StatCard title="Logged Hours" value={`${myReports.reduce((sum, r) => sum + r.hoursWorked, 0)}h`} change="Weekly tracking active" changeType="neutral" icon={Clock} delay={0.2} />
        </div>

        {/* Second Row: Team Announcements & Recent Personal Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Personal Reports History List */}
          <div className="lg:col-span-2 glass-panel rounded-2xl shadow-glass p-5 flex flex-col text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-300">My Recent Progress Submissions</h3>
              <button 
                onClick={() => onNavigate('reports')} 
                className="text-xs font-semibold text-nexora-blue hover:text-nexora-purple transition-all cursor-pointer"
              >
                View full history
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {recentActivity.map(rep => (
                <div 
                  key={rep.id} 
                  onClick={() => setSelectedReport(rep)}
                  className="p-3.5 rounded-xl border border-slate-800/60 bg-slate-950/20 hover:bg-slate-800/10 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-200">{rep.projectName} - {rep.moduleName}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
                      <Clock3 className="h-3 w-3" /> {rep.date} • {rep.hoursWorked} hrs worked
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rep.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                      rep.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {rep.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No reports logged yet. Start by creating a report.
                </div>
              )}
            </div>
          </div>

          {/* Announcements Card Board */}
          <div className="glass-panel rounded-2xl shadow-glass p-5 flex flex-col text-left">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-1.5 border-b border-slate-800/40 pb-2.5">
              <BellRing className="h-4 w-4 text-nexora-purple animate-bounce" />
              Company Announcements
            </h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {db.announcements.map((ann) => (
                <div key={ann.id} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/50">
                  <h4 className="text-xs font-bold text-slate-200">{ann.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{ann.content}</p>
                  <div className="flex justify-between items-center text-[9px] text-slate-500 mt-3 font-medium">
                    <span>By {ann.sender}</span>
                    <span>{ann.date}</span>
                  </div>
                </div>
              ))}
              {db.announcements.length === 0 && (
                <div className="text-center text-slate-600 text-xs py-8">No announcements posted.</div>
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
            loadData();
          }}
        />
      )}
    </>
  );
}
