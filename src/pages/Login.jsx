import React, { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { loginUser, simulatePasswordReset } from '../utils/database';
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

    setTimeout(async () => {
      const res = await loginUser(email, password);
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

    setTimeout(async () => {
      const res = await simulatePasswordReset(forgotEmail);
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
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden portal-grey-mesh select-none">
      
      {/* Zero-Egress GPU Animated Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-slate-600/15 blur-[130px] pointer-events-none animate-float-1" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none animate-float-2" />
      <div className="absolute top-2/3 left-1/3 w-[350px] h-[350px] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none animate-float-3" />
      <div className="absolute inset-0 bg-grid-slate-pattern opacity-35 pointer-events-none" />
      <div className="absolute inset-0 bg-dots-grey opacity-20 pointer-events-none" />

      {/* Main Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-2xl p-7 md:p-8 shadow-2xl border border-slate-800/80 bg-slate-900/90 backdrop-blur-2xl relative z-10 text-left"
      >
        {/* Sleek Circular Brand Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-indigo-500/25 blur-lg" />
            <div className="relative h-16 w-16 rounded-full bg-black border-2 border-indigo-500/60 p-1 shadow-lg shadow-indigo-950/80 flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.png" 
                alt="GoNexora Techs Logo" 
                className="h-full w-full object-cover rounded-full scale-105" 
              />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight font-sans">
            GoNexora Techs
          </h1>
          <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/70 text-[10px] font-bold text-indigo-300 tracking-wider uppercase">
            {isForgotMode ? "Password Recovery" : "Building Tomorrow, Today • DPR Portal"}
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {!isForgotMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Work Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@nexora.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-950/70 border border-slate-700/80 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <button 
                  type="button" 
                  onClick={() => setIsForgotMode(true)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-950/70 border border-slate-700/80 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 cursor-pointer flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                "Authenticate Account"
              )}
            </button>

            {/* Quick Demo Sign-in */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400 text-center mb-2">
                Quick Demo Accounts
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin')}
                  className="py-1.5 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white transition-all text-center cursor-pointer"
                >
                  Admin (Trivin)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('member')}
                  className="py-1.5 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white transition-all text-center cursor-pointer"
                >
                  Member (Aakash)
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Work Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. name@nexora.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-950/70 border border-slate-700/80 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:brightness-110 transition-all duration-200 cursor-pointer flex justify-center items-center"
            >
              {isLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                "Send Password Reset Link"
              )}
            </button>

            {/* Back to Login link */}
            <div className="text-center pt-2">
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
      </motion.div>
    </div>
  );
}
