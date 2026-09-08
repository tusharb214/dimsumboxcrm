 import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ChefHat, Settings2, Eye, CheckCircle2 } from 'lucide-react';
import { adminApi, dashboardApi } from '../../api/services';
import { Order, Kitchen, OrderStatus } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const LIMIT = 10;
const STATUSES: OrderStatus[] = ['REQUESTED', 'ACCEPTED', 'ASSIGNED', 'PREPARING', 'READY', 'APPROVAL_PENDING', 'DISPATCHED', 'DELIVERED', 'COMPLETED', 'REJECTED'];

const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const [addressModal, setAddressModal] = useState<{ orderId: string; address: string } | null>(null);

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

  const confirmApproveDelivery = async () => {
    if (!addressModal) return;
    setUpdating(addressModal.orderId);
    try {
      await adminApi.approveDelivery(addressModal.orderId, addressModal.address);
      toast.success('Delivery approved! Address sent to kitchen.');
      setAddressModal(null);
      fetchData();
    } catch { toast.error('Failed to approve delivery'); }
    finally { setUpdating(null); }
  };

  const markDelivered = async (orderId: string) => {
    setUpdating(orderId);
    try {
      await adminApi.markDelivered(orderId);
      toast.success('Order marked as Delivered!');
      fetchData();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to mark delivered'); }
    finally { setUpdating(null); }
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">Orders Management</h1>
          <p className="text-black/60 text-sm mt-0.5">{orders.length} total orders</p>
        </div>
        <button onClick={fetchData} className="btn-secondary"><RefreshCw className="w-4 h-4" />Refresh</button>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-[#E3422C]">
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
              <thead className="border-b border-[#E3422C] bg-[#FFEEE7]">
                <tr>
                  <th className="table-th">Order ID</th>
                  <th className="table-th">User</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Kitchen</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3422C]/40">
                {paginated.map(order => (
                  <tr key={order.id} className={`hover:bg-white/2 transition-colors ${updating === String(order.id) ? 'opacity-60' : ''}`}>
                    <td className="table-td font-mono text-black text-xs">#{String(order.id).slice(-8).toUpperCase()}</td>
                    <td className="table-td">{order.userName || '—'}</td>
                    <td className="table-td"><StatusBadge status={order.status} /></td>
                    <td className="table-td">
                      {order.kitchenName ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                          <ChefHat className="w-3.5 h-3.5" />{order.kitchenName}
                        </span>
                      ) : (
                        <span className="text-xs text-black/60">Not Assigned</span>
                      )}
                    </td>
                    <td className="table-td font-semibold text-black">₹{order.totalAmount}</td>
                    <td className="table-td text-black/60 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                     {order.status === 'READY' && (
                          <button
                            onClick={() => setAddressModal({ orderId: String(order.id), address: '' })}
                            disabled={updating === String(order.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-40 transition-all"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve for Delivery
                          </button>
                        )}
                        {order.status === 'DISPATCHED' && (
                          <button
                            onClick={() => markDelivered(String(order.id))}
                            disabled={updating === String(order.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-40 transition-all"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Mark Delivered
                          </button>
                        )}
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

      {/* Address Modal */}
      {addressModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold text-black">Approve for Delivery</h3>
            <p className="text-xs text-black/60">Enter the delivery address. Kitchen will see this on their Dispatch page.</p>
            <textarea
              value={addressModal.address}
              onChange={e => setAddressModal(prev => prev ? { ...prev, address: e.target.value } : null)}
              placeholder="Full delivery address..."
              className="input-field w-full py-2 text-sm resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setAddressModal(null)} className="flex-1 py-2 rounded-xl text-xs text-black border border-[#E3422C] hover:bg-[#E3422C]/10 transition-all">Cancel</button>
              <button
                onClick={confirmApproveDelivery}
                disabled={!addressModal.address.trim() || !!updating}
                className="flex-1 py-2 rounded-xl text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 transition-all"
              >
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;