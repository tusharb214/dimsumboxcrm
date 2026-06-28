 import React, { useEffect, useState, useMemo } from 'react';
import {
  Truck, RefreshCw, Search, MapPin, User, Package, X,
  CheckCircle2, Clock, Send, ChevronDown, ChevronUp
} from 'lucide-react';
import { kitchenApi } from '../../api/services';
import { Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const LIMIT = 15;

// ── Dispatch Modal ────────────────────────────────────────────────
interface DispatchModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

const DispatchModal: React.FC<DispatchModalProps> = ({ order, onClose, onSuccess }) => {
  const [driverName, setDriverName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!driverName.trim()) { toast.error('Driver name is required'); return; }
    setLoading(true);
    try {
      await kitchenApi.dispatchOrder(String(order.id), {
        driverName: driverName.trim(),
        vehicleNumber: vehicleNumber.trim(),
        estimatedDeliveryTime: estimatedDeliveryTime.trim(),
      });
      toast.success(`Order #${String(order.id).slice(-6).toUpperCase()} dispatched!`);
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to dispatch order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white">Dispatch Order</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              #{String(order.id).slice(-8).toUpperCase()} · {order.userName} · ₹{order.totalAmount}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <div className="mx-6 mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <MapPin className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-sky-300 font-medium">Delivery Address</p>
              <p className="text-xs text-slate-300 mt-0.5">{order.deliveryAddress}</p>
            </div>
          </div>
        )}

        {/* Quick Info Row */}
        <div className="mx-6 mt-3 flex items-center gap-4 px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <span className="text-xs text-slate-400">
            <span className="text-white font-semibold">{order.items?.length || 0}</span> items
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-xs text-slate-400">
            Total <span className="text-white font-semibold">₹{order.totalAmount}</span>
          </span>
        </div>

        {/* Dispatch Form */}
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="label">Driver Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={driverName}
              onChange={e => setDriverName(e.target.value)}
              placeholder="Enter driver full name"
              className="input-field py-2.5 text-sm"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Delivery Date</label>
              <input
                type="date"
                value={estimatedDeliveryTime.split('T')[0] ?? ''}
                onChange={e => setEstimatedDeliveryTime(e.target.value + 'T' + (estimatedDeliveryTime.split('T')[1] ?? '00:00'))}
                className="input-field py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="label">Delivery Time</label>
              <input
                type="time"
                value={estimatedDeliveryTime.split('T')[1] ?? ''}
                onChange={e => setEstimatedDeliveryTime((estimatedDeliveryTime.split('T')[0] ?? '') + 'T' + e.target.value)}
                className="input-field py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-slate-400 border border-slate-700 hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !driverName.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Dispatching...' : 'Dispatch Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Location Update Modal ─────────────────────────────────────────
interface LocationModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ order, onClose, onSuccess }) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!location.trim()) { toast.error('Enter current location'); return; }
    const dateTime = date && time ? ` (${date} ${time})` : date ? ` (${date})` : time ? ` (${time})` : '';
    const fullLocation = location.trim() + dateTime;
    setLoading(true);
    try {
      await kitchenApi.updateLocation(String(order.id), fullLocation);
      toast.success('Location updated!');
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white">Update Location</h2>
            <p className="text-xs text-slate-400 mt-0.5">#{String(order.id).slice(-8).toUpperCase()} · {order.userName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        {order.currentLocation && (
          <div className="mx-6 mt-4 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
            <MapPin className="w-3 h-3" /> Current: {order.currentLocation}
          </div>
        )}
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="label">Current Location <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Near Pune Station, FC Road..."
              className="input-field py-2.5 text-sm"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="input-field py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="label">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="input-field py-2.5 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-400 border border-slate-700 hover:bg-slate-800 transition-all">
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || !location.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <MapPin className="w-4 h-4" />
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Dispatch Page ────────────────────────────────────────────
type TabType = 'pending' | 'dispatched';
type SortField = 'id' | 'amount' | 'date';
type SortDir = 'asc' | 'desc';

const KitchenDispatchPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [dispatchModal, setDispatchModal] = useState<Order | null>(null);
  const [locationModal, setLocationModal] = useState<Order | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const r = await kitchenApi.getAssignedOrders();
      setOrders(r.data.data ?? []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const pendingOrders = orders.filter(o => o.status === 'APPROVAL_PENDING');
  const dispatchedOrders = orders.filter(o => o.status === 'DISPATCHED');
  const activeList = tab === 'pending' ? pendingOrders : dispatchedOrders;

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return activeList
      .filter(o =>
        String(o.id).includes(q) ||
        (o.userName || '').toLowerCase().includes(q) ||
        (o.deliveryAddress || '').toLowerCase().includes(q) ||
        (o.driverName || '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'id') diff = Number(a.id) - Number(b.id);
        else if (sortField === 'amount') diff = (a.totalAmount ?? 0) - (b.totalAmount ?? 0);
        else diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortDir === 'asc' ? diff : -diff;
      });
  }, [activeList, search, sortField, sortDir]);

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);
  const totalPages = Math.ceil(filtered.length / LIMIT);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-600" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-sky-400" />
      : <ChevronDown className="w-3 h-3 text-sky-400" />;
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dispatch</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage order dispatches and live tracking</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{pendingOrders.length}</p>
            <p className="text-xs text-slate-500">Ready to Dispatch</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{dispatchedOrders.length}</p>
            <p className="text-xs text-slate-500">Dispatched Today</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{orders.length}</p>
            <p className="text-xs text-slate-500">Total Assigned</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden">

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-slate-800">
          <div className="flex rounded-xl bg-slate-800/60 p-1 gap-1">
            <button
              onClick={() => { setTab('pending'); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === 'pending'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ready to Dispatch
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs">
                {pendingOrders.length}
              </span>
            </button>
            <button
              onClick={() => { setTab('dispatched'); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === 'dispatched'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Dispatched
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-400 text-xs">
                {dispatchedOrders.length}
              </span>
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search order, customer, driver..."
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={tab === 'pending' ? 6 : 7} />
          ) : paginated.length === 0 ? (
            <EmptyState
              icon={Truck}
              title={tab === 'pending' ? 'No orders ready to dispatch' : 'No dispatched orders'}
              description={tab === 'pending'
                ? 'Orders approved by admin will appear here'
                : 'Dispatched orders will appear here'}
            />
          ) : (
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th
                    className="table-th cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => toggleSort('id')}
                  >
                    <span className="flex items-center gap-1">Order ID <SortIcon field="id" /></span>
                  </th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Address</th>
                  <th className="table-th">Items</th>
                  <th
                    className="table-th cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => toggleSort('amount')}
                  >
                    <span className="flex items-center gap-1">Amount <SortIcon field="amount" /></span>
                  </th>
                  {tab === 'dispatched' && <th className="table-th">Driver</th>}
                  {tab === 'dispatched' && <th className="table-th">Location</th>}
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginated.map(order => (
                  <tr key={order.id} className="hover:bg-white/2 transition-colors">
                    <td className="table-td">
                      <span className="font-mono text-sky-400 text-xs font-bold">
                        #{String(order.id).slice(-8).toUpperCase()}
                      </span>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="text-sm text-slate-300 truncate max-w-[120px]">
                          {order.userName || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="table-td">
                      {order.deliveryAddress ? (
                        <div className="flex items-start gap-1.5 max-w-[160px]">
                          <MapPin className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-slate-300 line-clamp-2">{order.deliveryAddress}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-400">No address</span>
                      )}
                    </td>
                    <td className="table-td">
                      <button
                        onClick={() => setViewOrder(order)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 transition-colors"
                      >
                        <Package className="w-3.5 h-3.5" />
                        {order.items?.length || 0} items
                      </button>
                    </td>
                    <td className="table-td font-semibold text-white">₹{order.totalAmount}</td>
                    {tab === 'dispatched' && (
                      <td className="table-td">
                        {order.driverName ? (
                          <div>
                            <p className="text-xs text-slate-300 font-medium">{order.driverName}</p>
                            {order.vehicleNumber && (
                              <p className="text-xs text-slate-500">{order.vehicleNumber}</p>
                            )}
                            {order.estimatedDeliveryTime && (
                              <p className="text-xs text-emerald-400">ETA {order.estimatedDeliveryTime}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                    )}
                    {tab === 'dispatched' && (
                      <td className="table-td">
                        {order.currentLocation ? (
                          <span className="text-xs text-amber-400 flex items-center gap-1">
                            📍 {order.currentLocation}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">Not updated</span>
                        )}
                      </td>
                    )}
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        {tab === 'pending' && (
                          <button
                            onClick={() => setDispatchModal(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all whitespace-nowrap"
                          >
                            <Truck className="w-3.5 h-3.5" /> Dispatch
                          </button>
                        )}
                        {tab === 'dispatched' && (
                          <button
                            onClick={() => setLocationModal(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 transition-all whitespace-nowrap"
                          >
                            <MapPin className="w-3.5 h-3.5" /> Update
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                    p === page
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Items Modal */}
      {viewOrder && (
        <div className="modal-overlay" onClick={() => setViewOrder(null)}>
          <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Order #{String(viewOrder.id).slice(-8).toUpperCase()}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{viewOrder.userName} · ₹{viewOrder.totalAmount}</p>
              </div>
              <button onClick={() => setViewOrder(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
              {viewOrder.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm text-white font-medium">{item.materialName}</p>
                    {item.category && (
                      <p className="text-xs text-slate-500">{item.category}{item.brand ? ` · ${item.brand}` : ''}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-bold text-white">×{item.quantity}</p>
                    <p className="text-xs text-sky-400">₹{item.lineTotal}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/50">
              <span className="text-xs text-slate-400 font-semibold">Total</span>
              <span className="text-base font-bold text-white">₹{viewOrder.totalAmount}</span>
            </div>
            {viewOrder.orderNotes && (
              <div className="mx-6 mb-4 px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <p className="text-xs text-slate-400 mb-1">Notes</p>
                <p className="text-xs text-slate-300">{viewOrder.orderNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchModal && (
        <DispatchModal
          order={dispatchModal}
          onClose={() => setDispatchModal(null)}
          onSuccess={fetchOrders}
        />
      )}

      {/* Location Modal */}
      {locationModal && (
        <LocationModal
          order={locationModal}
          onClose={() => setLocationModal(null)}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
};

export default KitchenDispatchPage;