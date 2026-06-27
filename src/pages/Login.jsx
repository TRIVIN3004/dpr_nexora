import React, { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { loginUser, simulatePasswordReset } from '../utils/mockDatabase';
import { motion } from 'framer-motion';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Auth flow states
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const prefillEmail = sessionStorage.getItem("login_prefill_email");
    if (prefillEmail) {
      setEmail(prefillEmail);
      sessionStorage.removeItem("login_prefill_email");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = loginUser(email, password);
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error);
      }
    }, 800);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = simulatePasswordReset(forgotEmail);
      setIsLoading(false);
      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setError(res.error);
      }
    }, 800);
  };

  const handleQuickFill = (role) => {
    setError('');
    setSuccessMessage('');
    if (role === 'admin') {
      setEmail('trivin@nexora.com');
      setPassword('123456');
    } else if (role === 'member') {
      setEmail('aakashraj@nexora.com');
      setPassword('123456');
    } else if (role === 'member2') {
      setEmail('gopika@nexora.com');
      setPassword('123456');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-nexora-purple/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-nexora-blue/10 blur-[120px] pointer-events-none" />

      {/* Main card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-3xl glass-panel p-8 shadow-glass border border-slate-800 bg-slate-950/75 relative z-10 text-left"
      >
        {/* Brand logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Nexora Logo" 
            className="h-14 w-14 rounded-2xl object-cover border border-slate-800 shadow-glow-purple mb-4 bg-slate-950" 
          />
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Nexora DPR Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium tracking-wide">
            {isForgotMode ? "Reset your password securely" : "Sign in to manage your daily progress report"}
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {!isForgotMode ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Work Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@nexora.com"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400">Password</label>
                <button 
                  type="button" 
                  onClick={() => setIsForgotMode(true)}
                  className="text-xs font-semibold text-nexora-blue hover:text-nexora-purple transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-sm rounded-xl glass-input placeholder-slate-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-nexora-blue via-nexora-indigo to-nexora-purple text-white shadow-glow-purple hover:brightness-110 active:scale-[0.98] transition-all duration-300 cursor-pointer flex justify-center items-center"
            >
              {isLoading ? (
                <div className="h-4.5 w-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                "Authenticate Account"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-5">
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Work Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. alex@nexora.com"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-nexora-blue to-nexora-indigo text-white hover:brightness-110 transition-all duration-300 cursor-pointer flex justify-center items-center"
            >
              {isLoading ? (
                <div className="h-4.5 w-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                "Send Password Reset Link"
              )}
            </button>

            {/* Back to Login link */}
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => { setIsForgotMode(false); setError(''); setSuccessMessage(''); }}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Quick Testing Credential Access Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800/60">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center mb-3.5 flex items-center justify-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-nexora-purple" />
            Quick Credential Auto-Fill
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="px-2 py-2 text-[10px] font-bold rounded-lg border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 transition-all duration-200 cursor-pointer text-center"
            >
              Admin (Trivin)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('member')}
              className="px-2 py-2 text-[10px] font-bold rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 transition-all duration-200 cursor-pointer text-center"
            >
              Aakashraj
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('member2')}
              className="px-2 py-2 text-[10px] font-bold rounded-lg border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 text-pink-400 transition-all duration-200 cursor-pointer text-center"
            >
              Gopika
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
