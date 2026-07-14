import React, { useState, useEffect } from 'react';
import { getCurrentUser, editTeamMember, getDatabase } from '../utils/database';
import { User, Shield, Bell, Key, Sparkles, Building2, CheckCircle2, Camera } from 'lucide-react';

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

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 200; // 200x200 pixels is perfect for a compact profile picture
        
        canvas.width = maxDim;
        canvas.height = maxDim;
        
        const ctx = canvas.getContext('2d');
        const minDim = Math.min(img.width, img.height);
        
        // Crop the image into a perfect square from the center
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;
        
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, maxDim, maxDim);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // Compress to 85% JPEG quality
        setAvatarUrl(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
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
              
              {/* Profile Picture Section */}
              <div className="flex flex-col md:flex-row items-start gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/40">
                <div className="relative group mx-auto md:mx-0 flex-shrink-0 cursor-pointer">
                  <img
                    src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt="Profile Avatar"
                    className="h-16 w-16 rounded-full object-cover border border-slate-750 shadow-md group-hover:opacity-75 transition-opacity"
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
                    <h5 className="text-[11px] font-bold text-slate-300">Profile Picture</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Click the avatar to upload a local picture, or select a preset below.</p>
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
                          avatarUrl === preset.url ? 'border-nexora-purple scale-110 ring-1 ring-nexora-purple/50' : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>

                  {/* Remote URL input option */}
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-slate-400 font-medium">Or enter external image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/avatar.png"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg glass-input text-[11px] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

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
