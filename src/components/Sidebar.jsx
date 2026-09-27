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
    <div className="flex flex-col h-full sidebar-grey-mesh border-r border-slate-800/60 select-none relative overflow-hidden">
      
      {/* Grey Ambient Atmospheric Background Effects */}
      <div className="absolute inset-0 bg-dots-grey opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-slate-700/15 via-slate-800/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/3 -left-12 w-44 h-44 rounded-full bg-slate-600/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 right-0 w-36 h-36 rounded-full bg-slate-700/10 blur-3xl pointer-events-none" />

      {/* Brand Logo Header */}
      <div className="relative z-10 flex h-16 items-center justify-between px-6 border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="GoNexora Logo" 
            className="h-10 w-10 rounded-full object-cover border border-indigo-500/50 shadow-md bg-black p-0.5" 
          />
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <span className="text-sm font-bold bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent">
                GoNexora Techs
              </span>
              <span className="text-[9px] text-slate-400 font-medium tracking-widest uppercase">
                DPR & Attendance
              </span>
            </motion.div>
          )}
        </div>

        {/* Desktop Collapse Trigger */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Mobile Close Trigger */}
        <button 
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
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
              className={`w-full relative flex items-center gap-3.5 py-3 px-4 rounded-xl text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer ${
                isActive 
                  ? 'text-white bg-gradient-to-r from-nexora-indigo/30 to-nexora-purple/5 border-l-2 border-nexora-purple' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 transition-all duration-300 ${isActive ? 'text-nexora-purple scale-110 shadow-glow-purple' : 'text-slate-400'}`} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && !isCollapsed && (
                <motion.div 
                  layoutId="activeGlow"
                  className="absolute right-2 h-1.5 w-1.5 rounded-full bg-nexora-purple"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Account Details */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 relative z-10">
        <div className="flex items-center gap-3">
          <img 
            src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
            alt={user?.name} 
            className="h-9 w-9 rounded-full object-cover border border-slate-800 bg-slate-900"
          />
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col text-left truncate"
            >
              <span className="text-xs font-bold text-slate-200 truncate">{user?.name}</span>
              <span className="text-[10px] text-slate-500 font-medium capitalize truncate">{user?.role}</span>
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
