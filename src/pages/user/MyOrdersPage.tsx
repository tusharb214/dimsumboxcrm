 import React, { useEffect, useState, useMemo } from 'react';
import {
  ClipboardList, RefreshCw, Download, CheckCircle, Edit2, Upload,
  X, Package, MapPin, Truck, Clock, CheckCircle2, ChefHat, Eye
} from 'lucide-react';
import { userApi, pdfApi, orderMediaApi } from '../../api/services';
import { Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const LIMIT = 10;

// ── Order Status Timeline ─────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'REQUESTED',        label: 'Order Placed',     icon: ClipboardList },
  { key: 'ACCEPTED',         label: 'Accepted',         icon: CheckCircle2 },
  { key: 'ASSIGNED',         label: 'Kitchen Assigned', icon: ChefHat },
  { key: 'PREPARING',        label: 'Preparing',        icon: Clock },
  { key: 'READY',            label: 'Ready',            icon: Package },
  { key: 'APPROVAL_PENDING', label: 'Admin Approved',   icon: CheckCircle2 },
  { key: 'DISPATCHED',       label: 'Dispatched',       icon: Truck },
  { key: 'DELIVERED',        label: 'Delivered',        icon: MapPin },
  { key: 'COMPLETED',        label: 'Completed',        icon: CheckCircle },
];

const REJECTED_STEPS = [
  { key: 'REQUESTED', label: 'Order Placed', icon: ClipboardList },
  { key: 'REJECTED',  label: 'Rejected',     icon: X },
];

const getStepIndex = (status: string) =>
  STATUS_STEPS.findIndex(s => s.key === status);

const OrderTimeline: React.FC<{ status: string }> = ({ status }) => {
  const isRejected = status === 'REJECTED';
  const steps = isRejected ? REJECTED_STEPS : STATUS_STEPS;
  const currentIdx = isRejected ? 1 : getStepIndex(status);

  return (
    <div className="relative">
      <div className="flex items-start gap-0">
        {steps.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className={`absolute top-3.5 left-1/2 w-full h-0.5 z-0 transition-all ${
                  done ? 'bg-emerald-500/60' : 'bg-slate-700'
                }`} />
              )}
              {/* Circle */}
              <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                active
                  ? isRejected && i === 1
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-sky-500/20 border-sky-500 text-sky-400'
                  : done
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-600'
              }`}>
                <Icon className="w-3 h-3" />
              </div>
              {/* Label */}
              <p className={`mt-1.5 text-center text-xs leading-tight px-0.5 ${
                active
                  ? isRejected && i === 1 ? 'text-red-400 font-semibold' : 'text-sky-400 font-semibold'
                  : done ? 'text-emerald-400' : 'text-slate-600'
              }`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Order Detail Modal ────────────────────────────────────────────
interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onConfirmDelivery: (orderId: string) => void;
  onDownloadPdf: (orderId: string) => void;
  onResubmit: (order: Order) => void;
  actionLoading: string | null;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order, onClose, onConfirmDelivery, onDownloadPdf, onResubmit, actionLoading
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-sm font-bold text-white">
              Order #{String(order.id).slice(-8).toUpperCase()}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Order Timeline */}
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">
              Order Progress
            </p>
            <OrderTimeline status={order.status} />
          </div>

          {/* Tracking Info — show when dispatched */}
          {(order.status === 'DISPATCHED' || order.status === 'DELIVERED') && (
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-800/50 border-b border-slate-800 flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                <p className="text-xs font-semibold text-white">Delivery Tracking</p>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                {order.deliveryAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Delivery Address</p>
                      <p className="text-xs text-slate-300 mt-0.5">{order.deliveryAddress}</p>
                    </div>
                  </div>
                )}
                {order.driverName && (
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Driver</p>
                      <p className="text-xs text-slate-300">{order.driverName}</p>
                    </div>
                  </div>
                )}
                {order.estimatedDeliveryTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Expected Delivery</p>
                      <p className="text-xs text-amber-400 font-medium">{order.estimatedDeliveryTime}</p>
                    </div>
                  </div>
                )}
                {order.currentLocation && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-sm">📍</span>
                    <div>
                      <p className="text-xs text-slate-500">Current Location</p>
                      <p className="text-xs text-amber-400 font-medium">{order.currentLocation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Address when admin approved but not yet dispatched */}
          {order.status === 'APPROVAL_PENDING' && order.deliveryAddress && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <MapPin className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-sky-300 font-medium">Delivery Address</p>
                <p className="text-xs text-slate-300 mt-0.5">{order.deliveryAddress}</p>
              </div>
            </div>
          )}

          {/* Kitchen Info */}
          {order.kitchenName && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <ChefHat className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-500">Assigned Kitchen</p>
                <p className="text-xs text-emerald-400 font-medium">{order.kitchenName}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-800/50 border-b border-slate-800 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-xs font-semibold text-white">
                Items ({order.items?.length || 0})
              </p>
            </div>
            <div className="divide-y divide-slate-800/60">
              {order.items?.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No items</p>
              ) : (
                order.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-white font-medium">{item.materialName}</p>
                      {(item.category || item.brand) && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.category}{item.brand ? ` · ${item.brand}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm font-bold text-white">×{item.quantity}</p>
                      {item.priceAtOrder && (
                        <p className="text-xs text-slate-500">₹{item.priceAtOrder} each</p>
                      )}
                      {item.lineTotal && (
                        <p className="text-xs text-sky-400 font-semibold">₹{item.lineTotal}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/50">
              <span className="text-xs font-semibold text-slate-400">Total Amount</span>
              <span className="text-base font-bold text-white">₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Order Notes */}
          {order.orderNotes && (
            <div className="px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <p className="text-xs text-slate-400 mb-1">Order Notes</p>
              <p className="text-xs text-slate-300">{order.orderNotes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {order.status === 'DELIVERED' && (
              <button
                onClick={() => { onConfirmDelivery(String(order.id)); onClose(); }}
                disabled={actionLoading === `confirm-${order.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                {actionLoading === `confirm-${order.id}` ? 'Confirming...' : 'Confirm Delivery'}
              </button>
            )}
            {order.status === 'COMPLETED' && (
              <button
                onClick={() => onDownloadPdf(String(order.id))}
                disabled={actionLoading === `pdf-${order.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 disabled:opacity-40 transition-all"
              >
                <Download className="w-4 h-4" />
                {actionLoading === `pdf-${order.id}` ? 'Downloading...' : 'Download Invoice'}
              </button>
            )}
            {order.status === 'REJECTED' && (
              <button
                onClick={() => { onResubmit(order); onClose(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
              >
                <Edit2 className="w-4 h-4" /> Edit & Resubmit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────
const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

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

  const handleUploadScreenshot = async (orderId: string, file: File) => {
    setUploadingFor(orderId);
    try {
      await orderMediaApi.uploadScreenshot(orderId, file);
      toast.success('Screenshot uploaded!');
    } catch {
      toast.error('Failed to upload screenshot');
    } finally {
      setUploadingFor(null);
    }
  };

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

  const handleResubmit = (order: Order) => {
    navigate('/dashboard/order', { state: { resubmitOrder: order } });
  };

  const filtered = useMemo(() => orders.filter(o => {
    const matchSearch =
      String(o.id).toLowerCase().includes(search.toLowerCase()) ||
      (o.kitchenName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchSearch && matchStatus;
  }), [orders, search, statusFilter]);

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);
  const statuses = ['ALL', 'REQUESTED', 'ACCEPTED', 'ASSIGNED', 'PREPARING', 'READY', 'APPROVAL_PENDING', 'DISPATCHED', 'DELIVERED', 'COMPLETED', 'REJECTED'];

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
            className="input-field w-full sm:w-48 py-2.5"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
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
                    <td className="table-td font-mono text-sky-400 text-xs font-bold">
                      #{String(order.id).slice(-8).toUpperCase()}
                    </td>
                    <td className="table-td">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="table-td text-slate-400 text-sm">
                      {order.kitchenName || '—'}
                    </td>
                    <td className="table-td text-slate-400 text-xs">
                      {order.items?.length > 0
                        ? `${order.items.length} item${order.items.length > 1 ? 's' : ''}`
                        : '—'}
                    </td>
                    <td className="table-td font-semibold text-white">₹{order.totalAmount}</td>
                    <td className="table-td text-slate-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* See Details — always visible */}
                        <button
                          onClick={() => setDetailOrder(order)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
                        >
                          <Eye className="w-3 h-3" /> Details
                        </button>

                        {/* Upload Screenshot */}
                        {['REQUESTED', 'ACCEPTED', 'ASSIGNED', 'PREPARING'].includes(order.status) && (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              id={`ss-${order.id}`}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadScreenshot(String(order.id), file);
                                e.target.value = '';
                              }}
                            />
                            <label
                              htmlFor={`ss-${order.id}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30 cursor-pointer transition-all"
                            >
                              {uploadingFor === String(order.id)
                                ? <RefreshCw className="w-3 h-3 animate-spin" />
                                : <Upload className="w-3 h-3" />}
                              SS
                            </label>
                          </>
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

      {/* Order Detail Modal */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onConfirmDelivery={handleConfirmDelivery}
          onDownloadPdf={handleDownloadPdf}
          onResubmit={handleResubmit}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default MyOrdersPage;