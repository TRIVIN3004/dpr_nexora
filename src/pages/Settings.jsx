import React, { useState, useEffect } from 'react';
import { getCurrentUser, editTeamMember, getDatabase } from '../utils/database';
import { User, Shield, Bell, Key, Sparkles, Building2, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState('');

  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

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
    }
  }, []);

  if (!currentUser) return null;

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const res = await editTeamMember(currentUser.id, { name, email, phone });
    if (res.success) {
      // Sync sessions user object
      const db = await getDatabase();
      const updatedUser = db.users.find(u => u.id === currentUser.id);
      sessionStorage.setItem("nexora_current_user", JSON.stringify(updatedUser));
      
      triggerToast("Profile details updated successfully!");
      window.dispatchEvent(new Event('database_updated'));
    } else {
      alert(res.error);
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

  const handleCompanySave = (e) => {
    e.preventDefault();
    triggerToast("Company profile parameters locked successfully!");
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      
      {/* Toast alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-nexora-purple shadow-glow-purple text-xs text-slate-200 animate-slide-in flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-nexora-purple animate-ping" />
          {toast}
        </div>
      )}

      {/* Title block */}
      <div className="glass-panel p-5 rounded-2xl shadow-glass border border-slate-800/40">
        <h3 className="text-base font-bold text-slate-200">System Preferences & Settings</h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">Modify account info, company rules, and client triggers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Navigation sidebar */}
        <div className="lg:col-span-1 glass-panel p-4 rounded-2xl shadow-glass space-y-2 h-fit">
          <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-slate-900 text-nexora-purple text-xs font-bold font-sans">
            <User className="h-4 w-4" /> Personal Account
          </div>
          <div className="flex items-center gap-2 px-3.5 py-3 text-slate-400 hover:text-white rounded-xl text-xs font-medium font-sans">
            <Bell className="h-4 w-4" /> Notifications Config
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 px-3.5 py-3 text-slate-400 hover:text-white rounded-xl text-xs font-medium font-sans">
              <Building2 className="h-4 w-4" /> Company Rules
            </div>
          )}
        </div>

        {/* Configurations main blocks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: User Profile Settings */}
          <div className="glass-panel p-5 rounded-2xl shadow-glass space-y-4">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest border-b border-slate-800/40 pb-2 flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-nexora-purple" />
              General Profile Settings
            </h4>

            <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Display Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Work Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-nexora-purple text-white hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer font-bold"
              >
                Update Account Information
              </button>
            </form>
          </div>

          {/* Section 2: Password modifier */}
          <div className="glass-panel p-5 rounded-2xl shadow-glass space-y-4">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest border-b border-slate-800/40 pb-2 flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-nexora-blue" />
              Change System Password
            </h4>

            <form onSubmit={handlePasswordSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Current Password</label>
                <input
                  type="password"
                  required
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-200 transition-all cursor-pointer font-bold"
              >
                Change Security Token
              </button>
            </form>
          </div>

          {/* Section 3: Notification Toggles */}
          <div className="glass-panel p-5 rounded-2xl shadow-glass space-y-4">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest border-b border-slate-800/40 pb-2 flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-nexora-purple" />
              Notifications Configuration
            </h4>

            <div className="space-y-3.5 text-xs text-slate-300">
              <label className="flex items-center gap-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailDprSubmission}
                  onChange={(e) => setEmailDprSubmission(e.target.checked)}
                  className="rounded border-slate-850 text-nexora-purple focus:ring-nexora-purple bg-slate-950/45 h-4 w-4"
                />
                <div>
                  <span className="font-bold text-slate-200 block">Email Alerts for submissions</span>
                  <span className="text-[10px] text-slate-500">Sends alerts when team member submits reports</span>
                </div>
              </label>

              <label className="flex items-center gap-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailWeeklyDigest}
                  onChange={(e) => setEmailWeeklyDigest(e.target.checked)}
                  className="rounded border-slate-850 text-nexora-purple focus:ring-nexora-purple bg-slate-950/45 h-4 w-4"
                />
                <div>
                  <span className="font-bold text-slate-200 block">Weekly Digest Digests</span>
                  <span className="text-[10px] text-slate-500">Recaps sprint tasks progress every Friday</span>
                </div>
              </label>

              <label className="flex items-center gap-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushStatusUpdate}
                  onChange={(e) => setPushStatusUpdate(e.target.checked)}
                  className="rounded border-slate-850 text-nexora-purple focus:ring-nexora-purple bg-slate-950/45 h-4 w-4"
                />
                <div>
                  <span className="font-bold text-slate-200 block">In-App Live Stream Alerts</span>
                  <span className="text-[10px] text-slate-500">Recaps status notifications directly on header bell</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4: Company Profile Configuration (Only for Admins) */}
          {isAdmin && (
            <div className="glass-panel p-5 rounded-2xl shadow-glass space-y-4">
              <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest border-b border-slate-800/40 pb-2 flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-nexora-blue" />
                Nexora Tech Rules & Compliance
              </h4>

              <form onSubmit={handleCompanySave} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Report Submission Cutoff</label>
                    <input
                      type="time"
                      value={reportCutoff}
                      onChange={(e) => setReportCutoff(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl glass-input focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Authorized Email Domains</label>
                  <input
                    type="text"
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-nexora-blue to-nexora-purple text-white shadow-glow-purple font-bold hover:brightness-110 cursor-pointer"
                >
                  Save Compliance Directives
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
