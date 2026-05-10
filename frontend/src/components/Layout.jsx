import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { LayoutDashboard, FolderKanban, LogOut, CheckSquare, Menu, X, Bell, CheckCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Projects', path: '/projects', icon: <FolderKanban size={18} /> },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ name: 'All Tasks', path: '/tasks', icon: <CheckSquare size={18} /> });
    navItems.push({ name: 'My Tasks', path: '/my-tasks', icon: <CheckSquare size={18} /> });
  } else {
    navItems.push({ name: 'My Tasks', path: '/my-tasks', icon: <CheckSquare size={18} /> });
  }

  const pageTransition = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.2, ease: "easeOut" }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans selection:bg-primary-100 selection:text-primary-900">
      
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">TeamPilot</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex flex-col h-[calc(100vh-4rem)]">
          <div className="mb-4 px-3 mt-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overview</p>
          </div>
          
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group
                    ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-100'}`
                  }
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav" 
                      className="absolute inset-0 bg-slate-800/80 rounded-lg shadow-subtle border border-slate-700/50" 
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="mr-3 relative z-10">{item.icon}</span>
                  <span className="relative z-10">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile Area at Bottom */}
          <div className="mt-auto pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        {/* Top Navbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center">
            <button 
              className="lg:hidden text-slate-500 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 transition-colors mr-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>
          
          <div className="flex items-center ml-auto space-x-3 relative z-50">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 transition-colors rounded-full relative focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${notificationsOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              >
                <Bell size={18} />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"
                    />
                  )}
                </AnimatePresence>
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-slate-100 flex flex-col z-[100] origin-top-right overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                      <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto overscroll-contain">
                      {notifications.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="py-12 text-center flex flex-col items-center justify-center"
                        >
                          <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle size={24} />
                          </div>
                          <p className="text-sm font-bold text-slate-900">You're all caught up</p>
                          <p className="text-xs text-slate-500 mt-1">No new notifications right now.</p>
                        </motion.div>
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          <AnimatePresence>
                            {notifications.map((notif) => (
                              <motion.li 
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                key={notif.id} 
                                onClick={() => markAsRead(notif.id)}
                                className={`p-4 transition-colors flex items-start space-x-3 cursor-pointer ${!notif.read ? 'bg-primary-50/30 hover:bg-primary-50/50' : 'bg-white hover:bg-slate-50 opacity-70'}`}
                              >
                                <div className={`shrink-0 p-2 rounded-xl mt-0.5 transition-opacity ${
                                  notif.type === 'task' ? 'bg-primary-50' : 
                                  notif.type === 'project' ? 'bg-emerald-50' : 
                                  notif.type === 'alert' ? 'bg-rose-50' : 'bg-indigo-50'
                                }`}>
                                  {notif.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <p className={`text-sm font-semibold truncate pr-2 transition-colors ${!notif.read ? 'text-slate-900' : 'text-slate-600'}`}>
                                      {notif.title}
                                    </p>
                                    <span className={`text-[10px] font-medium whitespace-nowrap shrink-0 pt-0.5 transition-colors ${!notif.read ? 'text-primary-600' : 'text-slate-400'}`}>{notif.time}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                    {notif.desc}
                                  </p>
                                </div>
                                <div className={`w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5 transition-all duration-300 ${notif.read ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}></div>
                              </motion.li>
                            ))}
                          </AnimatePresence>
                        </ul>
                      )}
                    </div>
                    
                    <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-center shrink-0">
                      <button 
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full py-1"
                      >
                        Mark all as read
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 p-2 text-slate-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 text-sm font-medium"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname}
              {...pageTransition}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;
