import React, { useState, useEffect } from 'react';
import { getDatabase } from '../utils/mockDatabase';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { BarChart3, TrendingUp, Layers, Award } from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Analytics() {
  const [db, setDb] = useState(null);

  useEffect(() => {
    setDb(getDatabase());
    const handleUpdate = () => setDb(getDatabase());
    window.addEventListener('database_updated', handleUpdate);
    return () => window.removeEventListener('database_updated', handleUpdate);
  }, []);

  if (!db) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-nexora-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  // Pre-calculate aggregates
  const reportsCount = db.reports.length;
  const totalHours = db.reports.reduce((acc, c) => acc + c.hoursWorked, 0);
  
  // Best performing employee (most hours logged)
  const employeeHours = {};
  db.reports.forEach(r => {
    employeeHours[r.employeeName] = (employeeHours[r.employeeName] || 0) + r.hoursWorked;
  });
  
  let bestEmployee = "None";
  let maxHours = 0;
  Object.keys(employeeHours).forEach(name => {
    if (employeeHours[name] > maxHours) {
      maxHours = employeeHours[name];
      bestEmployee = name;
    }
  });

  // KPI calculations
  const avgCompletion = Math.round(
    db.reports.reduce((acc, c) => acc + c.percentageCompleted, 0) / (reportsCount || 1)
  );

  // Chart 1: Employee Productivity (Total Hours worked per user)
  const employeeNames = db.users.filter(u => u.role !== 'admin').map(u => u.name);
  const employeeHoursData = employeeNames.map(name => employeeHours[name] || 0);

  const barChartData = {
    labels: employeeNames,
    datasets: [
      {
        label: 'Cumulative Hours Worked',
        data: employeeHoursData,
        backgroundColor: [
          'rgba(99, 102, 241, 0.5)',
          'rgba(168, 85, 247, 0.5)',
          'rgba(236, 72, 153, 0.5)'
        ],
        borderColor: [
          '#6366f1',
          '#a855f7',
          '#ec4899'
        ],
        borderWidth: 1.5,
        borderRadius: 6
      }
    ]
  };

  // Chart 2: Project completion rates (average % completed per project)
  const projectNames = db.projects.map(p => p.name);
  const avgProgressPerProject = projectNames.map(name => {
    const projReports = db.reports.filter(r => r.projectName === name);
    return projReports.length 
      ? Math.round(projReports.reduce((acc, r) => acc + r.percentageCompleted, 0) / projReports.length)
      : 0;
  });

  const doughnutChartData = {
    labels: projectNames,
    datasets: [
      {
        data: avgProgressPerProject,
        backgroundColor: [
          'rgba(59, 130, 246, 0.55)',
          'rgba(168, 85, 247, 0.55)',
          'rgba(236, 72, 153, 0.55)',
          'rgba(99, 102, 241, 0.55)',
        ],
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1
      }
    ]
  };

  // Chart 3: Line trend of hours worked daily over last 7 days
  const dateLabels = [];
  const dailyHours = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    dateLabels.push(d.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    
    const sum = db.reports
      .filter(r => r.date === dStr)
      .reduce((acc, r) => acc + r.hoursWorked, 0);
    dailyHours.push(sum);
  }

  const lineChartData = {
    labels: dateLabels,
    datasets: [
      {
        fill: true,
        label: 'Total Team Hours / Day',
        data: dailyHours,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.05)',
        borderWidth: 2,
        tension: 0.45,
        pointBackgroundColor: '#a855f7',
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#64748b', font: { size: 9 } } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#64748b', font: { size: 9 } } }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* KPI stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Team Hours" value={`${totalHours} hrs`} change="Across all dashboards" changeType="neutral" icon={Clock} delay={0.05} />
        <StatCard title="Average Task Progress" value={`${avgCompletion}%`} change="+2.1% week over week" changeType="positive" icon={TrendingUp} delay={0.1} />
        <StatCard title="Active Work Items" value={reportsCount} change="Report cards logged" changeType="neutral" icon={BarChart3} delay={0.15} />
        <StatCard title="Star Contributor" value={bestEmployee} change={`${maxHours} hrs logged`} changeType="positive" icon={Award} delay={0.2} />
      </div>

      {/* Main Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bar chart - Employee hours */}
        <div className="glass-panel p-5 rounded-2xl shadow-glass flex flex-col h-80 text-left">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Employee Workload Allocation</h3>
          <div className="flex-1 relative">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Line chart - Hours timeline */}
        <div className="glass-panel p-5 rounded-2xl shadow-glass flex flex-col h-80 text-left">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Sprint Delivery Hours Curve</h3>
          <div className="flex-1 relative">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Doughnut Chart - Project progress */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl shadow-glass flex flex-col h-80 text-left">
          <h3 className="text-sm font-bold text-slate-300 mb-3">Average Project Status Completion rates</h3>
          <div className="flex-1 relative flex items-center justify-center">
            <Doughnut 
              data={doughnutChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: { color: '#94a3b8', boxWidth: 12, font: { size: 10 } }
                  }
                }
              }} 
            />
          </div>
        </div>

      </div>

    </div>
  );
}

// Sub components for Clock
function Clock({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  );
}
