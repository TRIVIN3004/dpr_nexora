import { createClient } from '@supabase/supabase-js';
import * as mockDb from './mockDatabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabasePublishableKey) 
  : null;

if (!isSupabaseConfigured) {
  console.warn("Nexora DPR: Supabase environment variables are missing. Using local storage mock database.");
} else {
  console.log("Nexora DPR: Successfully initialized Supabase database connection.");
}

// Re-export session-specific methods synchronously from local storage helper
export { getCurrentUser, setCurrentUser } from './mockDatabase';

export const initDatabase = () => {
  if (!isSupabaseConfigured) {
    mockDb.initDatabase();
  }
};

export const loginUser = async (email, password) => {
  if (isSupabaseConfigured) {
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
        mockDb.setCurrentUser(data);
        return { success: true, user: data };
      }
      return { success: false, error: "Invalid email or password." };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return mockDb.loginUser(email, password);
};

export const simulatePasswordReset = async (email) => {
  if (isSupabaseConfigured) {
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
  }
  return mockDb.simulatePasswordReset(email);
};

export const getDatabase = async () => {
  if (isSupabaseConfigured) {
    try {
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
    } catch (err) {
      console.error("Failed to fetch database from Supabase, falling back:", err);
      return mockDb.getDatabase();
    }
  }
  return mockDb.getDatabase();
};

export const submitDailyReport = async (reportData) => {
  if (isSupabaseConfigured) {
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
  }
  return mockDb.submitDailyReport(reportData);
};

export const updateDailyReport = async (reportId, reportData) => {
  if (isSupabaseConfigured) {
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
  }
  return mockDb.updateDailyReport(reportId, reportData);
};

export const reviewReportStatus = async (reportId, status, feedback, adminName) => {
  if (isSupabaseConfigured) {
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
  }
  return mockDb.reviewReportStatus(reportId, status, feedback, adminName);
};

export const addTeamMember = async (memberData) => {
  if (isSupabaseConfigured) {
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
  }
  return mockDb.addTeamMember(memberData);
};

export const editTeamMember = async (memberId, memberData) => {
  if (isSupabaseConfigured) {
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

      const currentUser = mockDb.getCurrentUser();
      if (currentUser && currentUser.id === memberId) {
        mockDb.setCurrentUser(data);
      }

      return { success: true, member: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return mockDb.editTeamMember(memberId, memberData);
};

export const deleteTeamMember = async (memberId) => {
  if (isSupabaseConfigured) {
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
  }
  return mockDb.deleteTeamMember(memberId);
};

export const addProject = async (projectData) => {
  if (isSupabaseConfigured) {
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
  }
  return mockDb.addProject(projectData);
};

export const deleteProject = async (projectId) => {
  if (isSupabaseConfigured) {
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
  }
  return mockDb.deleteProject(projectId);
};

export const deleteReport = async (reportId) => {
  if (isSupabaseConfigured) {
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
  }
  return mockDb.deleteReport(reportId);
};

export const postAnnouncement = async (title, content, senderName) => {
  if (isSupabaseConfigured) {
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
  }
  return mockDb.postAnnouncement(title, content, senderName);
};

export const markNotificationRead = async (notifId) => {
  if (isSupabaseConfigured) {
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
  }
  return mockDb.markNotificationRead(notifId);
};

export const markAllNotificationsRead = async (userId) => {
  if (isSupabaseConfigured) {
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
  }
  return mockDb.markAllNotificationsRead(userId);
};
