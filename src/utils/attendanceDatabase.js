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

// Clean legacy fake sample data from browser storage if present
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedLeaves = localStorage.getItem('nexora_leave_applications_cache');
    if (savedLeaves && savedLeaves.includes('LV-SAMPLE')) {
      localStorage.removeItem('nexora_leave_applications_cache');
    }
  }
} catch (e) {}

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

// 3. Get Attendance Records (Paginated Fetch with Direct Supabase Sync)
export const getAttendanceRecords = async () => {
  try {
    const PAGE_SIZE = 1000;
    let allRows = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('attendance')
        .select('id, employeeId, employeeName, department, project, role, date, checkInTime, checkOutTime, status, remarks, markedBy')
        .order('date', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error || !data || data.length === 0) break;
      allRows.push(...data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    if (allRows.length > 0) {
      localAttendanceCache = allRows;
      try {
        localStorage.setItem('nexora_attendance_cache', JSON.stringify(allRows));
      } catch (e) {}
      return allRows;
    }
  } catch (err) {
    console.warn("Supabase attendance fetch note:", err);
  }

  // Fallback to cache if network/offline
  if (!localAttendanceCache) {
    try {
      const saved = localStorage.getItem('nexora_attendance_cache');
      if (saved) localAttendanceCache = JSON.parse(saved);
    } catch (e) {}
  }

  return localAttendanceCache || [];
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

    const savedRecord = (!error && data) ? data : newRecord;

    if (!localAttendanceCache) localAttendanceCache = [];
    const idx = localAttendanceCache.findIndex(r => r.id === recordId);
    if (idx >= 0) localAttendanceCache[idx] = savedRecord;
    else localAttendanceCache.unshift(savedRecord);

    try {
      localStorage.setItem('nexora_attendance_cache', JSON.stringify(localAttendanceCache));
    } catch (e) {}

    window.dispatchEvent(new Event('database_updated'));
    return { success: true, record: savedRecord };
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

    const savedRecord = (!error && data) ? data : updatedRecord;

    if (!localAttendanceCache) localAttendanceCache = [];
    const idx = localAttendanceCache.findIndex(r => r.id === recordId);
    if (idx >= 0) localAttendanceCache[idx] = savedRecord;
    else localAttendanceCache.unshift(savedRecord);

    try {
      localStorage.setItem('nexora_attendance_cache', JSON.stringify(localAttendanceCache));
    } catch (e) {}

    window.dispatchEvent(new Event('database_updated'));
    return { success: true, record: savedRecord };
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

    const savedRecord = (!error && data) ? data : recordToSave;

    if (!localAttendanceCache) localAttendanceCache = [];
    const idx = localAttendanceCache.findIndex(r => r.id === recordId);
    if (idx >= 0) localAttendanceCache[idx] = savedRecord;
    else localAttendanceCache.unshift(savedRecord);

    try {
      localStorage.setItem('nexora_attendance_cache', JSON.stringify(localAttendanceCache));
    } catch (e) {}

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
    return { success: true, record: savedRecord };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// 7. Compute Stats for a single Employee
export const calculateEmployeeStats = (employeeId, records = [], settings = localSettingsCache) => {
  const todayStr = getTodayString();
  // Filter only records up to today (ignore future leave dates for historical attendance stats)
  const empRecords = records.filter(r => r.employeeId === employeeId && r.date <= todayStr);

  let presentDays = 0;
  let lateDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let halfDays = 0;

  empRecords.forEach(r => {
    const isSunday = new Date(r.date + 'T00:00:00').getDay() === 0;
    if (r.status === 'Present') presentDays++;
    else if (r.status === 'Late') lateDays++;
    else if (r.status === 'Absent') {
      // Sundays are weekly holidays; unworked Sundays must not count as absent
      if (!isSunday) absentDays++;
    }
    else if (r.status === 'Leave') leaveDays++;
    else if (r.status === 'Half Day') halfDays++;
  });

  // 7:00 PM Daily Cutoff Check:
  // If current local time is at or after 19:00 (7 PM) on a working day (not Sunday),
  // and employee has not logged check-in or approved leave, count as absent to reduce percentage
  const now = new Date();
  const isPast7PM = now.getHours() >= 19;
  const isTodaySunday = new Date(todayStr + 'T00:00:00').getDay() === 0;
  const hasTodayRecord = empRecords.some(r => r.date === todayStr);

  if (isPast7PM && !isTodaySunday && !hasTodayRecord) {
    absentDays++;
  }

  const totalWorkingDays = Math.max(1, presentDays + lateDays + absentDays + halfDays);
  const effectivePresent = (presentDays + lateDays) + (halfDays * 0.5);

  // If no required working days yet or all days are approved leave, default to 100% compliant
  const attendancePct = (presentDays + lateDays + absentDays + halfDays === 0)
    ? 100
    : Math.min(100, Math.round((effectivePresent / totalWorkingDays) * 100));

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
    totalWorkingDays: empRecords.length + (isPast7PM && !isTodaySunday && !hasTodayRecord ? 1 : 0),
    presentDays: presentDays + lateDays,
    lateDays,
    absentDays,
    leaveDays,
    halfDays,
    attendancePct,
    indicator
  };
};

// 7.5. Automated Evening Absenteeism Processor (7:00 PM Daily Cutoff)
export const autoMarkEveningAbsences = async (users = [], existingRecords = []) => {
  const now = new Date();
  const currentHour = now.getHours();
  const isPast7PM = currentHour >= 19; // 7:00 PM cutoff

  const todayStr = getTodayString();
  const isTodaySunday = new Date(todayStr + 'T00:00:00').getDay() === 0;

  // Cutoff only applies at or after 7:00 PM and never on Sundays (Weekly Holiday)
  if (!isPast7PM || isTodaySunday) {
    return { processed: false, count: 0, newRecords: [] };
  }

  const staffUsers = users.filter(u => u.role !== 'admin' && u.status !== 'Terminated' && !u.isTerminated);
  if (staffUsers.length === 0) {
    return { processed: false, count: 0, newRecords: [] };
  }

  const recordsToUpsert = [];
  const notificationsToInsert = [];

  for (const staff of staffUsers) {
    const rec = existingRecords.find(r => r.employeeId === staff.id && r.date === todayStr);

    // If attendance is already marked (Present, Late, Leave, Half Day, Holiday), do not overwrite
    if (rec) {
      if (
        rec.status === 'Present' ||
        rec.status === 'Late' ||
        rec.status === 'Leave' ||
        rec.status === 'Half Day' ||
        rec.status === 'Holiday'
      ) {
        continue;
      }
      // If already marked as Absent today, avoid redundant updates
      if (rec.status === 'Absent') {
        continue;
      }
    }

    const absentRecord = {
      id: `ATT-${todayStr}-${staff.id}`,
      employeeId: staff.id,
      employeeName: staff.name,
      department: staff.department || 'Engineering',
      project: (staff.assignedProjects && staff.assignedProjects[0]) || 'Nexora ERP',
      role: staff.role || 'member',
      date: todayStr,
      checkInTime: '',
      checkOutTime: '',
      status: 'Absent',
      remarks: 'Auto-Marked Absent: No check-in or leave recorded by 7:00 PM cutoff',
      markedBy: 'System Auto-Cutoff (7:00 PM)',
      editHistory: []
    };

    recordsToUpsert.push(absentRecord);

    notificationsToInsert.push({
      id: `NOT-ABS-${todayStr}-${staff.id}`,
      userId: staff.id,
      type: 'attendance_cutoff',
      title: 'Marked Absent (7:00 PM Cutoff)',
      message: `You were marked absent for ${todayStr} because no check-in or leave was logged before 7:00 PM. Your attendance percentage has been updated.`,
      date: new Date().toISOString(),
      read: false
    });
  }

  if (recordsToUpsert.length === 0) {
    return { processed: false, count: 0, newRecords: [] };
  }

  try {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(recordsToUpsert)
      .select();

    if (error) {
      console.warn('Auto-mark absent upsert note:', error.message);
    }

    try {
      await supabase.from('notifications').insert(notificationsToInsert);
    } catch (e) {
      // ignore duplicate notification error
    }

    if (!localAttendanceCache) localAttendanceCache = [];
    recordsToUpsert.forEach(rec => {
      const idx = localAttendanceCache.findIndex(r => r.id === rec.id);
      if (idx >= 0) localAttendanceCache[idx] = rec;
      else localAttendanceCache.unshift(rec);
    });

    try {
      localStorage.setItem('nexora_attendance_cache', JSON.stringify(localAttendanceCache));
    } catch (e) {}

    window.dispatchEvent(new Event('database_updated'));
    return { processed: true, count: recordsToUpsert.length, newRecords: recordsToUpsert };
  } catch (err) {
    console.error('autoMarkEveningAbsences error:', err);
    return { processed: false, count: 0, newRecords: [] };
  }
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

// 10. Calculate Leave Days helper (Sundays automatically excluded as weekly holidays)
export const calculateLeaveDays = (startDate, endDate, leaveType = 'Casual Leave') => {
  if (!startDate || !endDate) return 1;
  if (leaveType === 'Half-Day Leave') return 0.5;

  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  
  if (end < start) return 0;

  // Count business days excluding Sundays (Sunday = Weekly Holiday)
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (cur.getDay() !== 0) { // 0 = Sunday
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count === 0 && start.getDay() === 0 ? 0 : Math.max(1, count);
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

// 12. Get Leave Applications (Direct Supabase Sync)
export const getLeaveApplications = async (employeeId = null) => {
  try {
    let query = supabase
      .from('leave_applications')
      .select('*')
      .order('appliedAt', { ascending: false });

    if (employeeId) {
      query = query.eq('employeeId', employeeId);
    }

    const { data, error } = await query;
    if (!error && data) {
      // Filter out any sample applications if previously cached
      const cleaned = data.filter(d => !d.id?.startsWith('LV-SAMPLE'));
      if (!employeeId) {
        localLeaveApplicationsCache = cleaned;
        try {
          localStorage.setItem('nexora_leave_applications_cache', JSON.stringify(cleaned));
        } catch (e) {}
      }
      return employeeId 
        ? cleaned.filter(l => l.employeeId === employeeId)
        : cleaned;
    }
  } catch (err) {
    console.warn("getLeaveApplications fetch notice:", err);
  }

  // Fallback to cache if network/offline
  if (!localLeaveApplicationsCache) {
    try {
      const saved = localStorage.getItem('nexora_leave_applications_cache');
      if (saved) {
        localLeaveApplicationsCache = deduplicateLeaveApplications(JSON.parse(saved))
          .filter(d => !d.id?.startsWith('LV-SAMPLE'));
      }
    } catch (e) {}
  }

  if (localLeaveApplicationsCache && localLeaveApplicationsCache.length > 0) {
    return employeeId 
      ? localLeaveApplicationsCache.filter(l => l.employeeId === employeeId)
      : localLeaveApplicationsCache;
  }

  return [];
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
        // Skip Sundays as weekly holidays
        if (current.getDay() === 0) {
          current.setDate(current.getDate() + 1);
          continue;
        }

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
    } else if (status === 'Rejected' && targetApp) {
      // If rejected, clean up any previously synced attendance records in that date range
      try {
        await supabase
          .from('attendance')
          .delete()
          .eq('employeeId', targetApp.employeeId)
          .eq('markedBy', 'Leave Application')
          .gte('date', targetApp.startDate)
          .lte('date', targetApp.endDate);
      } catch (e) {}

      if (localAttendanceCache) {
        localAttendanceCache = localAttendanceCache.filter(r => 
          !(r.employeeId === targetApp.employeeId && r.markedBy === 'Leave Application' && r.date >= targetApp.startDate && r.date <= targetApp.endDate)
        );
        try {
          localStorage.setItem('nexora_attendance_cache', JSON.stringify(localAttendanceCache));
        } catch (e) {}
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
    const targetApp = localLeaveApplicationsCache?.find(l => l.id === applicationId);

    const { data, error } = await supabase
      .from('leave_applications')
      .update({ status: 'Cancelled' })
      .eq('id', applicationId)
      .eq('employeeId', employeeId)
      .select()
      .single();

    if (error) throw error;

    // Clean up any synced attendance leave records
    if (targetApp && targetApp.startDate && targetApp.endDate) {
      try {
        await supabase
          .from('attendance')
          .delete()
          .eq('employeeId', employeeId)
          .eq('markedBy', 'Leave Application')
          .gte('date', targetApp.startDate)
          .lte('date', targetApp.endDate);
      } catch (e) {}

      if (localAttendanceCache) {
        localAttendanceCache = localAttendanceCache.filter(r => 
          !(r.employeeId === employeeId && r.markedBy === 'Leave Application' && r.date >= targetApp.startDate && r.date <= targetApp.endDate)
        );
        try {
          localStorage.setItem('nexora_attendance_cache', JSON.stringify(localAttendanceCache));
        } catch (e) {}
      }
    }

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

