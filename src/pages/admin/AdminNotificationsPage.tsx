import React from 'react';
import { Bell, Clock, Users, ChefHat, ShoppingBag, AlertTriangle } from 'lucide-react';

const NOTIFS = [
  { id: 1, icon: ShoppingBag, color: 'sky', title: 'New Order Placed', msg: 'User Rahul Sharma placed a new order #ORD-2401.', time: '5 mins ago', read: false },
  { id: 2, icon: ChefHat, color: 'emerald', title: 'Kitchen Assigned', msg: 'Order #ORD-2399 assigned to Central Kitchen.', time: '20 mins ago', read: false },
  { id: 3, icon: AlertTriangle, color: 'amber', title: 'Low Stock Warning', msg: 'Mozzarella Cheese stock below threshold at North Kitchen.', time: '1 hour ago', read: true },
  { id: 4, icon: Users, color: 'purple', title: 'New User Registered', msg: 'A new franchise user has registered: priya@example.com', time: '3 hours ago', read: true },
  { id: 5, icon: ShoppingBag, color: 'rose', title: 'Order Cancelled', msg: 'Order #ORD-2395 was cancelled by the user.', time: '1 day ago', read: true },
];

const colorMap: Record<string, string> = {
  sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const AdminNotificationsPage: React.FC = () => (
  <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-white">Notifications</h1>
        <p className="text-slate-400 text-sm mt-0.5">System and activity alerts</p>
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
          <span className="badge-danger">2 new</span>
        </div>
        <button className="text-xs text-sky-400 hover:text-sky-300">Mark all read</button>
      </div>
      <div className="divide-y divide-slate-800/60">
        {NOTIFS.map(n => (
          <div key={n.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-white/2 transition-colors ${!n.read ? 'bg-sky-500/5' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${colorMap[n.color]}`}>
              <n.icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-semibold text-white">{n.title}</p>
                {!n.read && <div className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 mt-1" />}
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{n.msg}</p>
              <p className="text-xs text-slate-600 mt-1.5">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AdminNotificationsPage;
