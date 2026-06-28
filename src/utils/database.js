import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

export const initDatabase = () => {
  // No-op for Supabase since tables are initialized on server-side.
};

export const loginUser = async (email, password) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) {
      return { success: false, error: "Invalid email or password." };
    }
    
    // Plain text password comparison matching existing behavior
    if (data.password === password) {
      setCurrentUser(data);
      return { success: true, user: data };
    }
    return { success: false, error: "Invalid email or password." };
  } catch (err) {
    return { success: false, error: err.message };
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

export const getDatabase = async () => {
  const [usersRes, projectsRes, reportsRes, announcementsRes, notificationsRes] = await Promise.all([
    supabase.from('users').select('*').order('id', { ascending: true }),
    supabase.from('projects').select('*').order('id', { ascending: true }),
    supabase.from('reports').select('*').order('date', { ascending: false }).order('id', { ascending: false }),
    supabase.from('announcements').select('*').order('date', { ascending: false }).order('id', { ascending: false }),
    supabase.from('notifications').select('*').order('date', { ascending: false })
  ]);

  if (usersRes.error) throw usersRes.error;
  if (projectsRes.error) throw projectsRes.error;
  if (reportsRes.error) throw reportsRes.error;
  if (announcementsRes.error) throw announcementsRes.error;
  if (notificationsRes.error) throw notificationsRes.error;

  return {
    users: usersRes.data || [],
    projects: projectsRes.data || [],
    reports: reportsRes.data || [],
    announcements: announcementsRes.data || [],
    notifications: notificationsRes.data || []
  };
};

export const submitDailyReport = async (reportData) => {
  try {
    const newReportId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    const todayStr = new Date().toISOString().split('T')[0];
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
    const todayStr = new Date().toISOString().split('T')[0];
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
    }

    return { success: true, report };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const addTeamMember = async (memberData) => {
  try {
    const newId = memberData.id || `EMP-${Math.floor(100 + Math.random() * 900)}`;
    const newMember = {
      id: newId,
      password: "123456",
      mustChangePassword: true,
      avatar: memberData.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      role: "member",
      ...memberData
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

    const [userInsert, notifInsert] = await Promise.all([
      supabase.from('users').insert(newMember),
      supabase.from('notifications').insert(newNotification)
    ]);

    if (userInsert.error) throw userInsert.error;
    if (notifInsert.error) throw notifInsert.error;

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

    const { data, error } = await supabase
      .from('users')
      .update(memberData)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;

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

    const { data: allUsers } = await supabase.from('users').select('*');
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
