import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, CheckCircle2, Truck } from 'lucide-react';
import { adminApi } from '../../api/services';
import { Order } from '../../types';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const LIMIT = 10;

const AdminDispatchedOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllOrders();
      const all: Order[] = res.data?.data ?? [];
      setOrders(all.filter(o => o.status === 'DISPATCHED'));
    } catch { toast.error('Failed to load dispatched orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => orders.filter(o =>
    String(o.id).toLowerCase().includes(search.toLowerCase()) ||
    (o.userName || '').toLowerCase().includes(search.toLowerCase())
  ), [orders, search]);

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const markDelivered = async (orderId: string) => {
    setUpdating(orderId);
    try {
      await adminApi.markDelivered(orderId);
      toast.success('Order marked as Delivered!');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to mark delivered');
    } finally { setUpdating(null); }
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-black flex items-center gap-2">
            <Truck className="w-5 h-5 text-sky-400" /> Dispatched Orders
          </h1>
          <p className="text-black/60 text-sm mt-0.5">{orders.length} orders out for delivery</p>
        </div>
        <button onClick={fetchData} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[#E3422C]">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by order ID or franchise name..." className="w-full sm:w-80" />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : paginated.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No dispatched orders"
              description="Orders will show up here once they're out for delivery."
            />
          ) : (
            <table className="w-full">
              <thead className="border-b border-[#E3422C] bg-[#E3422C]/95 backdrop-blur">
                <tr>
                  <th className="table-th">Order ID</th>
                  <th className="table-th">Franchise / User</th>
                  <th className="table-th">Kitchen</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Dispatched On</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3422C]/40">
                {paginated.map(order => (
                  <tr key={order.id} className="hover:bg-[#E3422C]/5 transition-colors">
                    <td className="table-td font-mono text-sky-400 text-xs font-bold">
                      #{String(order.id).slice(-8).toUpperCase()}
                    </td>
                    <td className="table-td text-black text-sm">{order.userName || '—'}</td>
                    <td className="table-td text-black text-sm">{order.kitchenName || '—'}</td>
                    <td className="table-td font-semibold text-black">₹{order.totalAmount}</td>
                    <td className="table-td text-black text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#FFEEE7] text-black border border-[#E3422C] hover:bg-[#FFEEE7]/70 transition-all"
                        >
                          <Eye className="w-3 h-3" /> Details
                        </button>
                        <button
                          onClick={() => markDelivered(String(order.id))}
                          disabled={updating === String(order.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 transition-all"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {updating === String(order.id) ? 'Updating...' : 'Mark Delivered'}
                        </button>
                      </div>
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

export default AdminDispatchedOrdersPage;