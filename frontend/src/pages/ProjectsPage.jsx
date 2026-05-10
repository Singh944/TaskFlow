import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Calendar, Clock, Edit2, Trash2, MoreVertical, Search, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';

const ProjectsPage = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  // Delete Confirm Modal
  const [confirmDeleteData, setConfirmDeleteData] = useState({ isOpen: false, id: null });

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenModal = (project = null) => {
    if (project) {
      setIsEditMode(true);
      setCurrentProject(project);
      setName(project.name);
      setDescription(project.description || '');
      setDeadline(project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '');
    } else {
      setIsEditMode(false);
      setCurrentProject(null);
      setName('');
      setDescription('');
      setDeadline('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName('');
    setDescription('');
    setDeadline('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { name, description, deadline: deadline || null };
    try {
      if (isEditMode) {
        await api.put(`/projects/${currentProject.id}`, payload);
        toast.success('Project updated successfully');
      } else {
        await api.post('/projects', payload);
        toast.success('Project created successfully');
        addNotification({ type: 'project', title: 'Project created', desc: `Admin created "${payload.name}"`, forAdmin: true });
      }
      fetchProjects();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save project');
    }
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/projects/${confirmDeleteData.id}`);
      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete project');
    }
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
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
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage and monitor team initiatives.</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white shadow-subtle focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all"
            />
          </div>
          {user?.role === 'ADMIN' && (
            <button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-premium hover:shadow-elevated flex items-center shrink-0">
              <Plus size={16} className="mr-2" /> New Project
            </button>
          )}
        </div>
      </motion.div>

      {filteredProjects.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-subtle border border-slate-200/60 p-16 text-center"
        >
          <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No projects found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? "We couldn't find any projects matching your search." : (user?.role === 'ADMIN' ? 'Get started by creating your first team project.' : "You haven't been added to any projects yet.")}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700">
              Clear search
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <motion.div key={project.id} variants={item} className="h-full">
              <Link to={`/projects/${project.id}`} className="group block h-full">
                <div className="bg-white rounded-2xl shadow-subtle border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-premium hover:-translate-y-1 relative flex flex-col h-full overflow-hidden">
                  
                  {user?.role === 'ADMIN' && (
                    <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 backdrop-blur-sm rounded-lg p-1 border border-slate-100 shadow-sm">
                      <button 
                        onClick={(e) => { e.preventDefault(); handleOpenModal(project); }}
                        className="p-1.5 text-slate-400 hover:text-primary-600 rounded-md hover:bg-primary-50 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); setConfirmDeleteData({ isOpen: true, id: project.id }); }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 mb-4 pr-16">
                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors border border-slate-100">
                      <FolderKanban size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">{project.name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Created {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-500 mb-6 flex-1 line-clamp-3 leading-relaxed">
                    {project.description || 'No project description provided.'}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    {project.deadline ? (
                      <div className="flex items-center text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100/50">
                        <Calendar size={12} className="mr-1.5" />
                        Due {new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    ) : (
                      <div className="text-[11px] font-medium text-slate-400">No deadline</div>
                    )}
                    
                    <div className="text-slate-300 group-hover:text-primary-500 transition-colors group-hover:translate-x-1 transform duration-200">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal for Create/Edit using Framer Motion */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden pointer-events-auto border border-slate-100"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">{isEditMode ? 'Edit Project' : 'New Project'}</h2>
                  <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors p-1 bg-white rounded-md shadow-sm border border-slate-200 hover:bg-slate-50">✕</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Project Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                      placeholder="e.g. Website Redesign"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm shadow-subtle"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      rows="3"
                      placeholder="Briefly describe the project goals..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none text-sm shadow-subtle"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Deadline (Optional)</label>
                    <input 
                      type="date" 
                      value={deadline} 
                      onChange={(e) => setDeadline(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm shadow-subtle"
                    />
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={handleCloseModal} className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-subtle focus:outline-none focus:ring-2 focus:ring-slate-200">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-premium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900">
                      {isEditMode ? 'Save Changes' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmDeleteData.isOpen}
        onClose={() => setConfirmDeleteData({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? All associated tasks will also be permanently removed. This action cannot be undone."
        confirmText="Delete Project"
        isDestructive={true}
      />
    </div>
  );
};

export default ProjectsPage;
