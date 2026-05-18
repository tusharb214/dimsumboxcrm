import React, { useEffect, useState } from 'react';
import { ClipboardList, Clock, CheckCircle, Truck, RefreshCw } from 'lucide-react';
import { kitchenApi, dashboardApi } from '../../api/services';
import { Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton, TableSkeleton } from '../../components/common/Skeleton';
import toast from 'react-hot-toast';

const KitchenDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dashStats, setDashStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const r = await kitchenApi.getAssignedOrders();
      setOrders(r.data.data ?? []);
      dashboardApi.getKitchenDashboard()
        .then(res => setDashStats(res.data?.data))
        .catch(() => {});
    }
    catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const acceptOrder = async (orderId: string) => {
    setUpdating(orderId);
    try {
      await kitchenApi.acceptOrder(orderId);
      toast.success('Order accepted — now Preparing!');
      fetchOrders();
    } catch { toast.error('Failed to accept order'); }
    finally { setUpdating(null); }
  };

  const markReady = async (orderId: string) => {
    setUpdating(orderId);
    try {
      await kitchenApi.markReady(orderId);
      toast.success('Order marked as Ready!');
      fetchOrders();
    } catch { toast.error('Failed to mark ready'); }
    finally { setUpdating(null); }
  };

  const byStatus = (s: string) => orders.filter(o => o.status === s).length;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Kitchen Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your assigned orders</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary"><RefreshCw className="w-4 h-4" />Refresh</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />) : (
          <>
            <StatCard title="Total Assigned" value={dashStats?.totalOrders ?? orders.length} icon={ClipboardList} color="sky" />
            <StatCard title="Preparing" value={dashStats?.preparingNow ?? byStatus('PREPARING')} icon={Clock} color="amber" />
            <StatCard title="Ready" value={dashStats?.readyNow ?? byStatus('READY')} icon={CheckCircle} color="emerald" />
            <StatCard title="Completed" value={dashStats?.completedByMe ?? byStatus('DELIVERED')} icon={Truck} color="purple" />
          </>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Assigned Orders</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? <TableSkeleton rows={5} cols={5} /> : orders.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No orders assigned" description="Orders assigned to this kitchen will appear here" />
          ) : (
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="table-th">Order ID</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Items</th>
                  <th className="table-th">Current Status</th>
                  <th className="table-th">Action</th>
                  <th className="table-th">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map(order => (
                  <tr key={order.id} className={`hover:bg-white/2 transition-colors ${updating === order.id ? 'opacity-60' : ''}`}>
                    <td className="table-td font-mono text-sky-400 text-xs">#{String(order.id).slice(-8).toUpperCase()}</td>
                    <td className="table-td">{order.userName || '—'}</td>
                    <td className="table-td text-slate-400">{order.items?.length || 0} items</td>
                    <td className="table-td"><StatusBadge status={order.status} /></td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        {order.status === 'ASSIGNED' && (
                          <button
                            onClick={() => acceptOrder(String(order.id))}
                            disabled={updating === order.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() => markReady(String(order.id))}
                            disabled={updating === order.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            Mark Ready
                          </button>
                        )}
                        {(order.status === 'READY' || order.status === 'DELIVERED') && (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </div>
                    </td>
                    <td className="table-td text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default KitchenDashboard;