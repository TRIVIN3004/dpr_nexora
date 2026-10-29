import { createClient } from '@supabase/supabase-js';
import { 
  getPersonalEmail, 
  savePersonalEmail, 
  bulkUpdatePersonalEmails,
  sendEmailAlert, 
  generateDprReviewEmail, 
  generateWelcomeEmail 
} from './emailService';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
console.log(JSON.stringify(import.meta.env.VITE_SUPABASE_URL));
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Nexora DPR: Supabase configuration is missing. Please define VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment variables.");
}

// Sanitize URL if it contains rest/v1/ at the end to prevent rest/v1/rest/v1 issues
supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "");

console.log("Supabase URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

console.log("DATABASE VERSION 2.0");
console.log("Supabase URL =", supabaseUrl);

// Session management helpers (using browser sessionStorage directly)
export const getCurrentUser = () => {
  try {
    const user = sessionStorage.getItem("nexora_current_user");
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error("Error reading current user session:", e);
    return null;
  }
};

export const setCurrentUser = (user) => {
  if (user) {
    sessionStorage.setItem("nexora_current_user", JSON.stringify(user));
  } else {
    sessionStorage.removeItem("nexora_current_user");
  }
};

// Date formatting helpers that guarantee accurate local timezone date strings (YYYY-MM-DD)
export const formatLocalDate = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayString = () => formatLocalDate(new Date());

export const initDatabase = () => {
  // No-op for Supabase since tables are initialized on server-side.
};

// Global cloud personal email synchronization
export const fetchCloudPersonalEmails = async () => {
  try {
    const { data } = await supabase
      .from('attendance_reports')
      .select('filters')
      .eq('id', 'SYS_CONFIG_EMAILS')
      .maybeSingle();

    if (data && data.filters) {
      bulkUpdatePersonalEmails(data.filters);
      return data.filters;
    }
  } catch (e) {
    console.warn('Error fetching cloud personal emails:', e);
  }
  return {};
};

export const syncPersonalEmailToCloud = async (mapping = {}) => {
  try {
    const current = await fetchCloudPersonalEmails();
    const merged = { ...current, ...mapping };
    await supabase
      .from('attendance_reports')
      .upsert({
        id: 'SYS_CONFIG_EMAILS',
        reportType: 'CONFIG',
        filters: merged,
        generatedAt: new Date().toISOString(),
        generatedBy: 'System'
      });
    bulkUpdatePersonalEmails(merged);
    return merged;
  } catch (e) {
    console.warn('Error syncing cloud personal emails:', e);
  }
};

export const loginUser = async (email, password) => {
  const cleanInput = (email || '').trim();
  const cleanPassword = (password || '').trim();

  try {
    let result = await supabase
      .from("users")
      .select("*")
      .ilike("email", cleanInput);

    if (result.error || !result.data || !result.data.length) {
      result = await supabase
        .from("users")
        .select("*")
        .ilike("id", cleanInput);
    }

    if (result.error) {
      console.error(result.error);
      return {
        success: false,
        error: result.error.message,
      };
    }

    if (!result.data.length) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const user = result.data[0];

    console.log(user);

    if (user.password !== password) {
      return {
        success: false,
        error: "Wrong password",
      };
    }

    if (user.status === 'Terminated' || user.isTerminated) {
      return {
        success: false,
        error: "Your account has been deactivated due to attendance below the company policy. Please contact the administrator."
      };
    }

    setCurrentUser(user);

    return {
      success: true,
      user,
    };
  } catch (e) {
    console.error(e);

    return {
      success: false,
      error: e.message,
    };
  }
};

export const simulatePasswordReset = async (email) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();
    
    if (error || !data) {
      return { success: false, error: "Email address not found." };
    }
    return { success: true, message: `Password reset link sent to ${email} (simulated).` };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const DEFAULT_FALLBACK_DATABASE = {
  users: [
    { id: 'USR-001', name: 'Admin User', email: 'admin@nexora.com', personalEmail: 'trivin.nexora@gmail.com', role: 'admin', assignedProjects: ['All'] },
    { id: 'USR-002', name: 'Alex Johnson', email: 'alex@nexora.com', personalEmail: 'alex.johnson.personal@gmail.com', role: 'member', assignedProjects: ['Project Nexora'] },
    { id: 'USR-003', name: 'Sarah Miller', email: 'sarah@nexora.com', personalEmail: 'sarah.miller.personal@gmail.com', role: 'member', assignedProjects: ['Cloud Infrastructure'] }
  ],
  projects: [
    { id: 'PRJ-001', name: 'Project Nexora', status: 'Active', description: 'Enterprise DPR System' },
    { id: 'PRJ-002', name: 'Cloud Infrastructure', status: 'Active', description: 'DevOps & Migration' }
  ],
  reports: [
    {
      id: 'REP-1001',
      date: new Date().toISOString().split('T')[0],
      employeeName: 'Alex Johnson',
      employeeEmail: 'alex@nexora.com',
      projectName: 'Project Nexora',
      moduleName: 'Frontend Dashboard',
      hoursWorked: 8,
      percentageCompleted: 85,
      workStatus: 'In Progress',
      taskCompletedToday: 'Optimized dashboard rendering and chart responsiveness.',
      challengesFaced: 'None',
      status: 'Approved',
      feedback: 'Great progress!'
    }
  ],
  announcements: [
    {
      id: 'ANN-001',
      title: 'System Performance Updated',
      content: 'The Nexora DPR dashboard performance updates have been deployed.',
      sender: 'Admin',
      date: new Date().toISOString().split('T')[0]
    }
  ],
  notifications: []
};

export const getDatabase = async () => {
  try {
    const [usersRes, projectsRes, reportsRes, announcementsRes, notificationsRes] = await Promise.all([
      supabase.from('users').select('id, name, email, role, department, assignedProjects, phone, mustChangePassword, avatar').order('id', { ascending: true }).limit(100),
      supabase.from('projects').select('id, name, status, lead, description').order('id', { ascending: true }).limit(50),
      supabase.from('reports').select('id, date, employeeName, employeeId, employeeEmail, projectName, moduleName, workStatus, hoursWorked, percentageCompleted, status, feedback, approvedBy, approvedAt, taskCompletedToday').order('date', { ascending: false }).order('id', { ascending: false }).limit(100),
      supabase.from('announcements').select('id, title, content, date, sender').order('date', { ascending: false }).order('id', { ascending: false }).limit(30),
      supabase.from('notifications').select('id, userId, type, title, message, date, read').order('date', { ascending: false }).limit(50)
    ]);

    if (usersRes.error || projectsRes.error || reportsRes.error || announcementsRes.error || notificationsRes.error) {
      console.warn("Supabase API notice (Quota/Network restricted): Using fallback cache/data", {
        usersErr: usersRes.error?.message,
        projectsErr: projectsRes.error?.message
      });
      const cached = localStorage.getItem('nexora_dashboard_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.users) return parsed;
        } catch(e){}
      }
      return DEFAULT_FALLBACK_DATABASE;
    }

    const data = {
      users: (usersRes.data || []).map(u => ({ ...u, personalEmail: getPersonalEmail(u) })),
      projects: projectsRes.data || [],
      reports: reportsRes.data || [],
      announcements: announcementsRes.data || [],
      notifications: notificationsRes.data || []
    };
    try { localStorage.setItem('nexora_dashboard_cache', JSON.stringify(data)); } catch(e){}
    return data;
  } catch (err) {
    console.warn("Supabase fetch exception, loading offline fallback:", err);
    const cached = localStorage.getItem('nexora_dashboard_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.users) return parsed;
      } catch(e){}
    }
    return DEFAULT_FALLBACK_DATABASE;
  }
};

export const getReportDetails = async (reportId) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !data) return null;
    return data;
  } catch (e) {
    return null;
  }
};

export const submitDailyReport = async (reportData) => {
  try {
    const newReportId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    const todayStr = getTodayString();
    const newReport = {
      id: newReportId,
      date: todayStr,
      status: "Pending",
      feedback: "",
      approvedBy: "",
      approvedAt: "",
      ...reportData
    };
    
    const newNotification = {
      id: `NOT-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: "EMP-001",
      type: "submission",
      title: "New Report Submitted",
      message: `${reportData.employeeName} submitted a DPR for project [${reportData.projectName}].`,
      date: new Date().toISOString(),
      read: false
    };

    const [reportInsert, notifInsert] = await Promise.all([
      supabase.from('reports').insert(newReport),
      supabase.from('notifications').insert(newNotification)
    ]);

    if (reportInsert.error) throw reportInsert.error;
    if (notifInsert.error) throw notifInsert.error;

    return { success: true, report: newReport };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const updateDailyReport = async (reportId, reportData) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('reports')
      .select('status')
      .eq('id', reportId)
      .single();
    
    if (fetchErr || !existing) {
      return { success: false, error: "Report not found." };
    }
    
    if (existing.status !== "Pending") {
      return { success: false, error: "Reviewed reports cannot be edited." };
    }

    const { data, error } = await supabase
      .from('reports')
      .update(reportData)
      .eq('id', reportId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, report: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const reviewReportStatus = async (reportId, status, feedback, adminName) => {
  try {
    const todayStr = getTodayString();
    const updatedFields = {
      status,
      feedback,
      approvedBy: adminName,
      approvedAt: todayStr
    };

    const { data: report, error: updateErr } = await supabase
      .from('reports')
      .update(updatedFields)
      .eq('id', reportId)
      .select()
      .single();

    if (updateErr || !report) {
      throw updateErr || new Error("Report not found");
    }

    const { data: employee, error: empErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', report.employeeEmail)
      .single();

    if (!empErr && employee) {
      const newNotification = {
        id: `NOT-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: employee.id,
        type: "status_update",
        title: status === "Approved" ? "Report Approved" : "Report Rejected",
        message: `${adminName} reviewed your report for [${report.projectName}]. Status: ${status}.${feedback ? ` Feedback: "${feedback}"` : ""}`,
        date: new Date().toISOString(),
        read: false
      };

      await supabase.from('notifications').insert(newNotification);

      // Dispatch automated Resend email alert to employee's personal mail ID
      try {
        const targetPersonalEmail = getPersonalEmail(employee || { email: report.employeeEmail, id: report.employeeId });
        if (targetPersonalEmail) {
          const html = generateDprReviewEmail({
            employeeName: report.employeeName,
            projectName: report.projectName,
            moduleName: report.moduleName,
            status,
            feedback,
            adminName
          });
          sendEmailAlert({
            to: targetPersonalEmail,
            recipientName: report.employeeName,
            subject: `Nexora DPR Status: ${report.projectName} [${status}]`,
            html,
            type: 'dpr_status',
            metadata: { reportId, status, projectName: report.projectName }
          }).catch(e => console.warn('Async DPR email alert dispatch warning:', e));
        }
      } catch (mailErr) {
        console.warn('Could not dispatch DPR review email alert via Resend:', mailErr);
      }
    }

    return { success: true, report };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const addTeamMember = async (memberData) => {
  try {
    const newId = memberData.id || `EMP-${Math.floor(100 + Math.random() * 900)}`;
    const personalEmail = memberData.personalEmail || getPersonalEmail({ id: newId, email: memberData.email });
    
    // Persist personal email mapping locally and to cloud
    if (personalEmail) {
      savePersonalEmail(newId, personalEmail);
      syncPersonalEmailToCloud({ [newId]: personalEmail, [memberData.email]: personalEmail }).catch(() => {});
    }

    const newMember = {
      id: newId,
      password: "123456",
      mustChangePassword: true,
      avatar: memberData.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      role: "member",
      ...memberData,
      personalEmail
    };

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', memberData.email)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "A user with this email already exists." };
    }

    const newNotification = {
      id: `NOT-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: newId,
      type: "assignment",
      title: "Account Created",
      message: `Welcome ${newMember.name}! Your account has been setup. Please change your password on first login.`,
      date: new Date().toISOString(),
      read: false
    };

    // Strip personalEmail if DB schema column not present to avoid Supabase schema errors
    const { personalEmail: _, personal_email: __, ...dbMember } = newMember;
    let userInsert;
    try {
      const payloadWithCols = {
        ...newMember,
        personalEmail: personalEmail || undefined,
        personal_email: personalEmail || undefined
      };
      userInsert = await supabase.from('users').insert(payloadWithCols);
      if (userInsert.error) {
        userInsert = await supabase.from('users').insert({ ...newMember, personalEmail: personalEmail || undefined });
        if (userInsert.error) {
          userInsert = await supabase.from('users').insert(dbMember);
        }
      }
    } catch (e) {
      userInsert = await supabase.from('users').insert(dbMember);
    }

    const notifInsert = await supabase.from('notifications').insert(newNotification);

    if (userInsert.error) throw userInsert.error;
    if (notifInsert.error) throw notifInsert.error;

    // Dispatch welcome credentials alert to personal email via Resend
    if (personalEmail) {
      try {
        const welcomeHtml = generateWelcomeEmail({
          employeeName: newMember.name,
          employeeId: newId,
          workEmail: newMember.email,
          tempPassword: newMember.password,
          personalEmail
        });
        sendEmailAlert({
          to: personalEmail,
          recipientName: newMember.name,
          subject: 'Welcome to Nexora Portal - Your Account Credentials',
          html: welcomeHtml,
          type: 'account_created',
          metadata: { employeeId: newId }
        }).catch(e => console.warn('Async welcome email alert warning:', e));
      } catch (mErr) {
        console.warn('Could not dispatch welcome email via Resend:', mErr);
      }
    }

    return { success: true, member: newMember };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const editTeamMember = async (memberId, memberData) => {
  try {
    if (memberData.email) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', memberData.email)
        .neq('id', memberId)
        .maybeSingle();

      if (existing) {
        return { success: false, error: "Email already in use." };
      }
    }

    if (memberData.personalEmail) {
      savePersonalEmail(memberId, memberData.personalEmail);
      syncPersonalEmailToCloud({ [memberId]: memberData.personalEmail, [memberData.email]: memberData.personalEmail }).catch(() => {});
    }

    const { personalEmail: _, personal_email: __, ...dbPayload } = memberData;
    const cleanPersonal = memberData.personalEmail ? memberData.personalEmail.trim() : '';
    let res;
    try {
      const payloadWithCols = {
        ...dbPayload,
        ...(cleanPersonal ? { personalEmail: cleanPersonal, personal_email: cleanPersonal } : {})
      };
      res = await supabase
        .from('users')
        .update(payloadWithCols)
        .eq('id', memberId)
        .select()
        .single();
      if (res.error) {
        res = await supabase
          .from('users')
          .update({ ...dbPayload, ...(cleanPersonal ? { personalEmail: cleanPersonal } : {}) })
          .eq('id', memberId)
          .select()
          .single();
        if (res.error) {
          res = await supabase
            .from('users')
            .update(dbPayload)
            .eq('id', memberId)
            .select()
            .single();
        }
      }
    } catch (e) {
      res = await supabase
        .from('users')
        .update(dbPayload)
        .eq('id', memberId)
        .select()
        .single();
    }

    if (res.error) throw res.error;
    const data = { ...res.data, personalEmail: memberData.personalEmail || getPersonalEmail(res.data) };

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === memberId) {
      setCurrentUser(data);
    }

    return { success: true, member: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};


export const deleteTeamMember = async (memberId) => {
  try {
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', memberId)
      .single();

    if (fetchErr || !user) {
      return { success: false, error: "Member not found." };
    }

    if (user.role === "admin") {
      return { success: false, error: "Cannot delete admin users." };
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const addProject = async (projectData) => {
  try {
    const newProj = {
      id: `PROJ-${Math.floor(10 + Math.random() * 90)}`,
      status: "In Progress",
      ...projectData
    };

    const { error } = await supabase.from('projects').insert(newProj);
    if (error) throw error;

    return { success: true, project: newProj };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const deleteProject = async (projectId) => {
  try {
    const { data: project, error: fetchErr } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    if (fetchErr || !project) {
      return { success: false, error: "Project not found." };
    }

    const { error: deleteErr } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteErr) throw deleteErr;

    const { data: allUsers } = await supabase.from('users').select('id, assignedProjects');
    if (allUsers) {
      const updates = allUsers.map(async (u) => {
        if (u.assignedProjects && u.assignedProjects.includes(project.name)) {
          let nextProj = u.assignedProjects.filter(p => p !== project.name);
          if (nextProj.length === 0) {
            nextProj = ['Nexora ERP'];
          }
          return supabase
            .from('users')
            .update({ assignedProjects: nextProj })
            .eq('id', u.id);
        }
      });
      await Promise.all(updates.filter(Boolean));
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const editProject = async (projectId, projectData) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, project: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const deleteReport = async (reportId) => {
  try {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const postAnnouncement = async (title, content, senderName) => {
  try {
    const newAnn = {
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      sender: senderName
    };

    const { data: insertedAnn, error: annErr } = await supabase
      .from('announcements')
      .insert(newAnn)
      .select()
      .single();

    if (annErr) throw annErr;

    const { data: allUsers } = await supabase.from('users').select('id');
    if (allUsers) {
      const notificationsToInsert = allUsers.map(u => ({
        id: `NOT-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: u.id,
        type: "announcement",
        title: "New Announcement",
        message: `${senderName} posted: "${title}"`,
        date: new Date().toISOString(),
        read: false
      }));

      await supabase.from('notifications').insert(notificationsToInsert);
    }

    return { success: true, announcement: insertedAnn };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const markNotificationRead = async (notifId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notifId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false };
  }
};

export const markAllNotificationsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('userId', userId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false };
  }
};
