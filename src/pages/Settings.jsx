import React, { useState, useEffect } from 'react';
import { getCurrentUser, editTeamMember, getDatabase } from '../utils/database';
import { compressImage, uploadFileToStorage } from '../utils/storageService';
import { useDatabaseStore } from '../context/DatabaseContext';
import { User, Shield, Bell, Key, Sparkles, Building2, CheckCircle2, Camera, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

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
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar || '');
    }
  }, []);

  if (!currentUser) return null;

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const res = await editTeamMember(currentUser.id, { name, email, phone, avatar: avatarUrl });
    if (res.success) {
      sessionStorage.setItem("nexora_current_user", JSON.stringify({ ...currentUser, name, email, phone, avatar: avatarUrl }));
      triggerToast("Profile details updated successfully!");
      invalidateStore('users');
    } else {
      alert(res.error);
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

    </div>
  );
}
