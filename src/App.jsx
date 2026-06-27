import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DprForm from './pages/DprForm';
import AdminReports from './pages/AdminReports';
import Analytics from './pages/Analytics';
import CalendarView from './pages/CalendarView';
import TeamManagement from './pages/TeamManagement';
import Settings from './pages/Settings';
import ForcePasswordChange from './pages/ForcePasswordChange';
import { getCurrentUser, setCurrentUser } from './utils/mockDatabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [searchValue, setSearchValue] = useState('');
  
  // Responsive sidebar collapse controls
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Success notifications
  const [globalToast, setGlobalToast] = useState('');

  useEffect(() => {
    // Check session
    const currUser = getCurrentUser();
    setUser(currUser);

    // Support deep link or page reloading routing based on window location hash
    const handleHashRouting = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['dashboard', 'dpr-form', 'reports', 'analytics', 'calendar', 'team-management', 'settings'];
      if (validTabs.includes(hash)) {
        // Double-check admin access limit
        if (hash === 'team-management' && currUser?.role !== 'admin') {
          setCurrentTab('dashboard');
        } else {
          setCurrentTab(hash);
        }
      }
    };

    window.addEventListener('hashchange', handleHashRouting);
    handleHashRouting();

    // Listen for tab redirection from subcomponents
    const handleSwitchTab = (e) => {
      const tabId = e.detail;
      setCurrentTab(tabId);
      window.location.hash = `#${tabId}`;
    };

    window.addEventListener('switch_tab', handleSwitchTab);

    // Listen for database changes to sync active user state
    const handleDatabaseUpdated = () => {
      const activeUser = getCurrentUser();
      if (activeUser) {
        setUser(activeUser);
      }
    };
    window.addEventListener('database_updated', handleDatabaseUpdated);

    return () => {
      window.removeEventListener('hashchange', handleHashRouting);
      window.removeEventListener('switch_tab', handleSwitchTab);
      window.removeEventListener('database_updated', handleDatabaseUpdated);
    };
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setCurrentTab('dashboard');
    window.location.hash = '#dashboard';
    showToast(`Welcome back, ${loggedInUser.name}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
    window.location.hash = '';
    setCurrentTab('dashboard');
  };

  const handleUserSessionSwapped = (swappedUser) => {
    setUser(swappedUser);
    showToast(`Switched active profile to ${swappedUser.name}`);
  };

  const showToast = (message) => {
    setGlobalToast(message);
    setTimeout(() => setGlobalToast(''), 3000);
  };

  const onTabSelect = (tabId) => {
    setCurrentTab(tabId);
    window.location.hash = `#${tabId}`;
    setSearchValue(''); // reset search when swapping modules
  };

  // Determine current tab header title
  const getPageTitle = () => {
    const titles = {
      'dashboard': 'Work Progress Dashboard',
      'dpr-form': 'Submit Daily Progress Report (DPR)',
      'reports': 'Daily Reports Registry',
      'analytics': 'Team Analytics Insights',
      'calendar': 'Monthly Submissions Calendar',
      'team-management': 'Team Members Management',
      'settings': 'Settings & Parameters'
    };
    return titles[currentTab] || 'Nexora Portal';
  };

  // Render correct page viewport
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard searchFilter={searchValue} onNavigate={onTabSelect} />;
      case 'dpr-form':
        return <DprForm onActionSuccess={showToast} />;
      case 'reports':
        return <AdminReports searchFilter={searchValue} />;
      case 'analytics':
        return <Analytics />;
      case 'calendar':
        return <CalendarView />;
      case 'team-management':
        return <TeamManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard searchFilter={searchValue} onNavigate={onTabSelect} />;
    }
  };

  // If user is not authenticated, show login page
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-slate-900">
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Force password change on first login
  if (user && user.mustChangePassword) {
    return (
      <ForcePasswordChange 
        currentUser={user} 
        onPasswordChanged={(updatedUser) => {
          setUser(updatedUser);
          showToast("Password updated. Welcome to Nexora DPR Portal!");
        }} 
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-900 overflow-hidden text-slate-100">
      
      {/* Toast Alert popup */}
      <AnimatePresence>
        {globalToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-nexora-purple shadow-glow-purple text-xs text-slate-100 font-semibold flex items-center gap-2"
          >
            <span className="h-2 w-2 rounded-full bg-nexora-purple animate-ping" />
            {globalToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive Sidebar component */}
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={onTabSelect}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main viewport workspace wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Header navigation bar */}
        <Header 
          pageTitle={getPageTitle()} 
          onSearchChange={setSearchValue}
          searchValue={searchValue}
          onLogout={handleLogout}
          onUserChanged={handleUserSessionSwapped}
        />

        {/* Content viewport area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/25 flex flex-col justify-between">
          
          {/* Animated Page Transitions */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Premium layout footer */}
          <footer className="mt-8 pt-6 border-t border-darkBg-border/20 text-center select-none text-[10px] tracking-widest font-semibold text-slate-600 uppercase flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© {new Date().getFullYear()} Nexora Technologies</span>
            <span className="bg-gradient-to-r from-nexora-blue to-nexora-purple bg-clip-text text-transparent">
              Building Tomorrow, Today.
            </span>
          </footer>

        </main>
      </div>

    </div>
  );
}
