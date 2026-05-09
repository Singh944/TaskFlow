import React, { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CheckSquare, FolderKanban, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [store, setStore] = useState({
    admin: [],
    users: {}
  });

  const currentNotifications = user?.role === 'ADMIN' 
    ? store.admin 
    : (store.users[user?.id] || []);

  const addNotification = useCallback(({ type, title, desc, targetUserId = null, forAdmin = false }) => {
    let icon;
    if (type === 'task') icon = <CheckSquare size={16} className="text-primary-600" />;
    else if (type === 'project') icon = <FolderKanban size={16} className="text-emerald-600" />;
    else if (type === 'alert') icon = <AlertCircle size={16} className="text-rose-600" />;
    else if (type === 'team') icon = <UserPlus size={16} className="text-indigo-600" />;
    else icon = <AlertCircle size={16} className="text-slate-600" />;

    const newNotif = {
      id: Date.now() + Math.random(),
      type, title, desc,
      time: 'Just now',
      read: false,
      icon
    };

    setStore(prev => {
      const nextStore = { ...prev, users: { ...prev.users } };
      
      if (forAdmin) {
        nextStore.admin = [newNotif, ...nextStore.admin];
      }
      
      if (targetUserId) {
        const uId = parseInt(targetUserId);
        nextStore.users[uId] = [newNotif, ...(nextStore.users[uId] || [])];
      }
      
      return nextStore;
    });
  }, []);

  const markAsRead = useCallback((id) => {
    if (!user) return;
    setStore(prev => {
      const nextStore = { ...prev, users: { ...prev.users } };
      if (user.role === 'ADMIN') {
        nextStore.admin = nextStore.admin.map(n => n.id === id ? { ...n, read: true } : n);
      } else {
        const uId = user.id;
        if (nextStore.users[uId]) {
          nextStore.users[uId] = nextStore.users[uId].map(n => n.id === id ? { ...n, read: true } : n);
        }
      }
      return nextStore;
    });
  }, [user]);

  const markAllAsRead = useCallback(() => {
    if (!user) return;
    setStore(prev => {
      const nextStore = { ...prev, users: { ...prev.users } };
      let hasUnread = false;

      if (user.role === 'ADMIN') {
        hasUnread = nextStore.admin.some(n => !n.read);
        if (hasUnread) {
          nextStore.admin = nextStore.admin.map(n => ({ ...n, read: true }));
        }
      } else {
        const uId = user.id;
        const userNotifs = nextStore.users[uId] || [];
        hasUnread = userNotifs.some(n => !n.read);
        if (hasUnread) {
          nextStore.users[uId] = userNotifs.map(n => ({ ...n, read: true }));
        }
      }

      if (hasUnread) {
        toast.success("All notifications marked as read", {
          icon: '✓',
          style: { borderRadius: '12px', background: '#333', color: '#fff' }
        });
      }
      return nextStore;
    });
  }, [user]);

  const value = {
    notifications: currentNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    unreadCount: currentNotifications.filter(n => !n.read).length
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
