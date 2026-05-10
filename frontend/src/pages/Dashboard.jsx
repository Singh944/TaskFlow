import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Shield, CheckCircle2, Clock, AlertCircle, FolderKanban, Activity, ArrowUpRight, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const openUsersModal = async (role) => {
    setActiveModal(role);
    if (usersList.length > 0) return;
    setLoadingMembers(true);
    try {
      const res = await api.get('/users');
      setUsersList(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-primary-600 animate-spin"></div>
    </div>
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const progressPercentage = stats?.total_tasks 
    ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {user?.role === 'ADMIN' ? "System-wide metrics and activity." : "Your assigned tasks and progress."}
          </p>
        </div>
      </motion.div>

      {user?.role === 'ADMIN' ? (
        <>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
            <StatCard icon={<FolderKanban size={20} />} title="Total Projects" value={stats?.total_projects} color="slate" onClick={() => navigate('/projects')} />
            <StatCard icon={<Shield size={20} />} title="Total Admins" value={stats?.total_admins} color="indigo" onClick={() => openUsersModal('ADMIN')} />
            <StatCard icon={<Users size={20} />} title="Total Members" value={stats?.total_members} color="blue" onClick={() => openUsersModal('MEMBER')} />
          </motion.div>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard icon={<LayoutDashboard size={20} />} title="Total Tasks" value={stats?.total_tasks} color="violet" onClick={() => navigate('/tasks')} />
            <StatCard icon={<CheckCircle2 size={20} />} title="Completed" value={stats?.completed_tasks} color="emerald" onClick={() => navigate('/tasks?status=DONE')} />
            <StatCard icon={<Clock size={20} />} title="Pending" value={stats?.pending_tasks} color="amber" onClick={() => navigate('/tasks?filter=pending')} />
            <StatCard icon={stats?.overdue_tasks > 0 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />} title={stats?.overdue_tasks > 0 ? "Overdue" : "No Overdue Tasks"} value={stats?.overdue_tasks} color={stats?.overdue_tasks > 0 ? "rose" : "emerald"} alert={stats?.overdue_tasks > 0} onClick={() => navigate('/tasks?filter=overdue')} />
          </motion.div>
        </>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={<LayoutDashboard size={20} />} title="Assigned Tasks" value={stats?.total_tasks} color="violet" onClick={() => navigate('/tasks')} />
          <StatCard icon={<CheckCircle2 size={20} />} title="Completed" value={stats?.completed_tasks} color="emerald" onClick={() => navigate('/tasks?status=DONE')} />
          <StatCard icon={<Clock size={20} />} title="Pending" value={stats?.pending_tasks} color="amber" onClick={() => navigate('/tasks?filter=pending')} />
          <StatCard icon={stats?.overdue_tasks > 0 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />} title={stats?.overdue_tasks > 0 ? "Overdue" : "No Overdue Tasks"} value={stats?.overdue_tasks} color={stats?.overdue_tasks > 0 ? "rose" : "emerald"} alert={stats?.overdue_tasks > 0} onClick={() => navigate('/tasks?filter=overdue')} />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        
        {/* Progress Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-subtle border border-slate-200/60 p-6 sm:p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Activity className="mr-2 text-slate-400" size={20} /> Task Progress
            </h3>
            <span className="text-3xl font-bold text-slate-900 tracking-tight">{progressPercentage}%</span>
          </div>
          
          {stats?.total_tasks === 0 ? (
             <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                <p className="text-sm font-medium text-slate-500">No tasks created yet.</p>
             </div>
          ) : (
            <div className="space-y-6">
              <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                  className="absolute top-0 left-0 h-full bg-slate-900 rounded-full"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Completed</p>
                  <p className="text-xl font-bold text-slate-800">{stats.completed_tasks}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">In Progress</p>
                  <p className="text-xl font-bold text-slate-800">{stats.total_tasks - stats.completed_tasks - stats.pending_tasks || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Todo</p>
                  <p className="text-xl font-bold text-slate-800">{stats.pending_tasks}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions / Highlights */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-slate-900 rounded-2xl shadow-premium p-6 sm:p-8 text-white relative overflow-hidden"
        >
          <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-primary-500 rounded-full mix-blend-screen filter blur-[60px] opacity-30"></div>
          
          <h3 className="text-lg font-semibold mb-6 relative z-10">Weekly Focus</h3>
          
          {stats?.overdue_tasks > 0 ? (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-4 relative z-10">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-rose-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <h4 className="text-sm font-semibold text-rose-200">Attention Needed</h4>
                  <p className="text-xs text-rose-200/70 mt-1 leading-relaxed">
                    You have {stats.overdue_tasks} overdue {stats.overdue_tasks === 1 ? 'task' : 'tasks'}. Prioritize clearing these first.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4 relative z-10">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="text-emerald-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-200">On Track</h4>
                  <p className="text-xs text-emerald-200/70 mt-1 leading-relaxed">
                    No overdue tasks! Keep up the great work and maintain this momentum.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-700/50 relative z-10">
            <a href="/tasks" className="group flex items-center justify-between w-full text-sm font-medium text-slate-300 hover:text-white transition-colors">
              <span>Go to your tasks</span>
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                <ArrowUpRight size={16} />
              </div>
            </a>
          </div>
        </motion.div>
      </div>
      
      {/* Users Modal */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden pointer-events-auto border border-slate-100 flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center">
                    {activeModal === 'ADMIN' ? <Shield className="mr-2 text-indigo-600" size={18} /> : <Users className="mr-2 text-indigo-600" size={18} />} 
                    {activeModal === 'ADMIN' ? 'System Admins' : 'Total Members'}
                  </h2>
                  <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 bg-white rounded-md shadow-sm border border-slate-200 hover:bg-slate-50"><X size={16} /></button>
                </div>
                <div className="p-4 overflow-y-auto">
                  {loadingMembers ? (
                    <div className="flex justify-center py-8"><div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin"></div></div>
                  ) : usersList.filter(u => u.role === activeModal).length === 0 ? (
                    <div className="text-center py-8"><p className="text-sm font-medium text-slate-500">No {activeModal === 'ADMIN' ? 'admins' : 'members'} found</p></div>
                  ) : (
                    <div className="space-y-3">
                      {usersList.filter(u => u.role === activeModal).map(member => (
                        <div key={member.id} className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-subtle transition-all cursor-default group">
                          <div className="h-10 w-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold shadow-sm">{member.name.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{member.name}</p>
                            <p className="text-xs text-slate-500 truncate">{member.email}</p>
                          </div>
                          <div className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold uppercase tracking-wider border border-indigo-100">{member.role}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ icon, title, value, color = 'slate', alert, onClick }) => {
  const item = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 25 } }
  };

  const colorStyles = {
    slate: { border: 'border-slate-200/60 hover:border-slate-300 hover:shadow-slate-500/10', icon: 'bg-slate-50 text-slate-600 group-hover:bg-slate-100 group-hover:text-slate-800', arrow: 'group-hover:text-slate-600', text: 'text-slate-900' },
    indigo: { border: 'border-slate-200/60 hover:border-indigo-300 hover:shadow-indigo-500/10 hover:ring-1 hover:ring-indigo-50', icon: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-800', arrow: 'group-hover:text-indigo-600', text: 'text-slate-900' },
    blue: { border: 'border-slate-200/60 hover:border-blue-300 hover:shadow-blue-500/10 hover:ring-1 hover:ring-blue-50', icon: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-800', arrow: 'group-hover:text-blue-600', text: 'text-slate-900' },
    violet: { border: 'border-slate-200/60 hover:border-violet-300 hover:shadow-violet-500/10 hover:ring-1 hover:ring-violet-50', icon: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100 group-hover:text-violet-800', arrow: 'group-hover:text-violet-600', text: 'text-slate-900' },
    emerald: { border: 'border-slate-200/60 hover:border-emerald-300 hover:shadow-emerald-500/10 hover:ring-1 hover:ring-emerald-50', icon: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:text-emerald-800', arrow: 'group-hover:text-emerald-600', text: 'text-emerald-700' },
    amber: { border: 'border-slate-200/60 hover:border-amber-300 hover:shadow-amber-500/10 hover:ring-1 hover:ring-amber-50', icon: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100 group-hover:text-amber-800', arrow: 'group-hover:text-amber-600', text: 'text-amber-700' },
    rose: { border: 'border-rose-300 ring-1 ring-rose-100 shadow-rose-500/15 hover:shadow-rose-500/25 hover:border-rose-400', icon: 'bg-rose-100 text-rose-600 group-hover:bg-rose-200 group-hover:text-rose-800 animate-pulse', arrow: 'group-hover:text-rose-600', text: 'text-rose-700' }
  };

  const currentStyle = colorStyles[alert ? 'rose' : color];

  return (
    <motion.div 
      variants={item}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-subtle p-6 transition-all duration-300 group relative overflow-hidden ${currentStyle.border} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {alert && <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500"></div>}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl flex items-center justify-center transition-colors duration-300 ${currentStyle.icon}`}>
            {icon}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
            <h3 className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${currentStyle.text}`}>
              {value || 0}
            </h3>
          </div>
        </div>
        {onClick && (
          <div className={`text-slate-300 transition-all transform duration-300 group-hover:translate-x-1 ${currentStyle.arrow}`}>
            <ArrowRight size={16} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Dashboard;
