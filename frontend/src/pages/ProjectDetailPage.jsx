import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ArrowLeft, Plus, UserPlus, Clock, CheckCircle2, UserMinus, Edit2, Trash2, Calendar, FolderKanban, Users, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', priority: 'MEDIUM', assigned_to_id: '' });

  // Delete Confirm Modal
  const [confirmDeleteData, setConfirmDeleteData] = useState({ isOpen: false, type: null, id: null });

  const fetchData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project_id=${id}`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);

      if (user?.role === 'ADMIN') {
        const usersRes = await api.get('/users');
        setAllUsers(usersRes.data);
      }
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        toast.error("Project not found or access denied");
        navigate('/projects');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      await api.post(`/projects/${id}/members`, { user_id: parseInt(selectedUserId) });
      const addedUser = availableUsersToAdd.find(u => u.id === parseInt(selectedUserId));
      toast.success('Member added successfully');
      addNotification({ type: 'team', title: 'Member added', desc: `${addedUser?.name || 'A user'} was added to ${project.name}`, forAdmin: true });
      addNotification({ type: 'team', title: 'Added to Project', desc: `You were added to ${project.name}`, targetUserId: selectedUserId });
      setSelectedUserId('');
      setShowAddMember(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add member');
    }
  };

  const handleRemoveMember = async () => {
    try {
      await api.delete(`/projects/${id}/members/${confirmDeleteData.id}`);
      toast.success('Member removed');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to remove member');
    }
  };

  const handleOpenTaskModal = (task = null) => {
    if (task) {
      setIsEditMode(true);
      setCurrentTask(task);
      setNewTask({
        title: task.title,
        description: task.description || '',
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
        priority: task.priority || 'MEDIUM',
        assigned_to_id: task.assigned_to_id || ''
      });
    } else {
      setIsEditMode(false);
      setCurrentTask(null);
      setNewTask({ title: '', description: '', due_date: '', priority: 'MEDIUM', assigned_to_id: '' });
    }
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        project_id: parseInt(id),
      };
      if (newTask.due_date) payload.due_date = new Date(newTask.due_date).toISOString();
      else payload.due_date = null;
      
      if (newTask.assigned_to_id) payload.assigned_to_id = parseInt(newTask.assigned_to_id);
      else payload.assigned_to_id = null;

      if (isEditMode) {
        await api.put(`/tasks/${currentTask.id}`, payload);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created');
        addNotification({ type: 'task', title: 'Task created', desc: `New task "${newTask.title}" added to ${project.name}`, forAdmin: true });
        
        if (newTask.assigned_to_id) {
            const assignee = project.members?.find(m => m.user_id === parseInt(newTask.assigned_to_id))?.user?.name;
            addNotification({ type: 'task', title: 'Task assigned', desc: `You were assigned "${newTask.title}"`, targetUserId: newTask.assigned_to_id });
            addNotification({ type: 'task', title: 'Task assigned', desc: `"${newTask.title}" assigned to ${assignee || 'a member'}`, forAdmin: true });
        }
      }
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save task');
    }
  };

  const handleDeleteTask = async () => {
    try {
      await api.delete(`/tasks/${confirmDeleteData.id}`);
      toast.success('Task deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete task');
    }
  };

  const updateTaskStatus = async (taskId, currentStatus, newStatus, taskTitle) => {
    if (user.role === 'MEMBER') {
      if (currentStatus === 'TODO' && newStatus !== 'IN_PROGRESS') return toast.error('Can only move to In Progress');
      if (currentStatus === 'IN_PROGRESS' && newStatus !== 'DONE') return toast.error('Can only move to Done');
      if (currentStatus === 'DONE') return toast.error('Cannot reopen task');
    }
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      toast.success('Status updated');
      if (newStatus === 'DONE') {
         addNotification({ type: 'task', title: 'Task completed', desc: `"${taskTitle}" was marked as done.`, forAdmin: true });
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'DONE') return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-primary-600 animate-spin"></div>
    </div>
  );
  if (!project) return null;

  const projectMemberIds = project.members?.map(m => m.user_id) || [];
  const availableUsersToAdd = allUsers.filter(u => !projectMemberIds.includes(u.id));

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link to="/projects" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors group">
          <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-1 transition-transform" /> Back to Projects
        </Link>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white p-6 sm:p-8 rounded-2xl shadow-subtle border border-slate-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="flex items-start space-x-5">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hidden sm:block shrink-0">
            <FolderKanban size={32} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">{project.name}</h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">{project.description || 'No description provided.'}</p>
            {project.deadline && (
              <div className="flex items-center mt-4 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/60 w-fit">
                <Calendar size={14} className="mr-1.5" /> Deadline: {new Date(project.deadline).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
        
        {user?.role === 'ADMIN' && (
          <div className="flex flex-wrap gap-3 shrink-0 w-full md:w-auto">
            <button onClick={() => setShowAddMember(true)} className="flex-1 md:flex-none justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-subtle flex items-center">
              <UserPlus size={16} className="mr-2 text-slate-400" /> Manage Team
            </button>
            <button onClick={() => handleOpenTaskModal()} className="flex-1 md:flex-none justify-center bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-premium flex items-center">
              <Plus size={16} className="mr-2 text-slate-400" /> Create Task
            </button>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Left Col: Tasks */}
        <div className="xl:col-span-3 space-y-6">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={20} className="text-slate-400" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Project Tasks</h2>
          </div>
          
          {tasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-subtle border border-slate-200/60 p-12 text-center">
              <div className="h-14 w-14 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No tasks created</h3>
              <p className="text-sm text-slate-500 mt-1">Get started by creating the first task for this project.</p>
            </motion.div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tasks.map(task => {
                const overdue = isOverdue(task.due_date, task.status);
                const assignee = project.members?.find(m => m.user_id === task.assigned_to_id)?.user?.name || 'Unassigned';
                const isMyTask = task.assigned_to_id === user.id;

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
                      
                      {user.role === 'ADMIN' && (
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenTaskModal(task)} className="p-1 text-slate-400 hover:text-primary-600 rounded bg-slate-50 hover:bg-primary-50 transition-colors"><Edit2 size={14}/></button>
                          <button onClick={() => setConfirmDeleteData({ isOpen: true, type: 'task', id: task.id })} className="p-1 text-slate-400 hover:text-rose-600 rounded bg-slate-50 hover:bg-rose-50 transition-colors"><Trash2 size={14}/></button>
                        </div>
                      )}
                      
                      {!user.role && overdue && (
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
                        <span className="truncate max-w-[150px] text-slate-700 font-bold">{project?.name || `ID: ${task.project_id}`}</span>
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

                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      {user.id === task.assigned_to_id ? (
                        <>
                          {task.status === 'TODO' && (
                            <button onClick={() => updateTaskStatus(task.id, task.status, 'IN_PROGRESS', task.title)} className="flex-1 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-semibold transition-all shadow-premium group">
                              Start Working <ArrowRight size={14} className="ml-1.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                            </button>
                          )}
                          {task.status === 'IN_PROGRESS' && (
                            <button onClick={() => updateTaskStatus(task.id, task.status, 'DONE', task.title)} className="flex-1 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-xs font-semibold transition-all shadow-premium">
                              <CheckCircle2 size={14} className="mr-1.5" /> Mark Complete
                            </button>
                          )}
                          {task.status === 'DONE' && (
                            <button onClick={() => updateTaskStatus(task.id, task.status, 'TODO', task.title)} className="flex-1 flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-xs font-semibold transition-all shadow-subtle">
                              Reopen Task
                            </button>
                          )}
                        </>
                      ) : user.role === 'ADMIN' ? (
                        <>
                          <button onClick={() => handleOpenTaskModal(task)} className="flex-1 flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-xs font-semibold transition-all shadow-subtle">
                            Edit Task
                          </button>
                          {task.status === 'DONE' && (
                            <button onClick={() => updateTaskStatus(task.id, task.status, 'TODO', task.title)} className="flex-1 flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-xs font-semibold transition-all shadow-subtle">
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

        {/* Right Col: Members */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="xl:col-span-1 space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users size={20} className="text-slate-400" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Team</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-subtle border border-slate-200/60 overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200/80 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Members ({project.members?.length || 0})</h3>
            </div>
            <ul className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {project.members?.length === 0 ? (
                <li className="px-5 py-8 text-center">
                   <p className="text-sm font-medium text-slate-500">No members added yet.</p>
                </li>
              ) : (
                project.members?.map((m, i) => (
                  <motion.li 
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    key={m.user_id} 
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs shadow-sm">
                        {m.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{m.user?.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{m.user?.email}</p>
                      </div>
                    </div>
                    {user.role === 'ADMIN' && (
                      <button 
                        onClick={() => setConfirmDeleteData({ isOpen: true, type: 'member', id: m.user_id })} 
                        className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove member"
                      >
                        <UserMinus size={16} />
                      </button>
                    )}
                  </motion.li>
                ))
              )}
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && user.role === 'ADMIN' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddMember(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden pointer-events-auto border border-slate-100">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Add Team Member</h2>
                  <button onClick={() => setShowAddMember(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 bg-white rounded-md shadow-sm border border-slate-200 hover:bg-slate-50">✕</button>
                </div>
                <form onSubmit={handleAddMember} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select User</label>
                    <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm shadow-subtle appearance-none">
                      <option value="">-- Choose User --</option>
                      {availableUsersToAdd.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                    {availableUsersToAdd.length === 0 && <p className="text-[11px] font-medium text-slate-500 mt-2">All available users are already in this project.</p>}
                  </div>
                  <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={() => setShowAddMember(false)} className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-subtle focus:outline-none focus:ring-2 focus:ring-slate-200">Cancel</button>
                    <button type="submit" disabled={!selectedUserId} className="px-4 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-premium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50">Add to Team</button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Create/Edit Task Modal */}
      <AnimatePresence>
        {showTaskModal && user.role === 'ADMIN' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowTaskModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="bg-white rounded-2xl shadow-elevated w-full max-w-lg overflow-hidden pointer-events-auto border border-slate-100">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">{isEditMode ? 'Edit Task' : 'Create Task'}</h2>
                  <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 bg-white rounded-md shadow-sm border border-slate-200 hover:bg-slate-50">✕</button>
                </div>
                <form onSubmit={handleSaveTask} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Task Title</label>
                    <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required placeholder="e.g. Design Landing Page" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm shadow-subtle" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assign To</label>
                      <select value={newTask.assigned_to_id} onChange={e => setNewTask({...newTask, assigned_to_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm shadow-subtle appearance-none">
                        <option value="">-- Unassigned --</option>
                        {project.members?.map(m => (
                          <option key={m.user_id} value={m.user_id}>{m.user?.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
                      <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm shadow-subtle appearance-none">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Due Date</label>
                    <input type="datetime-local" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm shadow-subtle" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea rows="3" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Provide detailed requirements..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm shadow-subtle resize-none"></textarea>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-subtle focus:outline-none focus:ring-2 focus:ring-slate-200">Cancel</button>
                    <button type="submit" className="px-4 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-premium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900">{isEditMode ? 'Save Changes' : 'Create Task'}</button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmDeleteData.isOpen}
        onClose={() => setConfirmDeleteData({ isOpen: false, type: null, id: null })}
        onConfirm={confirmDeleteData.type === 'task' ? handleDeleteTask : handleRemoveMember}
        title={confirmDeleteData.type === 'task' ? "Delete Task" : "Remove Member"}
        message={confirmDeleteData.type === 'task' ? "Are you sure you want to delete this task? This action cannot be undone." : "Are you sure you want to remove this member from the project? They will no longer have access to these tasks."}
        confirmText={confirmDeleteData.type === 'task' ? "Delete Task" : "Remove Member"}
        isDestructive={true}
      />
    </div>
  );
};

export default ProjectDetailPage;
