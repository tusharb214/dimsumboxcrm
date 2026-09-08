 import React, { useEffect, useState, useCallback } from 'react';
import { Bell, AlertTriangle, TrendingUp, RefreshCw, CheckCheck, Check, Send, X } from 'lucide-react';
import { notificationApi, adminApi } from '../../api/services';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'LOW_STOCK' | 'DAILY_SALES_MISSED';
  franchiseUserName: string;
  read: boolean;
  createdAt: string;
}

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [sendTarget, setSendTarget] = useState<string>('');
  const [sendTitle, setSendTitle] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await notificationApi.getAll();
      setNotifications(r.data?.data ?? []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds for real-time feel
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new Event('notifications-updated'));
      
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-xl font-bold text-black">Notifications</h1>
<p className="text-black/60 text-sm mt-0.5">System and activity alerts</p>
        </div>
         <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                await notificationApi.triggerCheck();
                toast.success('Notification check triggered!');
                setTimeout(fetchNotifications, 1000);
              } catch {
                toast.error('Failed to trigger check');
              }
            }}
            className="btn-secondary"
          >
            <AlertTriangle className="w-4 h-4" /> Trigger Check
          </button>
          <button onClick={fetchNotifications} className="btn-secondary">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-white">All Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {markingAll ? 'Marking...' : 'Mark all read'}
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Bell className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-slate-400 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {notifications.map(n => {
              const isLowStock = n.type === 'LOW_STOCK';
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-white/2 transition-colors ${
                    !n.read ? 'bg-sky-500/5' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    isLowStock
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {isLowStock
                      ? <AlertTriangle className="w-4 h-4" />
                      : <TrendingUp className="w-4 h-4" />
                    }
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-semibold text-white">{n.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.read && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            title="Mark as read"
                            className="p-1 rounded-lg text-slate-500 hover:text-sky-400 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!n.read && (
                          <div className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-600 mt-1.5">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;