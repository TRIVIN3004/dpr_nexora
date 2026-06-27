// Central Mock Database for Nexora DPR Portal
// Persists state to localStorage

const DEFAULT_USERS = [
  {
    id: "EMP-001",
    name: "Trivin",
    email: "trivin@nexora.com",
    password: "123456",
    role: "admin",
    department: "Management",
    assignedProjects: ["All"],
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    phone: "+1 (555) 019-2834",
    mustChangePassword: true
  },
  {
    id: "EMP-002",
    name: "Aakashraj",
    email: "aakashraj@nexora.com",
    password: "123456",
    role: "member",
    department: "Engineering",
    assignedProjects: ["Nexora ERP", "CloudSync"],
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    phone: "+1 (555) 019-5829",
    mustChangePassword: true
  },
  {
    id: "EMP-003",
    name: "Gopika",
    email: "gopika@nexora.com",
    password: "123456",
    role: "member",
    department: "Design",
    assignedProjects: ["CyberShield"],
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    phone: "+1 (555) 019-9481",
    mustChangePassword: true
  },
  {
    id: "EMP-004",
    name: "Akshaya",
    email: "akshaya@nexora.com",
    password: "123456",
    role: "member",
    department: "Engineering",
    assignedProjects: ["AI Analyst"],
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    phone: "+1 (555) 019-3382",
    mustChangePassword: true
  },
  {
    id: "EMP-005",
    name: "Amirtha",
    email: "amirtha@nexora.com",
    password: "123456",
    role: "member",
    department: "Engineering",
    assignedProjects: ["Nexora ERP"],
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    phone: "+1 (555) 019-7482",
    mustChangePassword: true
  },
  {
    id: "EMP-006",
    name: "Pavithraa",
    email: "pavithraa@nexora.com",
    password: "123456",
    role: "member",
    department: "Quality Assurance",
    assignedProjects: ["CloudSync"],
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    phone: "+1 (555) 019-2910",
    mustChangePassword: true
  },
  {
    id: "EMP-007",
    name: "Sujitha",
    email: "sujitha@nexora.com",
    password: "123456",
    role: "member",
    department: "Engineering",
    assignedProjects: ["CyberShield"],
    avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150",
    phone: "+1 (555) 019-8739",
    mustChangePassword: true
  },
  {
    id: "EMP-008",
    name: "Sangamithra",
    email: "sangamithra@nexora.com",
    password: "123456",
    role: "member",
    department: "Design",
    assignedProjects: ["AI Analyst"],
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    phone: "+1 (555) 019-1144",
    mustChangePassword: true
  },
  {
    id: "EMP-009",
    name: "VishnuHasan",
    email: "vishnuhasan@nexora.com",
    password: "123456",
    role: "member",
    department: "Engineering",
    assignedProjects: ["Nexora ERP", "CyberShield"],
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150",
    phone: "+1 (555) 019-8239",
    mustChangePassword: true
  },
  {
    id: "EMP-010",
    name: "Aaryan",
    email: "aaryan@nexora.com",
    password: "123456",
    role: "member",
    department: "Engineering",
    assignedProjects: ["CloudSync"],
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    phone: "+1 (555) 019-7431",
    mustChangePassword: true
  },
  {
    id: "EMP-011",
    name: "Ajaykumar",
    email: "ajaykumar@nexora.com",
    password: "123456",
    role: "member",
    department: "Quality Assurance",
    assignedProjects: ["AI Analyst"],
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    phone: "+1 (555) 019-8120",
    mustChangePassword: true
  },
  {
    id: "EMP-012",
    name: "Pathmavathi",
    email: "pathmavathi@nexora.com",
    password: "123456",
    role: "member",
    department: "Management",
    assignedProjects: ["Nexora ERP"],
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    phone: "+1 (555) 019-1229",
    mustChangePassword: true
  },
  {
    id: "EMP-013",
    name: "Pooja",
    email: "pooja@nexora.com",
    password: "123456",
    role: "member",
    department: "Design",
    assignedProjects: ["CyberShield"],
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    phone: "+1 (555) 019-4820",
    mustChangePassword: true
  },
  {
    id: "EMP-014",
    name: "Aarathana",
    email: "aarathana@nexora.com",
    password: "123456",
    role: "member",
    department: "Engineering",
    assignedProjects: ["CloudSync"],
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150",
    phone: "+1 (555) 019-3349",
    mustChangePassword: true
  },
  {
    id: "EMP-015",
    name: "Gokulashri",
    email: "gokulashri@nexora.com",
    password: "123456",
    role: "member",
    department: "Engineering",
    assignedProjects: ["AI Analyst"],
    avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=150",
    phone: "+1 (555) 019-2283",
    mustChangePassword: true
  },
  {
    id: "EMP-016",
    name: "Karthikeyan",
    email: "karthikeyan@nexora.com",
    password: "123456",
    role: "member",
    department: "Engineering",
    assignedProjects: ["Nexora ERP", "CloudSync"],
    avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150",
    phone: "+1 (555) 019-2248",
    mustChangePassword: true
  },
  {
    id: "EMP-017",
    name: "Logesh",
    email: "logesh@nexora.com",
    password: "123456",
    role: "member",
    department: "Quality Assurance",
    assignedProjects: ["CyberShield"],
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    phone: "+1 (555) 019-1182",
    mustChangePassword: true
  },
  {
    id: "EMP-018",
    name: "Sanjay Kumar",
    email: "sanjaykumar@nexora.com",
    password: "123456",
    role: "member",
    department: "Engineering",
    assignedProjects: ["AI Analyst"],
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
    phone: "+1 (555) 019-9944",
    mustChangePassword: true
  },
  {
    id: "EMP-019",
    name: "Sanjay",
    email: "sanjay@nexora.com",
    password: "123456",
    role: "member",
    department: "Design",
    assignedProjects: ["Nexora ERP"],
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
    phone: "+1 (555) 019-8812",
    mustChangePassword: true
  },
  {
    id: "EMP-020",
    name: "Vishwa",
    email: "vishwa@nexora.com",
    password: "123456",
    role: "member",
    department: "Engineering",
    assignedProjects: ["CloudSync"],
    avatar: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=150",
    phone: "+1 (555) 019-4821",
    mustChangePassword: true
  },
  {
    id: "EMP-021",
    name: "Shakthi",
    email: "shakthi@nexora.com",
    password: "123456",
    role: "member",
    department: "Engineering",
    assignedProjects: ["CyberShield", "AI Analyst"],
    avatar: "https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=150",
    phone: "+1 (555) 019-4810",
    mustChangePassword: true
  }
];

const DEFAULT_PROJECTS = [
  { id: "PROJ-01", name: "Nexora ERP", status: "In Progress", lead: "Trivin", description: "Core enterprise resource planning platform." },
  { id: "PROJ-02", name: "CloudSync", status: "In Progress", lead: "Aakashraj", description: "Real-time file synchronization and backup." },
  { id: "PROJ-03", name: "CyberShield", status: "In Progress", lead: "Gopika", description: "Cloud infrastructure security compliance suite." },
  { id: "PROJ-04", name: "AI Analyst", status: "Planning", lead: "Akshaya", description: "Generative AI reporting dashboard integration." }
];

const getDateAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

const DEFAULT_REPORTS = [
  // 6 Days Ago
  {
    id: "REP-1001",
    date: getDateAgo(6),
    employeeName: "Aakashraj",
    employeeId: "EMP-002",
    employeeEmail: "aakashraj@nexora.com",
    projectName: "Nexora ERP",
    moduleName: "Authentication",
    taskAssigned: "Integrate JWT token verify middleware",
    taskCompletedToday: "Successfully wrote express middleware, unit tested token validation flow, and added refresh token logic.",
    workStatus: "Completed",
    hoursWorked: 8,
    percentageCompleted: 100,
    challengesFaced: "None",
    tomorrowPlan: "Start setting up route authorization for admin endpoints.",
    images: ["https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400"],
    files: [{ name: "jwt-middleware-spec.pdf", size: "482 KB" }],
    status: "Approved",
    feedback: "Excellent work on the verification middleware, Aakashraj! Keep it up.",
    approvedBy: "Trivin",
    approvedAt: getDateAgo(5)
  },
  {
    id: "REP-1002",
    date: getDateAgo(6),
    employeeName: "Gopika",
    employeeId: "EMP-003",
    employeeEmail: "gopika@nexora.com",
    projectName: "CyberShield",
    moduleName: "Dashboard UX",
    taskAssigned: "Design high-fidelity mockups for threat detector list",
    taskCompletedToday: "Created Figma mockups for real-time alert grid, filtering bar, and detail sidebar panels.",
    workStatus: "Completed",
    hoursWorked: 7.5,
    percentageCompleted: 100,
    challengesFaced: "Aligning on colors with branding guidelines.",
    tomorrowPlan: "Begin prototyping alert animations in Tailwind.",
    images: ["https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=400"],
    files: [{ name: "FigmaExport_ThreatsGrid.zip", size: "4.2 MB" }],
    status: "Approved",
    feedback: "Great UI colors. Make sure to double-check color contrast rules.",
    approvedBy: "Trivin",
    approvedAt: getDateAgo(5)
  },
  
  // 5 Days Ago
  {
    id: "REP-1003",
    date: getDateAgo(5),
    employeeName: "Aakashraj",
    employeeId: "EMP-002",
    employeeEmail: "aakashraj@nexora.com",
    projectName: "Nexora ERP",
    moduleName: "Authentication",
    taskAssigned: "Set up route authorization for admin endpoints",
    taskCompletedToday: "Implemented custom RBAC checks on API routes. Configured mock roles for local setup validation.",
    workStatus: "Completed",
    hoursWorked: 8,
    percentageCompleted: 100,
    challengesFaced: "Nested roles config took longer than expected.",
    tomorrowPlan: "Migrate database seeding scripts.",
    images: [],
    files: [],
    status: "Approved",
    feedback: "Approved.",
    approvedBy: "Trivin",
    approvedAt: getDateAgo(4)
  },
  {
    id: "REP-1004",
    date: getDateAgo(5),
    employeeName: "Akshaya",
    employeeId: "EMP-004",
    employeeEmail: "akshaya@nexora.com",
    projectName: "Nexora ERP",
    moduleName: "Core Reporting API",
    taskAssigned: "Design endpoints for report aggregations",
    taskCompletedToday: "Created aggregation pipes for daily stats, completed vs blocked statistics.",
    workStatus: "In Progress",
    hoursWorked: 8,
    percentageCompleted: 60,
    challengesFaced: "Memory leak in aggregations queries due to non-indexed fields in testing database.",
    tomorrowPlan: "Add indices and finalize the controller logic.",
    images: [],
    files: [],
    status: "Approved",
    feedback: "Make sure you create indexes for both employeeId and date.",
    approvedBy: "Trivin",
    approvedAt: getDateAgo(4)
  },

  // 4 Days Ago
  {
    id: "REP-1005",
    date: getDateAgo(4),
    employeeName: "Gopika",
    employeeId: "EMP-003",
    employeeEmail: "gopika@nexora.com",
    projectName: "CyberShield",
    moduleName: "Dashboard UX",
    taskAssigned: "Begin prototyping alert animations in Tailwind",
    taskCompletedToday: "Wrote Tailwind transitions for active alarm states and expand-collapse transitions.",
    workStatus: "Completed",
    hoursWorked: 6,
    percentageCompleted: 100,
    challengesFaced: "None",
    tomorrowPlan: "Review prototypes with engineering lead to ensure performance.",
    images: ["https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400"],
    files: [],
    status: "Approved",
    feedback: "Smooth animations, tested locally and it looks fantastic.",
    approvedBy: "Trivin",
    approvedAt: getDateAgo(3)
  },
  {
    id: "REP-1006",
    date: getDateAgo(4),
    employeeName: "Aakashraj",
    employeeId: "EMP-002",
    employeeEmail: "aakashraj@nexora.com",
    projectName: "CloudSync",
    moduleName: "Delta Uploads",
    taskAssigned: "Research Rsync style chunk hash algorithms for client syncing",
    taskCompletedToday: "Read papers on rolling hash functions. Set up initial benchmark tests for md5 vs adler32.",
    workStatus: "In Progress",
    hoursWorked: 8,
    percentageCompleted: 40,
    challengesFaced: "Adler32 has collision weaknesses but is significantly faster in client-side JS runtimes.",
    tomorrowPlan: "Test performance on files over 1GB.",
    images: [],
    files: [{ name: "rolling-hash-benchmarks.xlsx", size: "112 KB" }],
    status: "Approved",
    feedback: "Very thorough research. Go with Adler32 for now.",
    approvedBy: "Trivin",
    approvedAt: getDateAgo(3)
  },

  // Today (Pending submission)
  {
    id: "REP-1014",
    date: getDateAgo(0),
    employeeName: "Aakashraj",
    employeeId: "EMP-002",
    employeeEmail: "aakashraj@nexora.com",
    projectName: "Nexora ERP",
    moduleName: "Dashboard Integration",
    taskAssigned: "Solve overlay stacking context and submit",
    taskCompletedToday: "Fixed z-index stacking layers by wrapping popovers in portals. Added micro-animations to calendar dots.",
    workStatus: "Completed",
    hoursWorked: 8,
    percentageCompleted: 100,
    challengesFaced: "None",
    tomorrowPlan: "Support custom range selections on filters.",
    images: [],
    files: [],
    status: "Pending",
    feedback: "",
    approvedBy: "",
    approvedAt: ""
  }
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 1,
    title: "Q2 Core Performance Reviews",
    content: "All departments are scheduled to submit final Q2 milestones before next Friday. Please sync with your direct managers for specific checklist templates.",
    date: getDateAgo(1),
    sender: "Trivin"
  },
  {
    id: 2,
    title: "Vite and Tailwind Upgrades",
    content: "We have upgraded our workspace dependencies to support faster HMR and optimized styles bundle sizes.",
    date: getDateAgo(3),
    sender: "System Administrator"
  }
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: "NOT-01",
    userId: "EMP-002",
    type: "status_update",
    title: "Report Approved",
    message: "Trivin approved your report for [Delta Uploads].",
    date: getDateAgo(1),
    read: false
  },
  {
    id: "NOT-02",
    userId: "EMP-003",
    type: "status_update",
    title: "Report Approved",
    message: "Trivin approved your report for [Prompt Templates].",
    date: getDateAgo(0),
    read: false
  }
];

// Initialize Database in LocalStorage if not exists
export const initDatabase = () => {
  let dbExist = localStorage.getItem("nexora_dpr_db");
  let needsReset = false;
  if (dbExist) {
    try {
      const parsed = JSON.parse(dbExist);
      // Reset if Trivin is missing or if users are still holding the old password string
      if (!parsed.users.some(u => u.email === "trivin@nexora.com") || parsed.users.some(u => u.password === "nexora123")) {
        needsReset = true;
      }
    } catch (e) {
      needsReset = true;
    }
  }

  if (!dbExist || needsReset) {
    const db = {
      users: DEFAULT_USERS,
      projects: DEFAULT_PROJECTS,
      reports: DEFAULT_REPORTS,
      announcements: DEFAULT_ANNOUNCEMENTS,
      notifications: DEFAULT_NOTIFICATIONS
    };
    localStorage.setItem("nexora_dpr_db", JSON.stringify(db));
    
    // Explicitly do NOT set "nexora_current_user" to enforce login screen view on fresh start
    localStorage.removeItem("nexora_current_user");
  }
};

export const getDatabase = () => {
  initDatabase();
  return JSON.parse(localStorage.getItem("nexora_dpr_db"));
};

export const saveDatabase = (db) => {
  localStorage.setItem("nexora_dpr_db", JSON.stringify(db));
};

export const getCurrentUser = () => {
  initDatabase();
  return JSON.parse(localStorage.getItem("nexora_current_user"));
};

export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem("nexora_current_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("nexora_current_user");
  }
};

// API Functions
export const loginUser = (email, password) => {
  const db = getDatabase();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (user) {
    setCurrentUser(user);
    return { success: true, user };
  }
  return { success: false, error: "Invalid email or password." };
};

export const simulatePasswordReset = (email) => {
  const db = getDatabase();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    return { success: true, message: `Password reset link sent to ${email} (simulated).` };
  }
  return { success: false, error: "Email address not found." };
};

export const submitDailyReport = (reportData) => {
  const db = getDatabase();
  const newReport = {
    id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    status: "Pending",
    feedback: "",
    approvedBy: "",
    approvedAt: "",
    ...reportData
  };
  
  db.reports.unshift(newReport);
  
  // Send notification to Admin
  db.notifications.unshift({
    id: `NOT-${Math.floor(10000 + Math.random() * 90000)}`,
    userId: "EMP-001",
    type: "submission",
    title: "New Report Submitted",
    message: `${reportData.employeeName} submitted a DPR for project [${reportData.projectName}].`,
    date: new Date().toISOString(),
    read: false
  });

  saveDatabase(db);
  return { success: true, report: newReport };
};

export const updateDailyReport = (reportId, reportData) => {
  const db = getDatabase();
  const reportIndex = db.reports.findIndex(r => r.id === reportId);
  
  if (reportIndex !== -1) {
    const report = db.reports[reportIndex];
    if (report.status !== "Pending") {
      return { success: false, error: "Reviewed reports cannot be edited." };
    }
    
    db.reports[reportIndex] = {
      ...report,
      ...reportData
    };
    
    saveDatabase(db);
    return { success: true, report: db.reports[reportIndex] };
  }
  return { success: false, error: "Report not found." };
};

export const reviewReportStatus = (reportId, status, feedback, adminName) => {
  const db = getDatabase();
  const reportIndex = db.reports.findIndex(r => r.id === reportId);
  
  if (reportIndex !== -1) {
    const report = db.reports[reportIndex];
    db.reports[reportIndex] = {
      ...report,
      status,
      feedback,
      approvedBy: adminName,
      approvedAt: new Date().toISOString().split('T')[0]
    };
    
    const employee = db.users.find(u => u.email === report.employeeEmail);
    if (employee) {
      db.notifications.unshift({
        id: `NOT-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: employee.id,
        type: "status_update",
        title: status === "Approved" ? "Report Approved" : "Report Rejected",
        message: `${adminName} reviewed your report for [${report.projectName}]. Status: ${status}. ${feedback ? `Feedback: "${feedback}"` : ""}`,
        date: new Date().toISOString(),
        read: false
      });
    }

    saveDatabase(db);
    return { success: true, report: db.reports[reportIndex] };
  }
  return { success: false, error: "Report not found." };
};

// Member management CRUD
export const addTeamMember = (memberData) => {
  const db = getDatabase();
  const newMember = {
    id: memberData.id || `EMP-${Math.floor(100 + Math.random() * 900)}`,
    password: "123456", // Default password
    mustChangePassword: true,
    avatar: memberData.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    role: "member",
    ...memberData
  };
  
  if (db.users.some(u => u.email.toLowerCase() === memberData.email.toLowerCase())) {
    return { success: false, error: "A user with this email already exists." };
  }

  db.users.push(newMember);

  db.notifications.unshift({
    id: `NOT-${Math.floor(10000 + Math.random() * 90000)}`,
    userId: newMember.id,
    type: "assignment",
    title: "Account Created",
    message: `Welcome ${newMember.name}! Your account has been setup. Please change your password on first login.`,
    date: new Date().toISOString(),
    read: false
  });

  saveDatabase(db);
  return { success: true, member: newMember };
};

export const editTeamMember = (memberId, memberData) => {
  const db = getDatabase();
  const memberIndex = db.users.findIndex(u => u.id === memberId);
  
  if (memberIndex !== -1) {
    if (memberData.email && memberData.email !== db.users[memberIndex].email) {
      if (db.users.some(u => u.id !== memberId && u.email.toLowerCase() === memberData.email.toLowerCase())) {
        return { success: false, error: "Email already in use." };
      }
    }

    db.users[memberIndex] = {
      ...db.users[memberIndex],
      ...memberData
    };
    
    // Sync active session if the edited user is the current active session
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === memberId) {
      setCurrentUser({
        ...currentUser,
        ...memberData
      });
    }

    saveDatabase(db);
    return { success: true, member: db.users[memberIndex] };
  }
  return { success: false, error: "Member not found." };
};

export const deleteTeamMember = (memberId) => {
  const db = getDatabase();
  const user = db.users.find(u => u.id === memberId);
  if (user && user.role === "admin") {
    return { success: false, error: "Cannot delete admin users." };
  }
  
  db.users = db.users.filter(u => u.id !== memberId);
  saveDatabase(db);
  return { success: true };
};

// Project CRUD
export const addProject = (projectData) => {
  const db = getDatabase();
  const newProj = {
    id: `PROJ-${Math.floor(10 + Math.random() * 90)}`,
    status: "In Progress",
    ...projectData
  };
  db.projects.push(newProj);
  saveDatabase(db);
  return { success: true, project: newProj };
};

export const deleteProject = (projectId) => {
  const db = getDatabase();
  const project = db.projects.find(p => p.id === projectId);
  if (!project) {
    return { success: false, error: "Project not found." };
  }
  
  db.projects = db.projects.filter(p => p.id !== projectId);
  
  // Also clean up this project allocation from all user accounts
  db.users = db.users.map(u => {
    if (u.assignedProjects) {
      u.assignedProjects = u.assignedProjects.filter(name => name !== project.name);
      if (u.assignedProjects.length === 0) {
        u.assignedProjects = ['Nexora ERP'];
      }
    }
    return u;
  });

  saveDatabase(db);
  return { success: true };
};

// Announcement posting
export const postAnnouncement = (title, content, senderName) => {
  const db = getDatabase();
  const newAnn = {
    id: db.announcements.length + 1,
    title,
    content,
    date: new Date().toISOString().split('T')[0],
    sender: senderName
  };
  
  db.announcements.unshift(newAnn);

  db.users.forEach(user => {
    db.notifications.unshift({
      id: `NOT-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: user.id,
      type: "announcement",
      title: "New Announcement",
      message: `${senderName} posted: "${title}"`,
      date: new Date().toISOString(),
      read: false
    });
  });

  saveDatabase(db);
  return { success: true, announcement: newAnn };
};

// Notifications operations
export const markNotificationRead = (notifId) => {
  const db = getDatabase();
  const notifIndex = db.notifications.findIndex(n => n.id === notifId);
  if (notifIndex !== -1) {
    db.notifications[notifIndex].read = true;
    saveDatabase(db);
    return { success: true };
  }
  return { success: false };
};

export const markAllNotificationsRead = (userId) => {
  const db = getDatabase();
  db.notifications = db.notifications.map(n => {
    if (n.userId === userId) {
      return { ...n, read: true };
    }
    return n;
  });
  saveDatabase(db);
  return { success: true };
};
