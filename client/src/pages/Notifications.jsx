import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiBell, FiCheck, FiTrash2, FiInfo, FiAlertCircle } from 'react-icons/fi';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      if (data.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === id ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data } = await api.patch('/notifications/read-all');
      if (data.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true }))
        );
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { data } = await api.delete(`/notifications/${id}`);
      if (data.success) {
        setNotifications((prev) => prev.filter((notif) => notif._id !== id));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'alert':
        return <FiAlertCircle className="w-5 h-5 text-red-400" />;
      case 'info':
      default:
        return <FiInfo className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-white">Notifications</h1>
          <p className="text-white/60 mt-1">Stay updated on your financial activities.</p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <FiCheck />
            Mark all as read
          </button>
        )}
      </header>

      <div className="glass-card p-6 min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-4 rounded-xl border flex gap-4 transition-colors ${
                  notif.isRead 
                    ? 'bg-white/5 border-white/5' 
                    : 'bg-primary-500/10 border-primary-500/20 shadow-[0_0_15px_rgba(var(--color-primary-500),0.1)]'
                }`}
              >
                <div className="mt-1 flex-shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-semibold ${notif.isRead ? 'text-white/80' : 'text-white'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-xs text-white/50">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm ${notif.isRead ? 'text-white/50' : 'text-white/70'}`}>
                    {notif.message}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 ml-4">
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif._id)}
                      className="p-2 text-primary-400 hover:bg-primary-500/20 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif._id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete notification"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-white/50">
            <FiBell className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm mt-1">You don't have any notifications right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};
