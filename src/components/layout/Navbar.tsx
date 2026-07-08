 import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Megaphone, Sun, Moon, Search, Menu, Package, Wallet, AlertTriangle, Send, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminApi, notificationApi, franchiseNotificationApi } from '../../api/services';
import toast from 'react-hot-toast';

interface NavbarProps {
  onMenuClick: () => void;
  pageTitle?: string;
}

type Shortcut = 'NEW_PRODUCT' | 'PAYMENT_PENDING' | 'STOCK_OUT' | null;

const fieldClass =
  'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-colors';

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, pageTitle }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'USER';
  const [dark, setDark] = React.useState(true);

  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [shortcut, setShortcut] = useState<Shortcut>(null);
  const [targetUserId, setTargetUserId] = useState('');
  const [productName, setProductName] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const r = role === 'ADMIN'
          ? await notificationApi.getUnreadCount()
          : await franchiseNotificationApi.getUnreadCount();
        setUnreadCount(r.data?.data ?? 0);
      } catch {
        // silent fail
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [role]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const openPanel = async () => {
    if (role !== 'ADMIN') {
      navigate('/dashboard/notifications');
      return;
    }
    setShowPanel(prev => !prev);
    if (users.length === 0) {
      try {
        const r = await adminApi.getAllUsers();
        setUsers(r.data?.data ?? []);
      } catch {
        toast.error('Failed to load users');
      }
    }
  };

  const applyShortcut = (type: Shortcut) => {
    setShortcut(type);
    setProductName('');
    setTargetUserId('');
    if (type === 'PAYMENT_PENDING') {
      setTitle('Payment Pending');
      setMessage('Your payment is pending. Please clear it at the earliest.');
    } else if (type === 'STOCK_OUT') {
      setTitle('Stock Out — Place Order');
      setMessage('Your stock is running out. Please place a new order soon.');
    } else if (type === 'NEW_PRODUCT') {
      setTitle('New Product Available');
      setMessage('');
    }
  };

  const handleProductNameChange = (name: string) => {
    setProductName(name);
    setMessage(name ? `New product "${name}" is now available. Check it out!` : '');
  };

  const resetForm = () => {
    setShowPanel(false);
    setShortcut(null);
    setTitle('');
    setMessage('');
    setTargetUserId('');
    setProductName('');
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message required');
      return;
    }
    setSending(true);
    try {
      await notificationApi.sendCustom({
        targetUserId: targetUserId ? Number(targetUserId) : null,
        title,
        message,
      });
      toast.success('Notification sent');
      resetForm();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <header className="h-14 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 flex items-center justify-between px-4 lg:px-5 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        {pageTitle && (
          <h1 className="text-sm font-semibold text-white hidden sm:block">{pageTitle}</h1>
        )}
      </div>

      <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 w-64">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Quick search..."
          className="bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none w-full"
        />
        <span className="text-xs text-slate-600 font-mono bg-slate-800 px-1.5 py-0.5 rounded">⌘K</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative" ref={panelRef}>
          <button
            onClick={openPanel}
            title={role === 'ADMIN' ? 'Send Notification' : 'Notifications'}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            {role === 'ADMIN' ? <Megaphone className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-500 rounded-full" />
            )}
          </button>

          {showPanel && role === 'ADMIN' && (
            <div className="absolute right-0 mt-2 w-96 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xl z-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-sky-400" /> Send Notification
                </span>
                <button onClick={() => setShowPanel(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => applyShortcut('NEW_PRODUCT')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                    shortcut === 'NEW_PRODUCT'
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" /> New Product
                </button>
                <button
                  onClick={() => applyShortcut('PAYMENT_PENDING')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                    shortcut === 'PAYMENT_PENDING'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" /> Payment Due
                </button>
                <button
                  onClick={() => applyShortcut('STOCK_OUT')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                    shortcut === 'STOCK_OUT'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Stock Out
                </button>
              </div>

              {shortcut === 'NEW_PRODUCT' && (
                <input
                  type="text"
                  placeholder="Product name..."
                  value={productName}
                  onChange={e => handleProductNameChange(e.target.value)}
                  className={fieldClass}
                />
              )}

              <select
                value={targetUserId}
                onChange={e => setTargetUserId(e.target.value)}
                className={fieldClass}
              >
                <option value="">All franchise users</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={fieldClass}
              />
              <textarea
                placeholder="Message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                className={`${fieldClass} min-h-[90px] resize-none`}
              />

              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full flex items-center justify-center gap-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          )}
        </div>

        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer ml-1">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};

export default Navbar;