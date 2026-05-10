import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, Eye, EyeOff, LayoutDashboard, Users, TrendingUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(password)) {
          toast.error('Password must be at least 8 chars long and contain 1 uppercase, 1 digit, and 1 special char.');
          setLoading(false);
          return;
        }
        await register(name, email, password, role);
        toast.success('Account created successfully');
      }
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        toast.error(detail[0].msg || 'Validation error');
      } else {
        toast.error(detail || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (type) => {
    setIsLogin(true);
    setEmail(type === 'admin' ? 'admin@ethara.com' : 'member@ethara.com');
    setPassword('Password123!');
  };

  const features = [
    { icon: <LayoutDashboard size={20} />, title: "Project Tracking", delay: 0.1 },
    { icon: <Users size={20} />, title: "Team Collaboration", delay: 0.2 },
    { icon: <TrendingUp size={20} />, title: "Analytics Dashboard", delay: 0.3 },
    { icon: <Clock size={20} />, title: "Deadline Monitoring", delay: 0.4 },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans selection:bg-primary-100 selection:text-primary-900">
      
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-slate-900 text-white flex-col justify-between relative overflow-hidden p-12">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-600 rounded-full mix-blend-screen filter blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-40"></div>
        
        {/* Lightweight geometric grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3 mb-16"
          >
            <div className="bg-gradient-to-br from-primary-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-primary-500/30">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">TeamPilot</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.15] mb-6 tracking-tight">
              Organize projects,<br/>collaborate with teams,<br/>and deliver work faster.
            </h1>
            <p className="text-lg text-slate-400 max-w-md leading-relaxed mb-12">
              The premium platform for high-performing teams to stay aligned and hit deadlines flawlessly.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: feature.delay + 0.3 }}
                className="flex items-center space-x-3 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm"
              >
                <div className="text-primary-400 bg-primary-400/10 p-2 rounded-lg">
                  {feature.icon}
                </div>
                <span className="font-medium text-sm text-slate-200">{feature.title}</span>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-slate-500 font-medium">
          © {new Date().getFullYear()} TeamPilot Inc.
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 bg-white relative z-10 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)]">
        
        {/* Mobile Branding */}
        <div className="md:hidden flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-primary-500 to-indigo-600 p-3 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">TeamPilot</span>
        </div>

        <div className="w-full max-w-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              {isLogin ? 'Log in to your account' : 'Create an account'}
            </h2>
            <p className="text-sm text-slate-500">
              {isLogin ? 'Enter your details to access your workspace.' : 'Start managing your projects efficiently today.'}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-8 space-y-4" 
              onSubmit={handleSubmit}
            >
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    placeholder="John Doe"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-subtle placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all sm:text-sm" 
                  />
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="name@company.com"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-subtle placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all sm:text-sm" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    minLength="8" 
                    required 
                    placeholder="••••••••"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-subtle placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all sm:text-sm pr-10" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="pt-1 text-xs text-slate-500 leading-relaxed">
                    Must be at least 8 chars, 1 uppercase, 1 digit, and 1 special symbol.
                  </p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Account Role</label>
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)} 
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all sm:text-sm appearance-none"
                  >
                    <option value="MEMBER">Team Member</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-premium text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all group"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                  ) : (
                    <>
                      {isLogin ? 'Sign in' : 'Create account'}
                      <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </AnimatePresence>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-6"
          >
            <p className="text-sm text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setEmail(''); setPassword(''); }} 
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </motion.div>

          {/* Demo Credentials Helper */}
          {isLogin && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12 pt-6 border-t border-slate-100"
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">Demo Credentials</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setDemoCredentials('admin')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-primary-300 hover:shadow-subtle transition-all group text-left w-full"
                >
                  <span className="text-xs font-bold text-slate-700 group-hover:text-primary-600 transition-colors">Admin</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-mono">admin@ethara.com</span>
                </button>
                <button 
                  onClick={() => setDemoCredentials('member')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-primary-300 hover:shadow-subtle transition-all group text-left w-full"
                >
                  <span className="text-xs font-bold text-slate-700 group-hover:text-primary-600 transition-colors">Member</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-mono">member@ethara.com</span>
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
