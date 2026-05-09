import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden pointer-events-auto border border-slate-100"
            >
              <div className="p-6">
                <div className="flex items-start">
                  <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-primary-100 text-primary-600'}`}>
                    <AlertTriangle size={20} />
                  </div>
                  <div className="ml-4 pt-1 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h3>
                      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mt-1 -mr-1 rounded-md hover:bg-slate-50">
                        <X size={18} />
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">{message}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-subtle focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => { onConfirm(); onClose(); }}
                  className={`px-4 py-2.5 text-sm font-medium text-white rounded-xl shadow-subtle transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isDestructive 
                      ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500' 
                      : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
