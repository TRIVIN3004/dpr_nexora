import React, { useState, useEffect } from 'react';
import { getCurrentUser, editTeamMember, getDatabase } from '../utils/database';
import { compressImage, uploadFileToStorage } from '../utils/storageService';
import { useDatabaseStore } from '../context/DatabaseContext';
import { User, Shield, Bell, Key, Sparkles, Building2, CheckCircle2, Camera, Check, Mail, Send, Eye, ShieldCheck, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmailPreviewModal from '../components/EmailPreviewModal';
import { 
  getPersonalEmail, 
  savePersonalEmail, 
  getResendConfig, 
  saveResendConfig, 
  getEmailAlertLogs, 
  sendEmailAlert, 
  generateTestEmail 
} from '../utils/emailService';

const PRESET_AVATARS = [
  { id: '1', name: 'Man 1', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150' },
  { id: '2', name: 'Woman 1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: '3', name: 'Man 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { id: '4', name: 'Woman 2', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' },
  { id: '5', name: 'Woman 3', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  { id: '6', name: 'Woman 4', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
  { id: '7', name: 'Woman 5', url: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150' },
  { id: '8', name: 'Woman 6', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
  { id: '9', name: 'Man 3', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150' },
  { id: '10', name: 'Abstract Gradient', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150' }
];

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState('');
  const [activeSection, setActiveSection] = useState('account'); // 'account' | 'notifications' | 'company'
  const { invalidateStore } = useDatabaseStore();

  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Resend Configuration State
  const [resendApiKey, setResendApiKey] = useState('');
  const [resendFromEmail, setResendFromEmail] = useState('Nexora Alerts <onboarding@resend.dev>');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingResend, setIsTestingResend] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [previewModalData, setPreviewModalData] = useState(null);

  // Password reset States
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notifications Checkboxes
  const [emailDprSubmission, setEmailDprSubmission] = useState(true);
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(false);
  const [pushStatusUpdate, setPushStatusUpdate] = useState(true);

  // Company Profile states (Only for Admin)
  const [companyName, setCompanyName] = useState('Nexora Technologies');
  const [companyDomain, setCompanyDomain] = useState('nexoratech.com');
  const [reportCutoff, setReportCutoff] = useState('19:00');

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPersonalEmail(user.personalEmail || getPersonalEmail(user) || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar || '');
    }

    const cfg = getResendConfig();
    setResendApiKey(cfg.apiKey || '');
    setResendFromEmail(cfg.fromEmail || 'Nexora Alerts <onboarding@resend.dev>');
    setEmailLogs(getEmailAlertLogs());

    const handleLogUpdate = () => setEmailLogs(getEmailAlertLogs());
    window.addEventListener('nexora:email_alert_sent', handleLogUpdate);
    return () => window.removeEventListener('nexora:email_alert_sent', handleLogUpdate);
  }, []);

  if (!currentUser) return null;

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (personalEmail) {
      savePersonalEmail(currentUser.id, personalEmail);
    }
    const res = await editTeamMember(currentUser.id, { name, email, personalEmail, phone, avatar: avatarUrl });
    if (res.success) {
      sessionStorage.setItem("nexora_current_user", JSON.stringify({ ...currentUser, name, email, personalEmail, phone, avatar: avatarUrl }));
      triggerToast("Profile details updated successfully!");
      invalidateStore('users');
    } else {
      alert(res.error);
    }
  };

  const handleSaveResendSettings = (e) => {
    e.preventDefault();
    saveResendConfig({
      apiKey: resendApiKey.trim(),
      fromEmail: resendFromEmail.trim()
    });
    triggerToast("Resend API settings saved successfully!");
  };

  const handleSendTestAlert = async () => {
    const targetEmail = personalEmail || email;
    if (!targetEmail) {
      alert("Please provide a personal email address first.");
      return;
    }
    setIsTestingResend(true);
    setTestResult(null);
    try {
      const html = generateTestEmail({ userName: name, personalEmail: targetEmail });
      const res = await sendEmailAlert({
        to: targetEmail,
        recipientName: name,
        subject: 'Nexora Portal: Resend Email Delivery Test',
        html,
        type: 'test_alert',
        metadata: { triggeredBy: currentUser.id }
      });
      setTestResult(res);
      setEmailLogs(getEmailAlertLogs());
      if (res.success) {
        triggerToast(res.simulated ? 'Test alert simulated!' : 'Test email dispatched via Resend!');
      } else {
        triggerToast('Failed: ' + (res.error || 'Resend error'));
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTestingResend(false);
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 300, 0.85);
      const publicUrl = await uploadFileToStorage(compressed, 'avatars');
      setAvatarUrl(publicUrl);
    } catch (err) {
      console.warn("Avatar upload error:", err);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match.");
      return;
    }
    if (currPassword !== currentUser.password) {
      alert("Current password is incorrect.");
      return;
    }

    const res = await editTeamMember(currentUser.id, { password: newPassword });
    if (res.success) {
      // Sync session
      const db = await getDatabase();
      const updatedUser = db.users.find(u => u.id === currentUser.id);
      sessionStorage.setItem("nexora_current_user", JSON.stringify(updatedUser));

      triggerToast("Password reset successfully!");
      setCurrPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleNotificationSave = (e) => {
    e.preventDefault();
    triggerToast("Notification preferences updated successfully!");
  };

  const handleCompanySave = (e) => {
    e.preventDefault();
    triggerToast("Company profile parameters locked successfully!");
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      
      {/* Toast alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500 shadow-lg text-xs text-white animate-slide-in flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
          {toast}
        </div>
      )}

      {/* Title block */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl">
        <h3 className="text-base font-black text-slate-900 dark:text-white">System Preferences & Settings</h3>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 mt-1">Modify account info, notification preferences, and company compliance rules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Navigation sidebar */}
        <div className="lg:col-span-1 p-4 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-2 h-fit">
          <button
            type="button"
            onClick={() => setActiveSection('account')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer text-left ${
              activeSection === 'account'
                ? 'bg-indigo-600 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 text-white shadow-md border border-indigo-500'
                : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            <User className="h-4 w-4 shrink-0" />
            <span>Personal Account</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('notifications')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer text-left ${
              activeSection === 'notifications'
                ? 'bg-indigo-600 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 text-white shadow-md border border-indigo-500'
                : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span>Notifications Config</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveSection('company')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer text-left ${
                activeSection === 'company'
                  ? 'bg-indigo-600 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 text-white shadow-md border border-indigo-500'
                  : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span>Company Rules</span>
            </button>
          )}
        </div>

        {/* Configurations main blocks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION: PERSONAL ACCOUNT & PASSWORD */}
          {activeSection === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Profile Details Form */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-4">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-white/10 pb-2 flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-indigo-600 dark:text-[#818cf8]" />
                  General Profile Settings
                </h4>

                <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
                  
                  {/* Profile Picture Section */}
                  <div className="flex flex-col md:flex-row items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/40">
                    <div className="relative group mx-auto md:mx-0 flex-shrink-0 cursor-pointer">
                      <img
                        src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt="Profile Avatar"
                        className="h-16 w-16 rounded-full object-cover border-2 border-indigo-400 shadow-md group-hover:opacity-75 transition-opacity"
                      />
                      <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[9px] font-bold">
                        <Camera className="h-4 w-4 mb-0.5" />
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="space-y-2.5 flex-grow w-full">
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-900 dark:text-slate-200">Profile Picture</h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Click the avatar to upload a local picture, or select a preset below.</p>
                      </div>
                      
                      {/* Preset Avatars */}
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_AVATARS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setAvatarUrl(preset.url)}
                            title={preset.name}
                            className={`h-7 w-7 rounded-full overflow-hidden border cursor-pointer transition-all ${
                              avatarUrl === preset.url 
                                ? 'border-indigo-600 scale-110 ring-2 ring-indigo-500/50' 
                                : 'border-slate-300 dark:border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>

                      {/* Remote URL input option */}
                      <div className="space-y-0.5">
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Or enter external image URL</label>
                        <input
                          type="text"
                          placeholder="https://example.com/avatar.png"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white text-[11px] focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">Display Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">Contact Phone</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">Work Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                        <span>Personal Email (Alerts Destination)</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">Resend Enabled</span>
                      </label>
                      <input
                        type="email"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                        placeholder="e.g. employee.personal@gmail.com"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-2">All official attendance warnings, leave approvals, and DPR reviews will be dispatched to this personal email address via Resend.</p>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition-all cursor-pointer shadow-md"
                  >
                    Update Account Information
                  </button>
                </form>
              </div>

              {/* Password modifier */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-4">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-white/10 pb-2 flex items-center gap-2">
                  <Key className="h-4.5 w-4.5 text-indigo-600 dark:text-[#818cf8]" />
                  Change System Password
                </h4>

                <form onSubmit={handlePasswordSave} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currPassword}
                      onChange={(e) => setCurrPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer font-black"
                  >
                    Change Security Token
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* SECTION: NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-5"
            >
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-white/10 pb-2 flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-indigo-600 dark:text-[#818cf8]" />
                Notifications Configuration
              </h4>

              <form onSubmit={handleNotificationSave} className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailDprSubmission}
                    onChange={(e) => setEmailDprSubmission(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-200 block">Email Alerts for DPR Submissions</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Sends alerts when team member submits daily progress reports</span>
                  </div>
                </label>

                <label className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailWeeklyDigest}
                    onChange={(e) => setEmailWeeklyDigest(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-200 block">Weekly Digest Summaries</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Recaps sprint tasks progress every Friday</span>
                  </div>
                </label>

                <label className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushStatusUpdate}
                    onChange={(e) => setPushStatusUpdate(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-200 block">In-App Live Stream Alerts</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Recaps status notifications directly on header bell</span>
                  </div>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md cursor-pointer transition-colors"
                >
                  Save Notification Preferences
                </button>
              </form>

              {/* RESEND EMAIL SERVICE ENGINE CONFIGURATION */}
              <div className="border-t border-slate-200 dark:border-white/10 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-600 dark:text-[#818cf8]" />
                    <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Resend Email Delivery Integration
                    </h5>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                    resendApiKey && resendApiKey.startsWith('re_')
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  }`}>
                    {resendApiKey && resendApiKey.startsWith('re_') ? 'Resend Live Active' : 'Simulation Mode (Test Active)'}
                  </span>
                </div>

                <form onSubmit={handleSaveResendSettings} className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                      <span>Resend API Key</span>
                      <a
                        href="https://resend.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>Get Free Key on Resend</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={resendApiKey}
                        onChange={(e) => setResendApiKey(e.target.value)}
                        placeholder="re_123456789_abcdef..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-indigo-500 pr-16"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-2 px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        {showApiKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">Sender Email Address (From)</label>
                    <input
                      type="text"
                      value={resendFromEmail}
                      onChange={(e) => setResendFromEmail(e.target.value)}
                      placeholder="Nexora Alerts <onboarding@resend.dev>"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Use onboarding@resend.dev for instant sandbox testing, or your custom verified domain on Resend.</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                    >
                      Save Resend Settings
                    </button>

                    <button
                      type="button"
                      onClick={handleSendTestAlert}
                      disabled={isTestingResend}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isTestingResend ? (
                        <>
                          <span className="inline-block h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3" />
                          <span>Send Test to Personal Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Test feedback */}
                {testResult && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}>
                    {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />}
                    <span>{testResult.message || testResult.error}</span>
                  </div>
                )}

                {/* Recent Dispatched Alerts History */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h6 className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Recent Email Alerts History ({emailLogs.length})
                    </h6>
                    <button
                      type="button"
                      onClick={() => setEmailLogs(getEmailAlertLogs())}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {emailLogs.length === 0 ? (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-center">
                      No email alerts dispatched yet. Send a test alert or trigger attendance warnings to see live logs.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {emailLogs.slice(0, 8).map((log) => (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5 truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">{log.subject}</span>
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                                log.status === 'delivered'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              }`}>
                                {log.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              <span>To: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{log.to}</strong></span>
                              <span>•</span>
                              <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPreviewModalData({
                              isOpen: true,
                              recipientName: log.recipientName || 'Staff Member',
                              personalEmail: log.to,
                              subject: log.subject,
                              html: log.html,
                              type: log.type || 'alert'
                            })}
                            className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Preview</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION: COMPANY RULES (Admin Only) */}
          {activeSection === 'company' && isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] backdrop-blur-2xl shadow-xl space-y-4"
            >
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-white/10 pb-2 flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-indigo-600 dark:text-[#818cf8]" />
                Nexora Tech Rules & Compliance
              </h4>

              <form onSubmit={handleCompanySave} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">Report Submission Cutoff</label>
                    <input
                      type="time"
                      value={reportCutoff}
                      onChange={(e) => setReportCutoff(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Authorized Email Domains</label>
                  <input
                    type="text"
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Save Compliance Directives
                </button>
              </form>
            </motion.div>
          )}

        </div>

      </div>

      {/* Email Alert Preview Modal */}
      {previewModalData && (
        <EmailPreviewModal
          isOpen={previewModalData.isOpen}
          onClose={() => setPreviewModalData(null)}
          recipientName={previewModalData.recipientName}
          personalEmail={previewModalData.personalEmail}
          subject={previewModalData.subject}
          html={previewModalData.html}
          type={previewModalData.type}
          onSent={() => {
            setEmailLogs(getEmailAlertLogs());
            triggerToast('Email alert successfully dispatched!');
          }}
        />
      )}

    </div>
  );
}
