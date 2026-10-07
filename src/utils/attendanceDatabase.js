import { supabase } from './database';

// Global In-Memory Fallback Cache for local preview reliability
let localAttendanceCache = null;
let localLeaveApplicationsCache = null;
let localSettingsCache = {
  id: 'GLOBAL_CONFIG',
  officeStartTime: '09:00',
  officeEndTime: '17:00',
  lateEntryTime: '09:15',
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  minimumAttendancePct: 75,
  warningPercentage: 50,
  terminationPercentage: 50
};
let localWarningsCache = [];
let localTerminationCache = [];

// Helper to format date YYYY-MM-DD
export const formatLocalDate = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayString = () => formatLocalDate(new Date());

// Generate dynamic initial attendance seed data if Supabase table is fresh
export const seedSampleAttendanceData = (users = []) => {
  const records = [];
  const today = new Date();

  // Generate 20 days of historical data for existing users
  for (let i = 25; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    const dateStr = formatLocalDate(d);

    users.forEach((u, idx) => {
      // Create distinct attendance profiles so policy tiers (Excellent, Good, Warning, Terminated) are active
      let status = 'Present';
      let checkIn = '08:55';
      let checkOut = '17:05';
      let remarks = 'On time';

      // Specific sample distributions:
      // EMP-006 (Pavithraa) & EMP-017 (Logesh) set with low attendance to demonstrate Warning / Termination policy live!
      if (u.id === 'EMP-017' && i < 16) {
        status = 'Absent';
        checkIn = '';
        checkOut = '';
        remarks = 'Unexcused Absence';
      } else if (u.id === 'EMP-006' && (i % 3 === 0)) {
        status = 'Present';
        checkIn = '09:40';
        checkOut = '17:00';
        remarks = 'Flexible Check-In';
      } else if (u.id === 'EMP-006' && (i % 4 === 0)) {
        status = 'Absent';
        checkIn = '';
        checkOut = '';
        remarks = 'Personal Leave';
      } else if (idx % 7 === 0 && i % 5 === 0) {
        status = 'Present';
        checkIn = '09:30';
        checkOut = '17:15';
        remarks = 'Flexible Check-In';
      } else if (idx % 9 === 0 && i % 6 === 0) {
        status = 'Leave';
        checkIn = '';
        checkOut = '';
        remarks = 'Approved Medical Leave';
      }

      records.push({
        id: `ATT-${dateStr}-${u.id}`,
        employeeId: u.id,
        employeeName: u.name,
        department: u.department || 'Engineering',
        project: (u.assignedProjects && u.assignedProjects[0]) || 'Nexora ERP',
        role: u.role || 'member',
        date: dateStr,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        status: status,
        remarks: remarks,
        markedBy: 'Self',
        editHistory: []
      });
    });
  }

  return records;
};

// 1. Get Settings
export const getAttendanceSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('attendance_settings')
      .select('*')
      .eq('id', 'GLOBAL_CONFIG')
      .maybeSingle();

    if (error || !data) {
      return localSettingsCache;
    }
    localSettingsCache = data;
    return data;
  } catch (err) {
    return localSettingsCache;
  }
};

// 2. Save Settings
export const updateAttendanceSettings = async (newSettings) => {
  try {
    const updated = {
      ...localSettingsCache,
      ...newSettings,
      id: 'GLOBAL_CONFIG',
      updatedAt: new Date().toISOString()
    };

    localSettingsCache = updated;

    const { data, error } = await supabase
      .from('attendance_settings')
      .upsert(updated)
      .select()
      .single();

    if (error) {
      console.warn("Supabase settings update note:", error.message);
    }

    window.dispatchEvent(new Event('database_updated'));
    return { success: true, settings: updated };
  } catch (err) {
    return { success: true, settings: localSettingsCache };
  }
};

// 3. Get Attendance Records (Instant Cache-First Pattern)
export const getAttendanceRecords = async (limit = 50) => {
  // Read from localStorage cache instantly
  if (!localAttendanceCache) {
    try {
      const saved = localStorage.getItem('nexora_attendance_cache');
      if (saved) localAttendanceCache = JSON.parse(saved);
    } catch (e) {}
  }

  // Trigger Supabase fetch in background asynchronously
  const fetchSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('id, employeeId, employeeName, department, project, role, date, checkInTime, checkOutTime, status, remarks, markedBy')
        .order('date', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        localAttendanceCache = data;
        try {
          localStorage.setItem('nexora_attendance_cache', JSON.stringify(data));
        } catch (e) {}
      }
    } catch (err) {}
  };

  // Run fetchSupabase non-blocking
  fetchSupabase();

  if (localAttendanceCache && localAttendanceCache.length > 0) {
    return localAttendanceCache;
  }

  // Fallback to seed cache if empty
  if (!localAttendanceCache) {
    try {
      const { data: users } = await supabase.from('users').select('id, name, department, role, assignedProjects');
      localAttendanceCache = seedSampleAttendanceData(users || []);
    } catch (e) {
      localAttendanceCache = seedSampleAttendanceData([]);
    }
  }

  return localAttendanceCache;
};

// 4. Mark Check-In (Staff / Self / QR / Face)
export const markCheckIn = async (user, method = 'Self', remarks = '') => {
  try {
    const settings = await getAttendanceSettings();
    const todayStr = getTodayString();
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Status is Present directly for flexible entry
    let status = 'Present';

    const recordId = `ATT-${todayStr}-${user.id}`;
    const newRecord = {
      id: recordId,
      employeeId: user.id,
      employeeName: user.name,
      department: user.department || 'Engineering',
      project: (user.assignedProjects && user.assignedProjects[0]) || 'Nexora ERP',
      role: user.role || 'member',
      date: todayStr,
      checkInTime: currentTimeStr,
      checkOutTime: '',
      status: status,
      remarks: remarks || `Checked in via ${method}`,
      markedBy: method,
      editHistory: []
    };

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', recordId)
      .maybeSingle();

    if (existing && existing.checkInTime) {
      return { success: false, error: 'You have already checked in today.' };
    }

    // Upsert into Supabase
    const { data, error } = await supabase
      .from('attendance')
      .upsert(newRecord)
      .select()
      .single();

    if (error) {
      // Local cache update fallback
      if (localAttendanceCache) {
        const idx = localAttendanceCache.findIndex(r => r.id === recordId);
        if (idx >= 0) localAttendanceCache[idx] = newRecord;
        else localAttendanceCache.unshift(newRecord);
      }
    }

    window.dispatchEvent(new Event('database_updated'));
    return { success: true, record: data || newRecord };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// 5. Mark Check-Out
export const markCheckOut = async (user) => {
  try {
    const todayStr = getTodayString();
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const recordId = `ATT-${todayStr}-${user.id}`;

    const { data: existing, error: fetchErr } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', recordId)
      .maybeSingle();

    let targetRecord = existing;
    if (!targetRecord && localAttendanceCache) {
      targetRecord = localAttendanceCache.find(r => r.id === recordId);
    }

    if (!targetRecord) {
      return { success: false, error: 'No check-in record found for today. Please check in first.' };
    }

    const updatedRecord = {
      ...targetRecord,
      checkOutTime: currentTimeStr
    };

    const { data, error } = await supabase
      .from('attendance')
      .update({ checkOutTime: currentTimeStr })
      .eq('id', recordId)
      .select()
      .single();

    if (error && localAttendanceCache) {
      const idx = localAttendanceCache.findIndex(r => r.id === recordId);
      if (idx >= 0) localAttendanceCache[idx] = updatedRecord;
    }

    window.dispatchEvent(new Event('database_updated'));
    return { success: true, record: data || updatedRecord };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// 6. Admin Manual Override / Update Attendance
export const adminUpdateAttendance = async (attendanceData, adminName) => {
  try {
    const recordId = attendanceData.id || `ATT-${attendanceData.date}-${attendanceData.employeeId}`;
    const todayStr = getTodayString();

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', recordId)
      .maybeSingle();

    const currentHistory = existing?.editHistory || [];
    const newHistoryItem = {
      updatedBy: adminName,
      updatedAt: new Date().toISOString(),
      previousStatus: existing?.status || 'None',
      newStatus: attendanceData.status,
      reason: attendanceData.remarks || 'Admin Manual Override'
    };

    const recordToSave = {
      ...attendanceData,
      id: recordId,
      markedBy: 'Admin',
      editHistory: [...currentHistory, newHistoryItem]
    };

    const { data, error } = await supabase
      .from('attendance')
      .upsert(recordToSave)
      .select()
      .single();

    if (error && localAttendanceCache) {
      const idx = localAttendanceCache.findIndex(r => r.id === recordId);
      if (idx >= 0) localAttendanceCache[idx] = recordToSave;
      else localAttendanceCache.unshift(recordToSave);
    }

    // Notify user of administrative edit
    try {
      await supabase.from('notifications').insert({
        id: `NOT-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: attendanceData.employeeId,
        type: 'attendance_update',
        title: 'Attendance Record Updated',
        message: `Admin ${adminName} updated your attendance for ${attendanceData.date} to ${attendanceData.status}.`,
        date: new Date().toISOString(),
        read: false
      });
    } catch (e) {
      // ignore notification errors
    }

    window.dispatchEvent(new Event('database_updated'));
    return { success: true, record: data || recordToSave };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// 7. Compute Stats for a single Employee
export const calculateEmployeeStats = (employeeId, records = [], settings = localSettingsCache) => {
  const empRecords = records.filter(r => r.employeeId === employeeId);
  const totalWorkingDays = Math.max(1, empRecords.length);

  let presentDays = 0;
  let lateDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let halfDays = 0;

  empRecords.forEach(r => {
    if (r.status === 'Present' || r.status === 'Late') presentDays++;
    else if (r.status === 'Absent') absentDays++;
    else if (r.status === 'Leave') leaveDays++;
    else if (r.status === 'Half Day') halfDays++;
  });

  // Calculation formula: Present + (HalfDay * 0.5) out of total working days (No Late timing restrictions)
  const effectivePresent = presentDays + (halfDays * 0.5);
  const attendancePct = Math.min(100, Math.round((effectivePresent / totalWorkingDays) * 100));

  // Determine Status Badge & Level
  let indicator = { label: 'Good', color: 'emerald', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };

  if (attendancePct >= 95) {
    indicator = { label: 'Excellent', color: 'cyan', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
  } else if (attendancePct >= 90) {
    indicator = { label: 'Very Good', color: 'emerald', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  } else if (attendancePct >= 75) {
    indicator = { label: 'Good', color: 'blue', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  } else if (attendancePct >= 50) {
    indicator = { label: 'Warning', color: 'amber', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  } else {
    indicator = { label: 'Terminated', color: 'rose', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
  }

  return {
    totalWorkingDays,
    presentDays,
    lateDays,
    absentDays,
    leaveDays,
    halfDays,
    attendancePct,
    indicator
  };
};

// 8. Policy Evaluation Engine (Auto Warnings & Terminations)
export const evaluateCompanyAttendancePolicy = async (users = [], records = [], settings = localSettingsCache) => {
  const warningsList = [];
  const terminationList = [];

  for (const user of users) {
    if (user.role === 'admin') continue; // exclude admins from termination policy

    const stats = calculateEmployeeStats(user.id, records, settings);

    if (stats.attendancePct < 50) {
      // Automatic Termination Policy Action
      const termRecord = {
        id: `TERM-${user.id}`,
        employeeId: user.id,
        employeeName: user.name,
        employeeEmail: user.email,
        attendancePercentage: stats.attendancePct,
        reason: 'Attendance Below Company Policy',
        terminatedAt: getTodayString(),
        terminatedBy: 'System Automated Policy',
        status: 'Terminated'
      };

      terminationList.push(termRecord);

      // Deactivate user in Supabase users table if not already marked
      if (user.status !== 'Terminated') {
        try {
          await supabase
            .from('users')
            .update({ status: 'Terminated', isTerminated: true })
            .eq('id', user.id);
        } catch (e) {
          user.status = 'Terminated';
          user.isTerminated = true;
        }
      }
    } else if (stats.attendancePct >= 50 && stats.attendancePct < 75) {
      // Automatic Warning Policy Action
      const warnRecord = {
        id: `WARN-${user.id}`,
        employeeId: user.id,
        employeeName: user.name,
        employeeEmail: user.email,
        percentage: stats.attendancePct,
        warningType: 'Below 75%',
        message: 'Your attendance is currently below the company requirement of 75%. Please improve your attendance.',
        issuedAt: getTodayString(),
        status: 'Active'
      };

      warningsList.push(warnRecord);

      // Issue notification to user
      try {
        await supabase.from('notifications').insert({
          id: `NOT-WARN-${user.id}`,
          userId: user.id,
          type: 'warning',
          title: 'Attendance Warning Issued',
          message: warnRecord.message,
          date: new Date().toISOString(),
          read: false
        });
      } catch (e) {
        // ignore duplicate notification error
      }
    }
  }

  localWarningsCache = warningsList;
  localTerminationCache = terminationList;

  return { warnings: warningsList, terminations: terminationList };
};

// 9. Reactivate Terminated Employee (Admin Action)
export const reactivateEmployeeAccount = async (employeeId, adminName) => {
  try {
    // 1. Update user record to Active
    const { data: user, error: userErr } = await supabase
      .from('users')
      .update({ status: 'Active', isTerminated: false })
      .eq('id', employeeId)
      .select()
      .single();

    // 2. Update termination history status
    try {
      await supabase
        .from('termination_history')
        .update({
          status: 'Reactivated',
          reactivatedAt: getTodayString(),
          reactivatedBy: adminName
        })
        .eq('employeeId', employeeId);
    } catch (e) {
      // ignore
    }

    // 3. Send notification to reactivated employee
    try {
      await supabase.from('notifications').insert({
        id: `NOT-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: employeeId,
        type: 'reactivation',
        title: 'Account Reactivated',
        message: `Your account has been reactivated by Admin ${adminName}. Welcome back!`,
        date: new Date().toISOString(),
        read: false
      });
    } catch (e) {
      // ignore
    }

    window.dispatchEvent(new Event('database_updated'));
    return { success: true, user };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// 10. Calculate Leave Days helper
export const calculateLeaveDays = (startDate, endDate, leaveType = 'Casual Leave') => {
  if (!startDate || !endDate) return 1;
  if (leaveType === 'Half-Day Leave') return 0.5;

  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end < start) return 0;

  const diffTime = Math.abs(end - start);
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

// 11. Seed dynamic sample leave applications if Supabase table is fresh
export const seedSampleLeaveApplications = () => {
  const today = new Date();
  const sample = [
    {
      id: 'LV-SAMPLE-001',
      employeeId: 'EMP-006',
      employeeName: 'Pavithraa',
      department: 'Quality Assurance',
      role: 'member',
      leaveType: 'Sick / Medical Leave',
      startDate: formatLocalDate(new Date(today.getTime() + 86400000 * 3)),
      endDate: formatLocalDate(new Date(today.getTime() + 86400000 * 4)),
      totalDays: 2,
      reason: 'Scheduled medical health checkup and recovery period.',
      emergencyContact: '+91 98765 43210',
      handoverTo: 'Siva',
      status: 'Approved',
      adminRemarks: 'Approved. Please coordinate with QA lead before leave.',
      appliedAt: new Date(today.getTime() - 86400000 * 2).toISOString(),
      reviewedBy: 'Admin',
      reviewedAt: new Date(today.getTime() - 86400000 * 1).toISOString()
    },
    {
      id: 'LV-SAMPLE-002',
      employeeId: 'EMP-017',
      employeeName: 'Logesh',
      department: 'Engineering',
      role: 'member',
      leaveType: 'Casual Leave',
      startDate: formatLocalDate(new Date(today.getTime() + 86400000 * 6)),
      endDate: formatLocalDate(new Date(today.getTime() + 86400000 * 8)),
      totalDays: 3,
      reason: 'Attending family wedding ceremony out of town.',
      emergencyContact: '+91 98451 23456',
      handoverTo: 'Gowrishankar',
      status: 'Pending',
      adminRemarks: '',
      appliedAt: new Date(today.getTime() - 86400000 * 1).toISOString(),
      reviewedBy: null,
      reviewedAt: null
    },
    {
      id: 'LV-SAMPLE-003',
      employeeId: 'EMP-003',
      employeeName: 'Siva',
      department: 'Engineering',
      role: 'member',
      leaveType: 'Earned / Annual Leave',
      startDate: formatLocalDate(new Date(today.getTime() + 86400000 * 12)),
      endDate: formatLocalDate(new Date(today.getTime() + 86400000 * 16)),
      totalDays: 5,
      reason: 'Annual family vacation trip to hill station.',
      emergencyContact: '+91 91234 56780',
      handoverTo: 'Logesh',
      status: 'Pending',
      adminRemarks: '',
      appliedAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null
    }
  ];
  return sample;
};

// Helper to remove any duplicate leave applications
export const deduplicateLeaveApplications = (apps = []) => {
  if (!Array.isArray(apps)) return [];
  const seenIds = new Set();
  const seenKeys = new Set();
  const unique = [];

  for (const app of apps) {
    if (!app || !app.id) continue;
    // Composite key to catch identical submissions
    const key = `${app.employeeId}_${app.startDate}_${app.endDate}_${app.leaveType}_${app.status}`;
    if (!seenIds.has(app.id) && !seenKeys.has(key)) {
      seenIds.add(app.id);
      seenKeys.add(key);
      unique.push(app);
    }
  }
  return unique;
};

// 12. Get Leave Applications (With Automatic Deduplication)
export const getLeaveApplications = async (employeeId = null) => {
  if (!localLeaveApplicationsCache) {
    try {
      const saved = localStorage.getItem('nexora_leave_applications_cache');
      if (saved) {
        localLeaveApplicationsCache = deduplicateLeaveApplications(JSON.parse(saved));
      }
    } catch (e) {}
  }

  // Fetch Supabase in background
  const fetchSupabase = async () => {
    try {
      let query = supabase
        .from('leave_applications')
        .select('*')
        .order('appliedAt', { ascending: false });

      if (employeeId) {
        query = query.eq('employeeId', employeeId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const cleaned = deduplicateLeaveApplications(data);
        if (!employeeId) {
          localLeaveApplicationsCache = cleaned;
          try {
            localStorage.setItem('nexora_leave_applications_cache', JSON.stringify(cleaned));
          } catch (e) {}
        }
      }
    } catch (err) {}
  };

  fetchSupabase();

  if (localLeaveApplicationsCache && localLeaveApplicationsCache.length > 0) {
    const deduplicated = deduplicateLeaveApplications(localLeaveApplicationsCache);
    localLeaveApplicationsCache = deduplicated;
    return employeeId 
      ? deduplicated.filter(l => l.employeeId === employeeId)
      : deduplicated;
  }

  // Fallback to initial seed if empty
  if (!localLeaveApplicationsCache || localLeaveApplicationsCache.length === 0) {
    localLeaveApplicationsCache = deduplicateLeaveApplications(seedSampleLeaveApplications());
    try {
      localStorage.setItem('nexora_leave_applications_cache', JSON.stringify(localLeaveApplicationsCache));
    } catch (e) {}
  }

  return employeeId 
    ? localLeaveApplicationsCache.filter(l => l.employeeId === employeeId)
    : localLeaveApplicationsCache;
};

// 13. Submit Leave Application (Staff / Employee with Duplicate Prevention)
export const applyForLeave = async (applicationData) => {
  try {
    const totalDays = calculateLeaveDays(
      applicationData.startDate, 
      applicationData.endDate, 
      applicationData.leaveType
    );

    // Prevent duplicate pending applications for the same employee and overlapping dates
    if (localLeaveApplicationsCache && localLeaveApplicationsCache.length > 0) {
      const isDuplicate = localLeaveApplicationsCache.some(
        app => app.employeeId === applicationData.employeeId &&
               app.startDate === applicationData.startDate &&
               app.endDate === applicationData.endDate &&
               app.status === 'Pending'
      );

      if (isDuplicate) {
        return { success: false, error: 'A pending leave application already exists for this date range.' };
      }
    }

    const applicationId = `LV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newApplication = {
      id: applicationId,
      employeeId: applicationData.employeeId,
      employeeName: applicationData.employeeName,
      department: applicationData.department || 'Engineering',
      role: applicationData.role || 'member',
      leaveType: applicationData.leaveType || 'Casual Leave',
      startDate: applicationData.startDate,
      endDate: applicationData.endDate,
      totalDays: totalDays,
      reason: applicationData.reason,
      emergencyContact: applicationData.emergencyContact || '',
      handoverTo: applicationData.handoverTo || '',
      status: 'Pending',
      adminRemarks: '',
      appliedAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('leave_applications')
      .upsert(newApplication)
      .select()
      .single();

    // Cache update with deduplication
    if (!localLeaveApplicationsCache) localLeaveApplicationsCache = [];
    localLeaveApplicationsCache = deduplicateLeaveApplications([newApplication, ...localLeaveApplicationsCache]);
    try {
      localStorage.setItem('nexora_leave_applications_cache', JSON.stringify(localLeaveApplicationsCache));
    } catch (e) {}

    // Send notification to Admin
    try {
      await supabase.from('notifications').insert({
        id: `NOT-LV-${applicationId}`,
        userId: 'admin',
        type: 'leave_request',
        title: 'New Leave Application Received',
        message: `${newApplication.employeeName} (${newApplication.employeeId}) applied for ${newApplication.leaveType} from ${newApplication.startDate} to ${newApplication.endDate} (${newApplication.totalDays} day${newApplication.totalDays > 1 ? 's' : ''}).`,
        date: new Date().toISOString(),
        read: false
      });
    } catch (e) {}

    window.dispatchEvent(new Event('database_updated'));
    return { success: true, application: data || newApplication };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// 14. Update Leave Application Status (Admin Action: Approve / Reject)
export const updateLeaveApplicationStatus = async (applicationId, status, adminRemarks = '', adminUser = { name: 'Admin' }) => {
  try {
    const adminName = adminUser.name || 'Admin';
    const nowIso = new Date().toISOString();

    let targetApp = null;
    if (localLeaveApplicationsCache) {
      targetApp = localLeaveApplicationsCache.find(l => l.id === applicationId);
    }

    const updatePayload = {
      status,
      adminRemarks,
      reviewedBy: adminName,
      reviewedAt: nowIso
    };

    const { data, error } = await supabase
      .from('leave_applications')
      .update(updatePayload)
      .eq('id', applicationId)
      .select()
      .single();

    if (localLeaveApplicationsCache) {
      const idx = localLeaveApplicationsCache.findIndex(l => l.id === applicationId);
      if (idx >= 0) {
        localLeaveApplicationsCache[idx] = {
          ...localLeaveApplicationsCache[idx],
          ...updatePayload
        };
        targetApp = localLeaveApplicationsCache[idx];
        try {
          localStorage.setItem('nexora_leave_applications_cache', JSON.stringify(localLeaveApplicationsCache));
        } catch (e) {}
      }
    }

    // CRITICAL AUTOMATION: If Approved, automatically sync into attendance table for each day in range!
    if (status === 'Approved' && targetApp) {
      const start = new Date(targetApp.startDate);
      const end = new Date(targetApp.endDate);
      const current = new Date(start);

      while (current <= end) {
        const dateStr = formatLocalDate(current);
        const recordId = `ATT-${dateStr}-${targetApp.employeeId}`;

        const leaveAttendanceRecord = {
          id: recordId,
          employeeId: targetApp.employeeId,
          employeeName: targetApp.employeeName,
          department: targetApp.department || 'Engineering',
          project: 'Nexora ERP',
          role: targetApp.role || 'member',
          date: dateStr,
          checkInTime: '',
          checkOutTime: '',
          status: targetApp.leaveType === 'Half-Day Leave' ? 'Half Day' : 'Leave',
          remarks: `Approved Leave: ${targetApp.leaveType}${targetApp.reason ? ` - ${targetApp.reason}` : ''}`,
          markedBy: 'Leave Application',
          editHistory: [{
            updatedBy: adminName,
            updatedAt: nowIso,
            previousStatus: 'None',
            newStatus: targetApp.leaveType === 'Half-Day Leave' ? 'Half Day' : 'Leave',
            reason: `Approved Leave Application (${targetApp.leaveType})`
          }]
        };

        // Upsert into Supabase attendance table
        try {
          await supabase.from('attendance').upsert(leaveAttendanceRecord);
        } catch (e) {}

        // Update local attendance cache
        if (localAttendanceCache) {
          const aIdx = localAttendanceCache.findIndex(r => r.id === recordId);
          if (aIdx >= 0) localAttendanceCache[aIdx] = leaveAttendanceRecord;
          else localAttendanceCache.unshift(leaveAttendanceRecord);
          try {
            localStorage.setItem('nexora_attendance_cache', JSON.stringify(localAttendanceCache));
          } catch (e) {}
        }

        // Advance to next day
        current.setDate(current.getDate() + 1);
      }
    }

    // Send Notification to Employee
    if (targetApp) {
      try {
        await supabase.from('notifications').insert({
          id: `NOT-LV-REV-${Date.now()}`,
          userId: targetApp.employeeId,
          type: status === 'Approved' ? 'leave_approval' : 'leave_rejection',
          title: `Leave Application ${status}`,
          message: status === 'Approved' 
            ? `Your ${targetApp.leaveType} from ${targetApp.startDate} to ${targetApp.endDate} (${targetApp.totalDays} day${targetApp.totalDays > 1 ? 's' : ''}) has been approved by ${adminName}.`
            : `Your ${targetApp.leaveType} from ${targetApp.startDate} to ${targetApp.endDate} was rejected by ${adminName}.${adminRemarks ? ` Reason: ${adminRemarks}` : ''}`,
          date: nowIso,
          read: false
        });
      } catch (e) {}
    }

    window.dispatchEvent(new Event('database_updated'));
    return { success: true, application: data || targetApp };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// 15. Cancel Leave Application (Employee Action)
export const cancelLeaveApplication = async (applicationId, employeeId) => {
  try {
    const { data, error } = await supabase
      .from('leave_applications')
      .update({ status: 'Cancelled' })
      .eq('id', applicationId)
      .eq('employeeId', employeeId)
      .select()
      .single();

    if (localLeaveApplicationsCache) {
      const idx = localLeaveApplicationsCache.findIndex(l => l.id === applicationId);
      if (idx >= 0) {
        localLeaveApplicationsCache[idx].status = 'Cancelled';
        try {
          localStorage.setItem('nexora_leave_applications_cache', JSON.stringify(localLeaveApplicationsCache));
        } catch (e) {}
      }
    }

    window.dispatchEvent(new Event('database_updated'));
    return { success: true, application: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

