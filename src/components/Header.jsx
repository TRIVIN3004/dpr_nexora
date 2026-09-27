import React, { useState, useEffect } from 'react';
import { Bell, Search, LogOut, ChevronDown, Check, User, Activity, Sun, Moon } from 'lucide-react';
import { 
  getCurrentUser, 
  markNotificationRead, 
  markAllNotificationsRead
} from '../utils/database';
import { useDatabaseStore } from '../context/DatabaseContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({ onSearchChange, searchValue, pageTitle, onLogout, onUserChanged }) {
  const [user, setUser] = useState(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const { theme, toggleTheme, isLight } = useTheme();
  const { users: dbUsers, notifications: dbNotifications, invalidateStore } = useDatabaseStore();

  useEffect(() => {
    const currUser = getCurrentUser();
    setUser(currUser);
  }, []);

  const notifications = user ? dbNotifications.filter(n => n.userId === user.id) : [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (id) => {
    await markNotificationRead(id);
    invalidateStore('notifications');
  };

  const handleMarkAllRead = async () => {
    if (user) {
      await markAllNotificationsRead(user.id);
      invalidateStore('notifications');
    }
  };

  const handleSwitchRole = (targetEmail) => {
    sessionStorage.setItem("login_prefill_email", targetEmail);
    setShowProfileDropdown(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-6 bg-white/95 dark:bg-[#0b0f19] border-b border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg text-slate-900 dark:text-white backdrop-blur-md transition-colors duration-200">
      
      {/* Search Bar / Title */}
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-xl font-black text-slate-900 dark:text-white hidden md:block select-none font-sans tracking-wide">
          {pageTitle}
        </h2>
        
        {/* Global Search with Frosted Glass */}
        <div className="relative w-full max-w-xs md:max-w-md ml-0 md:ml-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search employees, projects, or reports..."
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all duration-200"
          />
        </div>
      </div>

      {/* Action Badges & Profile */}
      <div className="flex items-center gap-3">
        
        {/* Quick Testing Role Switcher in Header */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-white">
          <Activity className="h-3 w-3 text-cyan-600 dark:text-cyan-400 animate-pulse" />
          <span className="text-slate-600 dark:text-slate-300 font-semibold">Testing:</span>
          <select 
            value={user?.email || ''} 
            onChange={(e) => handleSwitchRole(e.target.value)}
            className="bg-transparent text-slate-900 dark:text-white font-bold border-none focus:outline-none cursor-pointer"
          >
            {dbUsers.map(u => (
              <option key={u.id} value={u.email} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {u.role === 'admin' ? `Admin (${u.name})` : `${u.name} (Member)`}
              </option>
            ))}
          </select>
        </div>

        {/* Light / Dark Mode Toggle Button */}
        <button 
          onClick={toggleTheme}
          title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
          className="relative px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white focus:outline-none transition-all duration-200 cursor-pointer shadow-sm flex items-center gap-1.5 group active:scale-[0.96]"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isLight ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-black text-amber-700">Light</span>
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -90, scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <Moon className="h-4 w-4 text-cyan-300" />
                <span className="text-xs font-black text-slate-200">Dark</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none transition-all duration-200 cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5 text-slate-800 dark:text-white" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)] animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifDropdown(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2.5 w-80 z-20 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead} 
                        className="text-xs text-indigo-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/10">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`px-4 py-3 cursor-pointer text-left transition-all ${
                            notif.read ? 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5' : 'bg-indigo-50 dark:bg-indigo-500/10 text-slate-900 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-500/15'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{notif.title}</span>
                            {!notif.read && <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-indigo-600 dark:bg-cyan-400" />}
                          </div>
                          <p className="text-[11px] leading-relaxed mt-1 text-slate-600 dark:text-slate-200">
                            {notif.message}
                          </p>
                          <span className="text-[9px] text-slate-400 mt-2 block">
                            {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                            {new Date(notif.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Info */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2.5 p-1.5 rounded-full md:pr-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 transition-all duration-200 cursor-pointer"
          >
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
              alt={user?.name} 
              className="h-8 w-8 rounded-full object-cover border-2 border-indigo-500/50 bg-slate-800"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">{user?.name}</span>
              <span className="text-[10px] text-indigo-600 dark:text-cyan-300 font-semibold capitalize">{user?.role}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300 hidden md:block" />
          </button>

          <AnimatePresence>
            {showProfileDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 z-20 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white"
                >
                  <div className="p-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                  
                  <div className="p-1.5 space-y-1">
                    <button 
                      onClick={() => { setShowProfileDropdown(false); window.location.hash = '#settings'; }} 
                      className="w-full text-left px-3.5 py-2.5 text-xs text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold cursor-pointer"
                    >
                      <User className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400" />
                      Profile Settings
                    </button>
                    <button 
                      onClick={() => { setShowProfileDropdown(false); onLogout(); }} 
                      className="w-full text-left px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
}
