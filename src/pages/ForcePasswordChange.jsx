import React, { useState } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { editTeamMember } from '../utils/mockDatabase';
import confetti from 'canvas-confetti';

export default function ForcePasswordChange({ currentUser, onPasswordChanged }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword === 'nexora123') {
      setError("Please choose a different password than the common default password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Update password and clear force change flag in database
      const res = editTeamMember(currentUser.id, { 
        password: newPassword,
        mustChangePassword: false 
      });

      setIsLoading(false);
      if (res.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        
        // Sync session user
        const localStorageUser = { ...currentUser, password: newPassword, mustChangePassword: false };
        localStorage.setItem("nexora_current_user", JSON.stringify(localStorageUser));
        
        if (onPasswordChanged) {
          onPasswordChanged(localStorageUser);
        }
      } else {
        setError(res.error || "An error occurred. Please try again.");
      }
    }, 800);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#030712]">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-nexora-purple/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-nexora-blue/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl glass-panel p-8 shadow-glass border border-slate-800 bg-[#070b16]/75 relative z-10 text-left space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4 animate-bounce">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">First-Time Login Security</h2>
          <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
            Welcome, <span className="text-slate-200 font-bold">{currentUser.name}</span>. As a security measure, you are required to change your password on your first login.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="w-full pl-10 pr-10 py-3 text-sm rounded-xl glass-input placeholder-slate-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">Confirm New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full pl-10 pr-10 py-3 text-sm rounded-xl glass-input placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-nexora-purple to-nexora-blue text-white shadow-glow-purple hover:brightness-110 transition-all flex justify-center items-center cursor-pointer"
          >
            {isLoading ? (
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              "Save Password & Continue"
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
