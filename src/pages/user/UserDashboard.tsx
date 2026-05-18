import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, TrendingUp, DollarSign, AlertTriangle,
  ArrowRight, Clock, CheckCircle, Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userApi, salesApi } from '../../api/services';
import { Order } from '../../types';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { CardSkeleton } from '../../components/common/Skeleton';

const DUMMY_STOCK_ALERTS = [
  { name: 'Tomato Sauce', stock: 3, unit: 'kg', threshold: 10 },
  { name: 'Cheese Block', stock: 1, unit: 'kg', threshold: 5 },
  { name: 'Pizza Dough', stock: 5, unit: 'pcs', threshold: 20 },
];

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState({ today: 0, monthly: 0 });
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   userApi.getMyOrders()
  //     // .then(r => setOrders(r.data))
  //     .then(r => setOrders(r.data.data ?? []))
  //     .catch(() => setOrders([]))
  //     .finally(() => setLoading(false));

  // }, []);

  // हे लिही:
  useEffect(() => {
    userApi.getMyOrders()
      .then(r => setOrders(r.data.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));

    // हे ADD कर:
    Promise.all([
      salesApi.getToday().catch(() => ({ data: { data: 0 } })),
      salesApi.getMonthly().catch(() => ({ data: { data: 0 } })),
    ]).then(([t, m]) => {
      setSales({
        today: t.data?.data ?? 0,
        monthly: m.data?.data ?? 0,
      });
    });
  }, []);
  // const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const pendingCount = orders.filter(o => o.status === 'REQUESTED').length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-400 text-sm mt-0.5">Here's what's happening with your franchise today.</p>
        </div>
        <Link to="/dashboard/order" className="btn-primary">
          <ShoppingBag className="w-4 h-4" /> New Order
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Orders" value={orders.length} icon={ShoppingBag} color="sky" trend={{ value: 12, label: 'vs last month' }} />
            <StatCard title="Pending Orders" value={pendingCount} icon={Clock} color="amber" />
            {/* <StatCard title="Daily Revenue" value="₹0" icon={DollarSign} color="emerald" pending />
            <StatCard title="Monthly Revenue" value="₹0" icon={TrendingUp} color="purple" pending /> */}
          
            <StatCard title="Daily Revenue" value={`₹${sales.today.toLocaleString('en-IN')}`} icon={DollarSign} color="emerald" />
            <StatCard title="Monthly Revenue" value={`₹${sales.monthly.toLocaleString('en-IN')}`} icon={TrendingUp} color="purple" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="font-semibold text-white text-sm">Recent Orders</h2>
            <Link to="/dashboard/orders" className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm font-medium">No orders yet</p>
              <p className="text-slate-600 text-xs mt-1">Place your first order to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/2 transition-colors">
                  <div>
                    {/* <p className="text-sm font-medium text-white font-mono">#{order.id.slice(-8).toUpperCase()}</p> */}
                    <p className="text-sm font-medium text-white font-mono">#{String(order.id).slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-sm text-slate-300 font-semibold">₹{order.totalAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Alerts */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="font-semibold text-white text-sm">Stock Alerts</h2>
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">API Pending</span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {DUMMY_STOCK_ALERTS.map((item, i) => (
              <div key={i} className="px-5 py-3.5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.stock} {item.unit} remaining</p>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full"
                    style={{ width: `${(item.stock / item.threshold) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-slate-900/50 border-t border-slate-800">
            <p className="text-xs text-slate-600 flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3" /> Showing static demo data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
