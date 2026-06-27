import React, { useState, useEffect } from 'react';
import { Bell, Search, LogOut, ChevronDown, Check, User, Activity } from 'lucide-react';
import { 
  getCurrentUser, 
  getDatabase, 
  markNotificationRead, 
  markAllNotificationsRead,
  setCurrentUser 
} from '../utils/mockDatabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({ onSearchChange, searchValue, pageTitle, onLogout, onUserChanged }) {
  const [user, setUser] = useState(null);
  const [db, setDb] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    const currUser = getCurrentUser();
    setUser(currUser);

    const database = getDatabase();
    setDb(database);
    if (currUser) {
      setNotifications(database.notifications.filter(n => n.userId === currUser.id));
    }

    // Set up a listener for storage events to update UI state across dashboard updates
    const handleStorageChange = () => {
      const updatedUser = getCurrentUser();
      const updatedDb = getDatabase();
      setUser(updatedUser);
      setDb(updatedDb);
      if (updatedUser) {
        setNotifications(updatedDb.notifications.filter(n => n.userId === updatedUser.id));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('database_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('database_updated', handleStorageChange);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (id) => {
    markNotificationRead(id);
    window.dispatchEvent(new Event('database_updated'));
  };

  const handleMarkAllRead = () => {
    if (user) {
      markAllNotificationsRead(user.id);
      window.dispatchEvent(new Event('database_updated'));
    }
  };

  const handleSwitchRole = (targetEmail) => {
    const database = getDatabase();
    const targetUser = database.users.find(u => u.email === targetEmail);
    if (targetUser) {
      setCurrentUser(targetUser);
      setUser(targetUser);
      setNotifications(database.notifications.filter(n => n.userId === targetUser.id));
      setShowProfileDropdown(false);
      window.dispatchEvent(new Event('database_updated'));
      if (onUserChanged) onUserChanged(targetUser);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-6 glass-panel border-b border-darkBg-border/50">
      
      {/* Search Bar / Title */}
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-xl font-bold text-slate-100 hidden md:block select-none font-sans tracking-wide">
          {pageTitle}
        </h2>
        
        {/* Global Search */}
        <div className="relative w-full max-w-xs md:max-w-md ml-0 md:ml-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search employees, projects, or reports..."
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-950/40 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-nexora-purple/50 focus:ring-1 focus:ring-nexora-purple/20 transition-all duration-300"
          />
        </div>
      </div>

      {/* Action Badges & Profile */}
      <div className="flex items-center gap-4">
        
        {/* Quick Testing Role Switcher in Header */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400">
          <Activity className="h-3 w-3 animate-pulse" />
          <span>Testing Mode:</span>
          <select 
            value={user?.email || ''} 
            onChange={(e) => handleSwitchRole(e.target.value)}
            className="bg-transparent text-slate-200 border-none font-semibold focus:outline-none cursor-pointer"
          >
            {db?.users.map(u => (
              <option key={u.id} value={u.email} className="bg-slate-900 text-slate-200">
                {u.role === 'admin' ? `Admin (${u.name})` : `${u.name} (Member)`}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 focus:outline-none transition-all duration-300"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-nexora-purple animate-pulse" />
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
                  className="absolute right-0 mt-2.5 w-80 z-20 glass-panel rounded-2xl overflow-hidden shadow-glass border border-slate-800"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/40">
                    <span className="font-semibold text-sm text-slate-200">Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead} 
                        className="text-xs text-nexora-blue hover:text-nexora-purple font-medium cursor-pointer transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/40">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-500">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`px-4 py-3 cursor-pointer text-left transition-all ${
                            notif.read ? 'bg-transparent text-slate-400 hover:bg-slate-800/20' : 'bg-nexora-purple/5 text-slate-200 hover:bg-nexora-purple/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold">{notif.title}</span>
                            {!notif.read && <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-nexora-purple" />}
                          </div>
                          <p className="text-[11px] leading-relaxed mt-1 text-slate-300">
                            {notif.message}
                          </p>
                          <span className="text-[9px] text-slate-500 mt-2 block">
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
            className="flex items-center gap-2.5 p-1 rounded-full md:pr-3 hover:bg-slate-800/30 transition-all duration-300"
          >
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
              alt={user?.name} 
              className="h-8 w-8 rounded-full object-cover border border-slate-700 bg-slate-800"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200">{user?.name}</span>
              <span className="text-[10px] text-slate-500 capitalize">{user?.role}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 hidden md:block" />
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
                  className="absolute right-0 mt-2 w-48 z-20 glass-panel rounded-2xl overflow-hidden shadow-glass border border-slate-800"
                >
                  <div className="p-3.5 border-b border-slate-800 bg-slate-950/20">
                    <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                  </div>
                  
                  <div className="p-1">
                    <div className="lg:hidden flex flex-col p-2 gap-1 border-b border-slate-800/40">
                      <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Switch Profile:</span>
                      {db?.users.slice(0, 6).map(u => (
                        <button 
                          key={u.id}
                          onClick={() => handleSwitchRole(u.email)}
                          className={`text-xs text-left p-1.5 rounded-lg flex items-center justify-between ${user?.email === u.email ? 'text-nexora-purple' : 'text-slate-400'}`}
                        >
                          {u.name} ({u.role === 'admin' ? 'Admin' : 'Member'})
                          {user?.email === u.email && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => { setShowProfileDropdown(false); window.location.hash = '#settings'; }} 
                      className="w-full text-left px-3.5 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/40 rounded-xl transition-all duration-200 flex items-center gap-2"
                    >
                      <User className="h-3.5 w-3.5" />
                      Profile Settings
                    </button>
                    <button 
                      onClick={() => { setShowProfileDropdown(false); onLogout(); }} 
                      className="w-full text-left px-3.5 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all duration-200 flex items-center gap-2"
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
