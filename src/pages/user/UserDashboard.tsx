 import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, TrendingUp, DollarSign, AlertTriangle,
  ArrowRight, Clock, Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userApi, salesApi } from '../../api/services';
import { posSetupApi } from '../../api/posServices';
import { Order } from '../../types';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { CardSkeleton } from '../../components/common/Skeleton';

interface StockAlertItem {
  name: string;
  stockPieces: number;
  lowStockThreshold: number;
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState({ today: 0, monthly: 0 });
  const [loading, setLoading] = useState(true);
  const [stockAlerts, setStockAlerts] = useState<StockAlertItem[]>([]);

  
  useEffect(() => {
    userApi.getMyOrders()
      .then(r => setOrders(r.data.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));

    
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

  posSetupApi.getAllProducts()
      .then((r: any) => {
        const products = r.data?.data ?? [];
        const lowStock = products.filter((p: any) =>
          p.stockPieces != null && p.lowStockThreshold != null && p.stockPieces <= p.lowStockThreshold
        );
        setStockAlerts(lowStock);
      })
      .catch(() => setStockAlerts([]));
  // const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const pendingCount = orders.filter(o => o.status === 'REQUESTED').length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-black text-sm mt-0.5">Here's what's happening with your franchise today.</p>
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
            <h2 className="font-semibold text-blaccl text-sm">Recent Orders</h2>
            <Link to="/dashboard/orders" className="text-xs text- hover:text-sky-300 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-10 h-10 text-black mb-3" />
              <p className="text-black text-sm font-medium">No orders yet</p>
              <p className="text-black text-xs mt-1">Place your first order to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/2 transition-colors">
                  <div>
                    {/* <p className="text-sm font-medium text-white font-mono">#{order.id.slice(-8).toUpperCase()}</p> */}
                    <p className="text-sm font-medium text-black font-mono">#{String(order.id).slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-black mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-sm text-black font-semibold">₹{order.totalAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      
         {/* Stock Alerts */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="font-semibold text-black text-sm">Stock Alerts</h2>
          </div>
          {stockAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-5">
              <Package className="w-8 h-8 text-black mb-2" />
              <p className="text-black text-sm">No low-stock items right now</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-800/60">
                {stockAlerts.slice(0, 5).map((item, i) => (
                  <div key={i} className="px-5 py-3.5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-black">{item.name}</p>
                        <p className="text-xs text-black">{item.stockPieces} pcs remaining</p>
                      </div>
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (item.stockPieces / item.lowStockThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/dashboard/sales?tab=stock"
                className="flex items-center justify-center gap-1 px-5 py-3 text-xs text-sky-400 hover:text-sky-300 border-t border-slate-800 transition-colors"
              >
                Show more <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
