import React from 'react';
import { Bell, Package, CheckCircle, AlertTriangle, Clock, Info } from 'lucide-react';

const DUMMY_NOTIFICATIONS = [
  { id: 1, type: 'success', icon: CheckCircle, title: 'Order Delivered', message: 'Order #ORD-001 has been delivered successfully.', time: '2 hours ago', read: false },
  { id: 2, type: 'info', icon: Package, title: 'Order Dispatched', message: 'Order #ORD-002 is out for delivery.', time: '5 hours ago', read: false },
  { id: 3, type: 'warning', icon: AlertTriangle, title: 'Low Stock Alert', message: 'Mozzarella cheese is running low. Please reorder.', time: '1 day ago', read: true },
  { id: 4, type: 'info', icon: Info, title: 'Kitchen Assigned', message: 'Your order #ORD-003 has been assigned to Central Kitchen.', time: '2 days ago', read: true },
];

const iconColors: Record<string, string> = {
  success: 'text-emerald-400 bg-emerald-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
  info: 'text-sky-400 bg-sky-500/10',
  danger: 'text-rose-400 bg-rose-500/10',
};

const NotificationsPage: React.FC = () => (
  <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-white">Notifications</h1>
        <p className="text-slate-400 text-sm mt-0.5">Stay updated on your orders</p>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs text-amber-400">Backend Integration Pending</span>
      </div>
    </div>

    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-white">All Notifications</span>
          <span className="badge-info">2 new</span>
        </div>
        <button className="text-xs text-sky-400 hover:text-sky-300 transition-colors">Mark all read</button>
      </div>

      <div className="divide-y divide-slate-800/60">
        {DUMMY_NOTIFICATIONS.map(notif => {
          const colors = iconColors[notif.type];
          return (
            <div key={notif.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-white/2 transition-colors ${!notif.read ? 'bg-sky-500/5' : ''}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors}`}>
                <notif.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{notif.title}</p>
                    <p className="text-sm text-slate-400 mt-0.5">{notif.message}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-slate-600 mt-1.5">{notif.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div className="card p-6 text-center">
      <p className="text-slate-500 text-sm">Showing static demo notifications. Real-time notifications will be available after backend integration.</p>
    </div>
  </div>
);

export default NotificationsPage;
