import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ChefHat, Settings2, Eye  } from 'lucide-react';
 import { adminApi, dashboardApi } from '../../api/services';
import { Order, Kitchen, OrderStatus } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const LIMIT = 10;
// const STATUSES: OrderStatus[] = ['PENDING','ASSIGNED','PREPARING','READY','DISPATCHED','DELIVERED','CANCELLED'];
const STATUSES: OrderStatus[] = ['REQUESTED', 'ACCEPTED', 'ASSIGNED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED', 'REJECTED'];

 const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashStats, setDashStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

   
const fetchData = async () => {
  setLoading(true);
  try {
    const [o, k] = await Promise.all([adminApi.getAllOrders(), adminApi.getAllKitchens()]);
    setOrders(o.data?.data ?? []);
    setKitchens(k.data?.data ?? []);
  } catch { toast.error('Failed to load data'); }
  finally { setLoading(false); }
};

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => orders.filter(o => {
    const ms = String(o.id).toLowerCase().includes(search.toLowerCase()) ||
      (o.userName || '').toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === 'ALL' || o.status === statusFilter;
    return ms && mf;
  }), [orders, search, statusFilter]);

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const assignKitchen = async (orderId: string, kitchenId: string) => {
    if (!kitchenId) return;
    const order = orders.find(o => String(o.id) === orderId);
    if (order?.status !== 'ACCEPTED') {
      toast.error('Order must be ACCEPTED to assign kitchen');
      return;
    }
    dashboardApi.getAdminDashboard()
  .then(r => setDashStats(r.data?.data))
  .catch(() => {});
    
    setUpdating(orderId);
    try {
      await adminApi.assignKitchenToOrder(orderId, kitchenId);
      toast.success('Kitchen assigned!');
      fetchData();
    } catch { toast.error('Failed to assign kitchen'); }
    finally { setUpdating(null); }
  };

  const acceptOrder = async (orderId: string) => {
    setUpdating(orderId);
    try { await adminApi.acceptOrder(orderId); toast.success('Order accepted!'); fetchData(); }
    catch { toast.error('Failed to accept'); } finally { setUpdating(null); }
  };

  const rejectOrder = async (orderId: string) => {
    setUpdating(orderId);
    try { await adminApi.rejectOrder(orderId); toast.success('Order rejected!'); fetchData(); }
    catch { toast.error('Failed to reject'); } finally { setUpdating(null); }
  };

  const markDelivered = async (orderId: string) => {
    setUpdating(orderId);
    try { await adminApi.markDelivered(orderId); toast.success('Marked as delivered!'); fetchData(); }
    catch { toast.error('Failed to mark delivered'); } finally { setUpdating(null); }
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Orders Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">{orders.length} total orders</p>
        </div>
        <button onClick={fetchData} className="btn-secondary"><RefreshCw className="w-4 h-4" />Refresh</button>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-800">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by ID or user..." className="flex-1" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-full sm:w-44 py-2.5">
            <option value="ALL">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? <TableSkeleton rows={6} cols={6} /> : paginated.length === 0 ? (
            <EmptyState icon={Settings2} title="No orders found" description="Try adjusting filters" />
          ) : (
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="table-th">Order ID</th>
                  <th className="table-th">User</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Assign Kitchen</th>
                  {/* <th className="table-th">Actions</th> */}
                  <th className="table-th">Amount</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginated.map(order => (
                  <tr key={order.id} className={`hover:bg-white/2 transition-colors ${updating === String(order.id) ? 'opacity-60' : ''}`}>
                    <td className="table-td font-mono text-sky-400 text-xs">#{String(order.id).slice(-8).toUpperCase()}</td>
                    <td className="table-td">{order.userName || '—'}</td>
                    <td className="table-td"><StatusBadge status={order.status} /></td>
                     <td className="table-td">
                      {order.kitchenName ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                          <ChefHat className="w-3.5 h-3.5" />{order.kitchenName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Not Assigned</span>
                      )}
                    </td>
                     
                    <td className="table-td font-semibold text-white">₹{order.totalAmount}</td>
             <td className="table-td text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="table-td">
                      <button
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} total={filtered.length} limit={LIMIT} onChange={setPage} />
      </div>
    </div>
  );
};

export default AdminOrdersPage;