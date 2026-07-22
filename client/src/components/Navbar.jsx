import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Bell, User, LogOut, Settings, ShieldAlert, Sparkles, Menu } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 45 seconds
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  // Handle clicking outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read) {
        await api.put(`/notifications/${notif._id}/read`);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      }
      setShowNotifications(false);
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="h-16 border-b border-glassBorder bg-[#090d16]/80 backdrop-blur-md fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-md hover:bg-slate-800/40"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight font-heading bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
            AiXpense
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/40 relative transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass-panel rounded-xl overflow-hidden border border-glassBorder z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="p-3 border-b border-glassBorder flex items-center justify-between bg-slate-900/60">
                <span className="text-xs font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left p-3 border-b border-glassBorder/60 hover:bg-slate-800/30 flex gap-2 transition-colors ${
                        !notif.read ? 'bg-indigo-500/5' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {notif.type === 'fraud_alert' ? (
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] font-semibold text-slate-200">{notif.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{notif.message}</div>
                        <div className="text-[9px] text-slate-500 mt-1">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative animate-in fade-in duration-300" ref={profileRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 focus:outline-none"
          >
            {user?.avatar?.url ? (
              <img 
                src={user.avatar.url} 
                alt={user.name} 
                className="w-8 h-8 rounded-full border border-indigo-500/30 object-cover" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden sm:inline text-xs font-medium text-slate-300 hover:text-white">
              {user?.name}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 glass-panel rounded-xl overflow-hidden border border-glassBorder z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="px-4 py-3 bg-slate-900/60 border-b border-glassBorder">
                <p className="text-xs font-semibold text-white line-clamp-1">{user?.name}</p>
                <p className="text-[10px] text-slate-500 line-clamp-1">{user?.email}</p>
              </div>
              <div className="p-1">
                <Link 
                  to="/profile" 
                  onClick={() => setShowProfileMenu(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/40 transition-colors"
                >
                  <User className="w-4 h-4 text-indigo-400" />
                  My Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
