import { useState, useEffect } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Search, AlertCircle, Clock, CheckCircle2, ListTodo, Zap, Filter, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const TasksPage = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const location = useLocation();
  const isMyTasks = location.pathname === '/my-tasks';
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [overdueFilter, setOverdueFilter] = useState(searchParams.get('filter') === 'overdue');
  const [pendingFilter, setPendingFilter] = useState(searchParams.get('filter') === 'pending');

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (search) params.append('search', search);
      if (isMyTasks) params.append('assignee_id', user.id);
      
      const res = await api.get(`/tasks?${params.toString()}`);
      setTasks(res.data);
    } catch (err) {
      toast.error('Failed to fetch tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, search, isMyTasks]);

  const updateStatus = async (taskId, currentStatus, newStatus, taskTitle) => {
    if (user.role === 'MEMBER') {
      if (currentStatus === 'TODO' && newStatus !== 'IN_PROGRESS') {
        toast.error('You can only move Todo tasks to In Progress');
        return;
      }
      if (currentStatus === 'IN_PROGRESS' && newStatus !== 'DONE') {
        toast.error('You can only move In Progress tasks to Done');
        return;
      }
      if (currentStatus === 'DONE') {
        toast.error('Completed tasks cannot be reopened by members');
        return;
      }
    }

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      toast.success('Task status updated');
      if (newStatus === 'DONE') {
         addNotification({ type: 'task', title: 'Task completed', desc: `"${taskTitle}" was marked as done.`, forAdmin: true });
      }
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update task');
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'DONE') return false;
    return new Date(dueDate) < new Date();
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-primary-600 animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{user?.role === 'ADMIN' && !isMyTasks ? 'All Tasks' : 'My Tasks'}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{user?.role === 'ADMIN' && !isMyTasks ? 'Manage and oversee all system tasks.' : 'Track your progress and prioritize work.'}</p>
        </div>
      </motion.div>

      {/* Filters Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-white p-2 rounded-2xl shadow-subtle border border-slate-200/60 flex flex-col md:flex-row gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all"
          />
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer w-full md:w-36"
            >
              <option value="">All Status</option>
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)} 
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer w-full md:w-36"
            >
              <option value="">All Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <Zap size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {tasks.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-subtle border border-slate-200/60 p-16 text-center">
          <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <ListTodo size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No tasks found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter || priorityFilter || overdueFilter || pendingFilter 
              ? 'Try adjusting your filters or search query.' 
              : (user?.role === 'ADMIN' && !isMyTasks 
                  ? 'Get started by creating a task in a project.' 
                  : 'No tasks assigned to you yet.')}
          </p>
          {(search || statusFilter || priorityFilter || overdueFilter || pendingFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); setOverdueFilter(false); setPendingFilter(false); setSearchParams({}); }} className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700">
              Clear all filters
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {tasks.filter(t => {
            if (overdueFilter) return isOverdue(t.due_date, t.status);
            if (pendingFilter) return t.status !== 'DONE';
            return true;
          }).map(task => {
            const overdue = isOverdue(task.due_date, task.status);
            
            return (
              <motion.div key={task.id} variants={item} className={`bg-white rounded-2xl shadow-subtle border p-6 flex flex-col transition-all duration-300 hover:shadow-premium hover:-translate-y-1 ${overdue ? 'border-rose-200 ring-1 ring-rose-50' : 'border-slate-200/60'}`}>
                
                <div className="flex justify-between items-start mb-3">
                  <div className="flex space-x-2">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border
                      ${task.status === 'TODO' ? 'bg-slate-50 text-slate-600 border-slate-200' : 
                        task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border
                      ${task.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  {overdue && (
                    <div className="flex items-center text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2 py-1 rounded border border-rose-100">
                      <AlertCircle size={12} className="mr-1" /> Overdue
                    </div>
                  )}
                </div>
                
                <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-1.5" title={task.title}>{task.title}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">{task.description || 'No description provided.'}</p>
                
                {/* Assignee Info */}
                <div className="flex items-center space-x-3 mb-4 p-2 rounded-lg bg-slate-50/50 border border-slate-100">
                  {task.assignee ? (
                    <>
                      <div className="h-8 w-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                        {task.assignee.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{task.assignee.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{task.assignee.role === 'ADMIN' ? 'System Admin' : 'Member'}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-8 w-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                        ?
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-500 truncate">Unassigned</p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 text-[11px] font-medium mt-auto pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Project:</span>
                    <span className="truncate max-w-[150px] text-slate-700 font-bold">{task.project?.name || `ID: ${task.project_id}`}</span>
                  </div>
                  
                  {task.due_date && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">Due:</span>
                      <span className={`flex items-center space-x-1 ${overdue ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold'}`}>
                        <Clock size={12} className={overdue ? 'text-rose-600' : 'text-slate-400'} />
                        <span>{new Date(task.due_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  {user.id === task.assigned_to_id ? (
                    <>
                      {task.status === 'TODO' && (
                        <button onClick={() => updateStatus(task.id, task.status, 'IN_PROGRESS', task.title)} className="flex-1 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-semibold transition-all shadow-premium group">
                          Start Working <ArrowRight size={14} className="ml-1.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      )}
                      {task.status === 'IN_PROGRESS' && (
                        <button onClick={() => updateStatus(task.id, task.status, 'DONE', task.title)} className="flex-1 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-xs font-semibold transition-all shadow-premium">
                          <CheckCircle2 size={14} className="mr-1.5" /> Mark Complete
                        </button>
                      )}
                      {task.status === 'DONE' && (
                        <button onClick={() => updateStatus(task.id, task.status, 'TODO', task.title)} className="flex-1 flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-xs font-semibold transition-all shadow-subtle">
                          Reopen Task
                        </button>
                      )}
                    </>
                  ) : user.role === 'ADMIN' ? (
                    <>
                      <Link to={`/projects/${task.project_id}`} className="flex-1 flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-xs font-semibold transition-all shadow-subtle">
                        View Details
                      </Link>
                      {task.status === 'DONE' && (
                        <button onClick={() => updateStatus(task.id, task.status, 'TODO', task.title)} className="flex-1 flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-xs font-semibold transition-all shadow-subtle">
                          Reopen
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 py-2 rounded-xl text-xs font-semibold cursor-not-allowed">
                      <CheckCircle2 size={14} className="mr-1.5" /> {task.status.replace('_', ' ')}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default TasksPage;
