import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Calendar, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X,
  FilePlus,
  Terminal,
  CalendarCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser } from '../utils/database';

export default function Sidebar({ currentTab, onTabChange, isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getCurrentUser());
    const handleStorageChange = () => {
      setUser(getCurrentUser());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('database_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('database_updated', handleStorageChange);
    };
  }, []);

  const isAdmin = user?.role === 'admin';

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'member'] },
    { id: 'dpr-form', label: 'Submit DPR', icon: FilePlus, roles: ['member'] },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'member'] },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['admin', 'member'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'member'] },
    { id: 'calendar', label: 'Calendar', icon: Calendar, roles: ['admin', 'member'] },
    { id: 'team-management', label: 'Team', icon: Users, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'member'] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(user?.role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full sidebar-grey-mesh border-r border-slate-800/80 select-none relative overflow-hidden">
      
      {/* Grey Ambient Atmospheric Background Effects */}
      <div className="absolute inset-0 bg-dots-grey opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-slate-700/15 via-slate-800/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/3 -left-12 w-44 h-44 rounded-full bg-slate-600/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 right-0 w-36 h-36 rounded-full bg-slate-700/10 blur-3xl pointer-events-none" />

      {/* Brand Logo Header */}
      <div className="relative z-10 flex h-16 items-center justify-between px-6 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="GoNexora Logo" 
            className="h-10 w-10 rounded-full object-cover border border-indigo-400/60 shadow-md bg-black p-0.5" 
          />
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <span className="text-sm font-black text-white tracking-wide">
                GoNexora Techs
              </span>
              <span className="text-[9px] text-indigo-300 font-bold tracking-widest uppercase">
                DPR & Attendance
              </span>
            </motion.div>
          )}
        </div>

        {/* Desktop Collapse Trigger */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white cursor-pointer transition-colors backdrop-blur-md shadow-sm"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-white" /> : <ChevronLeft className="h-3.5 w-3.5 text-white" />}
        </button>

        {/* Mobile Close Trigger */}
        <button 
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-slate-300 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav List with Glassy Effects and Pure White Fonts */}
      <nav className="flex-1 space-y-2 px-3.5 py-6 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setMobileOpen(false);
              }}
              className={`w-full group relative flex items-center gap-3.5 py-3 px-4 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'text-white bg-gradient-to-r from-indigo-600/35 via-purple-600/25 to-cyan-500/15 backdrop-blur-xl border border-indigo-400/50 shadow-lg shadow-indigo-500/20' 
                  : 'text-white hover:text-white hover:bg-white/10 hover:backdrop-blur-md hover:border hover:border-white/10'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 transition-all duration-200 ${isActive ? 'text-cyan-300 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-200 group-hover:text-white group-hover:scale-105'}`} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 }}
                  className="truncate text-white font-semibold"
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && !isCollapsed && (
                <motion.div 
                  layoutId="activeGlow"
                  className="absolute right-2.5 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Account Details with Frosted Glass */}
      <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <img 
            src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
            alt={user?.name} 
            className="h-9 w-9 rounded-full object-cover border-2 border-indigo-400/50 shadow-md bg-slate-900"
          />
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col text-left truncate"
            >
              <span className="text-sm font-bold text-white truncate tracking-wide">{user?.name}</span>
              <span className="text-[11px] text-cyan-300 font-semibold uppercase tracking-wider truncate">{user?.role}</span>
            </motion.div>
          )}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar wrapper */}
      <aside className={`hidden md:block h-screen flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Trigger (Sticky Bar) */}
      <div className="md:hidden fixed top-0.5 left-4 z-40 h-15 flex items-center justify-center">
        <button 
          onClick={() => setMobileOpen(true)}
          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Sidebar overlay drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 z-50 w-64 md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
