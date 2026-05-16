import React, { useEffect, useState, useMemo } from 'react';
import { ClipboardList, RefreshCw, Download, CheckCircle, Edit2 } from 'lucide-react';
import { userApi, pdfApi } from '../../api/services';
import { Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const LIMIT = 10;

const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    userApi.getMyOrders()
      .then(r => {
        const data = r.data;
        if (Array.isArray(data)) setOrders(data);
        else if (Array.isArray(data?.orders)) setOrders(data.orders);
        else if (Array.isArray(data?.data)) setOrders(data.data);
        else setOrders([]);
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  // ── PDF Download ──────────────────────────────────────────────
  const handleDownloadPdf = async (orderId: string) => {
    setActionLoading(`pdf-${orderId}`);
    try {
      const res = await pdfApi.downloadOrderPdf(orderId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-${orderId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded!');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Confirm Delivery ──────────────────────────────────────────
  const handleConfirmDelivery = async (orderId: string) => {
    setActionLoading(`confirm-${orderId}`);
    try {
      await userApi.confirmDelivery(orderId);
      toast.success('Delivery confirmed!');
      fetchOrders();
    } catch {
      toast.error('Failed to confirm delivery');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Resubmit Rejected Order ───────────────────────────────────
  const handleResubmit = (order: Order) => {
    navigate('/dashboard/order', { state: { resubmitOrder: order } });
  };

  const filtered = useMemo(() => orders.filter(o => {
    const matchSearch = String(o.id).toLowerCase().includes(search.toLowerCase()) ||
      (o.kitchenName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchSearch && matchStatus;
  }), [orders, search, statusFilter]);

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const statuses = ['ALL', 'REQUESTED', 'ACCEPTED', 'ASSIGNED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED', 'REJECTED'];

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My Orders</h1>
          <p className="text-slate-400 text-sm mt-0.5">{orders.length} total orders</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-800">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by ID or kitchen..." className="flex-1" />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-44 py-2.5"
          >
            {statuses.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : paginated.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No orders found"
              description={search ? 'Try adjusting your search or filters' : "You haven't placed any orders yet"}
            />
          ) : (
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="table-th">Order ID</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Kitchen</th>
                  <th className="table-th">Items</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginated.map(order => (
                  <tr key={order.id} className="hover:bg-white/2 transition-colors">
                    <td className="table-td font-mono text-sky-400">
                      #{String(order.id).slice(-8).toUpperCase()}
                    </td>
                    <td className="table-td">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="table-td text-slate-400">{order.kitchenName || '—'}</td>
                    <td className="table-td text-slate-400">
                      {order.items?.length > 0
                        ? order.items.map(item => (
                            <span key={item.materialId} className="block text-xs leading-5">
                              {item.materialName} × {item.quantity}
                            </span>
                          ))
                        : '—'}
                    </td>
                    <td className="table-td font-semibold text-white">₹{order.totalAmount}</td>
                    <td className="table-td text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>

                    {/* ── Actions column ── */}
                    <td className="table-td">
                      <div className="flex items-center gap-2">

                        {/* Confirm Delivery — only when DELIVERED */}
                        {order.status === 'DELIVERED' && (
                          <button
                            onClick={() => handleConfirmDelivery(String(order.id))}
                            disabled={actionLoading === `confirm-${order.id}`}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
                              bg-emerald-500/20 text-emerald-400 border border-emerald-500/30
                              hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            <CheckCircle className="w-3 h-3" />
                            {actionLoading === `confirm-${order.id}` ? 'Confirming...' : 'Confirm'}
                          </button>
                        )}

                        {/* PDF Download — only when COMPLETED */}
                        {order.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleDownloadPdf(String(order.id))}
                            disabled={actionLoading === `pdf-${order.id}`}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
                              bg-sky-500/20 text-sky-400 border border-sky-500/30
                              hover:bg-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            <Download className="w-3 h-3" />
                            {actionLoading === `pdf-${order.id}` ? 'Downloading...' : 'Invoice'}
                          </button>
                        )}

                        {/* Edit & Resubmit — only when REJECTED */}
                        {order.status === 'REJECTED' && (
                          <button
                            onClick={() => handleResubmit(order)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
                              bg-amber-500/20 text-amber-400 border border-amber-500/30
                              hover:bg-amber-500/30 transition-all"
                          >
                            <Edit2 className="w-3 h-3" /> Edit & Resubmit
                          </button>
                        )}

                        {/* No action for other statuses */}
                        {order.status !== 'DELIVERED' && order.status !== 'COMPLETED' && order.status !== 'REJECTED' && (
                          <span className="text-xs text-slate-600">—</span>
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
    </div>
  );
};

export default MyOrdersPage;