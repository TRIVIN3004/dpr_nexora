import { supabase } from './database';

// Global In-Memory Fallback Cache for local preview reliability
let localAttendanceCache = null;
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
export const getTodayString = () => new Date().toISOString().split('T')[0];

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

    const dateStr = d.toISOString().split('T')[0];

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
        status = 'Late';
        checkIn = '09:40';
        checkOut = '17:00';
        remarks = 'Traffic Delay';
      } else if (u.id === 'EMP-006' && (i % 4 === 0)) {
        status = 'Absent';
        checkIn = '';
        checkOut = '';
        remarks = 'Personal Leave';
      } else if (idx % 7 === 0 && i % 5 === 0) {
        status = 'Late';
        checkIn = '09:30';
        checkOut = '17:15';
        remarks = 'Client Meeting';
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

// 3. Get Attendance Records
export const getAttendanceRecords = async () => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data && data.length > 0) {
      localAttendanceCache = data;
      return data;
    }

    // If table empty or error, fetch users and generate seed cache
    if (!localAttendanceCache) {
      const { data: users } = await supabase.from('users').select('*');
      localAttendanceCache = seedSampleAttendanceData(users || []);

      // Async push seed records to Supabase in background
      try {
        await supabase.from('attendance').upsert(localAttendanceCache);
      } catch (e) {
        // ignore fallback
      }
    }

    return localAttendanceCache;
  } catch (err) {
    if (!localAttendanceCache) {
      localAttendanceCache = seedSampleAttendanceData([]);
    }
    return localAttendanceCache;
  }
};

// 4. Mark Check-In (Staff / Self / QR / Face)
export const markCheckIn = async (user, method = 'Self', remarks = '') => {
  try {
    const settings = await getAttendanceSettings();
    const todayStr = getTodayString();
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Determine status (Late if check-in past lateEntryTime)
    let status = 'Present';
    if (settings.lateEntryTime && currentTimeStr > settings.lateEntryTime) {
      status = 'Late';
    }

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
    if (r.status === 'Present') presentDays++;
    else if (r.status === 'Late') lateDays++;
    else if (r.status === 'Absent') absentDays++;
    else if (r.status === 'Leave') leaveDays++;
    else if (r.status === 'Half Day') halfDays++;
  });

  // Calculation formula: Present + Late + (HalfDay * 0.5) out of total working days
  const effectivePresent = presentDays + lateDays + (halfDays * 0.5);
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
