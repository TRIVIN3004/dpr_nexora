import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/database';

const DatabaseContext = createContext(null);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes default cache TTL
const IS_DEV = import.meta.env.DEV;

/**
 * Dev-Only Request Logger (Phase 14)
 */
const logRequest = (label, rowsCount, estimatedBytes) => {
  if (IS_DEV) {
    const kb = (estimatedBytes / 1024).toFixed(1);
    console.log(`[NETWORK_MONITOR] 📡 ${label} | Rows: ${rowsCount} | Size: ~${kb} KB | Time: ${new Date().toLocaleTimeString()}`);
  }
};

export function DatabaseProvider({ children }) {
  // In-memory cached data stores
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('nexora_users_cache');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [attendance, setAttendance] = useState(() => {
    try {
      const saved = localStorage.getItem('nexora_attendance_cache');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [attendanceSettings, setAttendanceSettings] = useState(null);

  // Cache timestamps & in-flight request tracking
  const cacheTimestamps = useRef({});
  const inFlightRequests = useRef({});

  /**
   * 1. Fetch Users with specific column selection (Excludes Base64 avatar & passwords in list)
   */
  const fetchUsers = useCallback(async (force = false) => {
    const key = 'users';
    const now = Date.now();
    if (!force && cacheTimestamps.current[key] && now - cacheTimestamps.current[key] < CACHE_TTL_MS && users.length > 0) {
      return users;
    }
    if (inFlightRequests.current[key]) return inFlightRequests.current[key];

    const promise = (async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role, department, assignedProjects, phone, mustChangePassword, avatar')
          .order('id', { ascending: true })
          .limit(100);

        if (!error && data) {
          setUsers(data);
          cacheTimestamps.current[key] = Date.now();
          try { localStorage.setItem('nexora_users_cache', JSON.stringify(data)); } catch(e){}
          logRequest('USERS_LIST', data.length, JSON.stringify(data).length);
          return data;
        }
      } catch (err) {
        console.warn("fetchUsers notice:", err);
      } finally {
        delete inFlightRequests.current[key];
      }
      return users;
    })();

    inFlightRequests.current[key] = promise;
    return promise;
  }, [users]);

  /**
   * 2. Fetch Projects (Specific columns)
   */
  const fetchProjects = useCallback(async (force = false) => {
    const key = 'projects';
    const now = Date.now();
    if (!force && cacheTimestamps.current[key] && now - cacheTimestamps.current[key] < CACHE_TTL_MS && projects.length > 0) {
      return projects;
    }
    if (inFlightRequests.current[key]) return inFlightRequests.current[key];

    const promise = (async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, status, lead, description')
          .order('id', { ascending: true })
          .limit(50);

        if (!error && data) {
          setProjects(data);
          cacheTimestamps.current[key] = Date.now();
          logRequest('PROJECTS_LIST', data.length, JSON.stringify(data).length);
          return data;
        }
      } catch (err) {
        console.warn("fetchProjects notice:", err);
      } finally {
        delete inFlightRequests.current[key];
      }
      return projects;
    })();

    inFlightRequests.current[key] = promise;
    return promise;
  }, [projects]);

  /**
   * 3. Fetch Reports (Excludes Base64 images & heavy fields from general list query!)
   */
  const fetchReports = useCallback(async (force = false) => {
    const key = 'reports';
    const now = Date.now();
    if (!force && cacheTimestamps.current[key] && now - cacheTimestamps.current[key] < 60000 && reports.length > 0) {
      return reports;
    }
    if (inFlightRequests.current[key]) return inFlightRequests.current[key];

    const promise = (async () => {
      try {
        // Optimized select: excludes images array & files JSONB from general list
        const { data, error } = await supabase
          .from('reports')
          .select('id, date, employeeName, employeeId, employeeEmail, projectName, moduleName, workStatus, hoursWorked, percentageCompleted, status, feedback, approvedBy, approvedAt, taskCompletedToday')
          .order('date', { ascending: false })
          .order('id', { ascending: false })
          .limit(100); // Capped at 100 rows per request (Phase 15)

        if (!error && data) {
          setReports(data);
          cacheTimestamps.current[key] = Date.now();
          logRequest('REPORTS_LIST', data.length, JSON.stringify(data).length);
          return data;
        }
      } catch (err) {
        console.warn("fetchReports notice:", err);
      } finally {
        delete inFlightRequests.current[key];
      }
      return reports;
    })();

    inFlightRequests.current[key] = promise;
    return promise;
  }, [reports]);

  /**
   * 4. Fetch Single Report Full Details (Lazy-loads attachments ONLY when modal opens!)
   */
  const fetchReportDetails = useCallback(async (reportId) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (!error && data) {
        logRequest(`REPORT_DETAIL [${reportId}]`, 1, JSON.stringify(data).length);
        return data;
      }
    } catch (err) {
      console.warn("fetchReportDetails notice:", err);
    }
    return null;
  }, []);

  /**
   * 5. Fetch Announcements
   */
  const fetchAnnouncements = useCallback(async (force = false) => {
    const key = 'announcements';
    const now = Date.now();
    if (!force && cacheTimestamps.current[key] && now - cacheTimestamps.current[key] < CACHE_TTL_MS && announcements.length > 0) {
      return announcements;
    }
    if (inFlightRequests.current[key]) return inFlightRequests.current[key];

    const promise = (async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('id, title, content, date, sender')
          .order('date', { ascending: false })
          .limit(30);

        if (!error && data) {
          setAnnouncements(data);
          cacheTimestamps.current[key] = Date.now();
          logRequest('ANNOUNCEMENTS_LIST', data.length, JSON.stringify(data).length);
          return data;
        }
      } catch (err) {
        console.warn("fetchAnnouncements notice:", err);
      } finally {
        delete inFlightRequests.current[key];
      }
      return announcements;
    })();

    inFlightRequests.current[key] = promise;
    return promise;
  }, [announcements]);

  /**
   * 6. Fetch Notifications
   */
  const fetchNotifications = useCallback(async (userId = null, force = false) => {
    const key = `notifications_${userId || 'all'}`;
    const now = Date.now();
    if (!force && cacheTimestamps.current[key] && now - cacheTimestamps.current[key] < 60000 && notifications.length > 0) {
      return notifications;
    }
    if (inFlightRequests.current[key]) return inFlightRequests.current[key];

    const promise = (async () => {
      try {
        let query = supabase
          .from('notifications')
          .select('id, userId, type, title, message, date, read')
          .order('date', { ascending: false })
          .limit(50);

        if (userId) query = query.eq('userId', userId);

        const { data, error } = await query;

        if (!error && data) {
          setNotifications(data);
          cacheTimestamps.current[key] = Date.now();
          logRequest('NOTIFICATIONS_LIST', data.length, JSON.stringify(data).length);
          return data;
        }
      } catch (err) {
        console.warn("fetchNotifications notice:", err);
      } finally {
        delete inFlightRequests.current[key];
      }
      return notifications;
    })();

    inFlightRequests.current[key] = promise;
    return promise;
  }, [notifications]);

  /**
   * 7. Fetch Attendance (With Date Filter, Column Selection, & Pagination)
   */
  const fetchAttendance = useCallback(async (filters = {}, force = false) => {
    const key = `attendance_${JSON.stringify(filters)}`;
    const now = Date.now();
    if (!force && cacheTimestamps.current[key] && now - cacheTimestamps.current[key] < 60000 && attendance.length > 0) {
      return attendance;
    }
    if (inFlightRequests.current[key]) return inFlightRequests.current[key];

    const promise = (async () => {
      try {
        // Optimized query: excludes editHistory JSONB and applies limit (50 per page)
        let query = supabase
          .from('attendance')
          .select('id, employeeId, employeeName, department, project, role, date, checkInTime, checkOutTime, status, remarks, markedBy')
          .order('date', { ascending: false })
          .limit(50);

        if (filters.startDate) query = query.gte('date', filters.startDate);
        if (filters.endDate) query = query.lte('date', filters.endDate);
        if (filters.employeeId) query = query.eq('employeeId', filters.employeeId);

        const { data, error } = await query;

        if (!error && data) {
          setAttendance(data);
          cacheTimestamps.current[key] = Date.now();
          try { localStorage.setItem('nexora_attendance_cache', JSON.stringify(data)); } catch(e){}
          logRequest('ATTENDANCE_LIST', data.length, JSON.stringify(data).length);
          return data;
        }
      } catch (err) {
        console.warn("fetchAttendance notice:", err);
      } finally {
        delete inFlightRequests.current[key];
      }
      return attendance;
    })();

    inFlightRequests.current[key] = promise;
    return promise;
  }, [attendance]);

  /**
   * Targeted Cache Invalidation (Phase 7)
   */
  const invalidateStore = useCallback((storeKey) => {
    if (storeKey === 'reports') {
      delete cacheTimestamps.current['reports'];
      fetchReports(true);
      fetchNotifications(null, true);
    } else if (storeKey === 'users') {
      delete cacheTimestamps.current['users'];
      fetchUsers(true);
    } else if (storeKey === 'attendance') {
      delete cacheTimestamps.current['attendance'];
      fetchAttendance({}, true);
    } else if (storeKey === 'projects') {
      delete cacheTimestamps.current['projects'];
      fetchProjects(true);
    } else if (storeKey === 'announcements') {
      delete cacheTimestamps.current['announcements'];
      fetchAnnouncements(true);
    } else {
      // Invalidate all if unspecified
      cacheTimestamps.current = {};
      fetchUsers(true);
      fetchProjects(true);
      fetchReports(true);
      fetchAnnouncements(true);
      fetchNotifications(null, true);
    }
  }, [fetchReports, fetchNotifications, fetchUsers, fetchAttendance, fetchProjects, fetchAnnouncements]);

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchProjects();
    fetchReports();
    fetchAnnouncements();
  }, [fetchUsers, fetchProjects, fetchReports, fetchAnnouncements]);

  const value = {
    users,
    projects,
    reports,
    announcements,
    notifications,
    attendance,
    fetchUsers,
    fetchProjects,
    fetchReports,
    fetchReportDetails,
    fetchAnnouncements,
    fetchNotifications,
    fetchAttendance,
    invalidateStore,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export const useDatabaseStore = () => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabaseStore must be used within a DatabaseProvider');
  }
  return ctx;
};
