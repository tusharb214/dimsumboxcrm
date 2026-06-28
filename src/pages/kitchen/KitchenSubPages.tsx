 import React, { useEffect, useState } from 'react';
import { Truck, Shield, Clock, CheckCircle, AlertCircle, RefreshCw, User, MapPin, Package, X } from 'lucide-react';
import { kitchenApi } from '../../api/services';
import { Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

export const KitchenDispatchPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [dispatchInputs, setDispatchInputs] = useState<Record<string, {
    driverName: string; vehicleNumber: string; estimatedDeliveryTime: string; currentLocation: string;
  }>>({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const r = await kitchenApi.getAssignedOrders();
      setOrders(r.data.data ?? []);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const approvalPendingOrders = orders.filter(o => o.status === 'APPROVAL_PENDING');
  const dispatchedOrders = orders.filter(o => o.status === 'DISPATCHED');

  const getInput = (orderId: string) => dispatchInputs[orderId] ?? {
    driverName: '', vehicleNumber: '', estimatedDeliveryTime: '', currentLocation: '',
  };

  const setInput = (orderId: string, field: string, value: string) => {
    setDispatchInputs(prev => ({
      ...prev,
      [orderId]: { ...getInput(orderId), [field]: value },
    }));
  };

  const handleDispatch = async (orderId: string) => {
    const input = getInput(orderId);
    if (!input.driverName.trim()) { toast.error('Driver name required'); return; }
    setDispatching(orderId);
    try {
      await kitchenApi.dispatchOrder(orderId, {
        driverName: input.driverName.trim(),
        vehicleNumber: input.vehicleNumber.trim(),
        estimatedDeliveryTime: input.estimatedDeliveryTime.trim(),
      });
      toast.success('Order dispatched!');
      fetchOrders();
    } catch { toast.error('Failed to dispatch'); }
    finally { setDispatching(null); }
  };

  const handleUpdateLocation = async (orderId: string) => {
    const loc = getInput(orderId).currentLocation;
    if (!loc?.trim()) { toast.error('Enter current location'); return; }
    setDispatching(orderId);
    try {
      await kitchenApi.updateLocation(orderId, loc.trim());
      toast.success('Location updated!');
      setInput(orderId, 'currentLocation', '');
      fetchOrders();
    } catch { toast.error('Failed to update location'); }
    finally { setDispatching(null); }
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dispatch</h1>
          <p className="text-slate-400 text-sm mt-0.5">Admin approved orders ready for dispatch</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary"><RefreshCw className="w-4 h-4" />Refresh</button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Ready to Dispatch', count: approvalPendingOrders.length, color: 'emerald', icon: CheckCircle },
          { label: 'Total Assigned', count: orders.length, color: 'sky', icon: Truck },
          { label: 'Dispatched', count: dispatchedOrders.length, color: 'amber', icon: Clock },
        ].map((s, i) => (
          <div key={i} className="card p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${s.color}-500/10 border border-${s.color}-500/20`}>
              <s.icon className={`w-5 h-5 text-${s.color}-400`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{s.count}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Admin Approved — Ready to Dispatch</h2>
          <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {approvalPendingOrders.length} orders
          </span>
        </div>

        {loading ? <TableSkeleton rows={4} cols={4} /> : approvalPendingOrders.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No orders to dispatch"
            description="Orders will appear here once admin approves them for delivery"
          />
        ) : (
          <div className="divide-y divide-slate-800/60">
            {approvalPendingOrders.map(order => {
              const input = getInput(String(order.id));
              return (
                <div key={order.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sky-400 text-sm font-bold">
                          #{String(order.id).slice(-8).toUpperCase()}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <User className="w-3.5 h-3.5" />
                        <span>{order.userName || '—'}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-white font-semibold">₹{order.totalAmount}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setViewOrder(order)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all"
                      >
                        <Package className="w-3 h-3" /> See Order
                      </button>
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                        Admin Approved
                      </span>
                    </div>
                  </div>

                  {order.deliveryAddress ? (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-sky-300 font-medium">Delivery Address</p>
                        <p className="text-xs text-slate-300 mt-0.5">{order.deliveryAddress}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                      <MapPin className="w-3 h-3" />
                      No delivery address provided by admin yet
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-medium">Dispatch Details</p>
                    <div className="grid sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={input.driverName}
                        onChange={e => setInput(String(order.id), 'driverName', e.target.value)}
                        placeholder="Driver name *"
                        className="input-field py-2 text-xs"
                      />
                      <input
                        type="text"
                        value={input.vehicleNumber}
                        onChange={e => setInput(String(order.id), 'vehicleNumber', e.target.value)}
                        placeholder="Vehicle number"
                        className="input-field py-2 text-xs"
                      />
                      <input
                        type="time"
                        value={input.estimatedDeliveryTime}
                        onChange={e => setInput(String(order.id), 'estimatedDeliveryTime', e.target.value)}
                        className="input-field py-2 text-xs"
                      />
                    </div>
                    <button
                      onClick={() => handleDispatch(String(order.id))}
                      disabled={dispatching === String(order.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 transition-all"
                    >
                      <Truck className="w-3.5 h-3.5" /> Dispatch Order
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {dispatchedOrders.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Dispatched Orders — Live Tracking</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {dispatchedOrders.map(order => {
              const input = getInput(String(order.id));
              return (
                <div key={order.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sky-400 text-sm font-bold">
                          #{String(order.id).slice(-8).toUpperCase()}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <User className="w-3.5 h-3.5" />
                        <span>{order.userName || '—'}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-white font-semibold">₹{order.totalAmount}</span>
                      </div>
                      {order.driverName && (
                        <p className="text-xs text-slate-500">
                          Driver: {order.driverName}{order.vehicleNumber ? ` · ${order.vehicleNumber}` : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setViewOrder(order)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all flex-shrink-0"
                    >
                      <Package className="w-3 h-3" /> See Order
                    </button>
                  </div>
                  {order.deliveryAddress && (
                    <p className="text-xs text-sky-400 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> {order.deliveryAddress}
                    </p>
                  )}
                  {order.currentLocation && (
                    <p className="text-xs text-amber-400 flex items-center gap-1.5">
                      📍 Current: {order.currentLocation}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input.currentLocation}
                      onChange={e => setInput(String(order.id), 'currentLocation', e.target.value)}
                      placeholder="Update current location..."
                      className="input-field flex-1 py-2 text-xs"
                    />
                    <button
                      onClick={() => handleUpdateLocation(String(order.id))}
                      disabled={dispatching === String(order.id)}
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 disabled:opacity-40 transition-all flex-shrink-0"
                    >
                      Update
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Order #{String(viewOrder.id).slice(-8).toUpperCase()}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{viewOrder.userName} · ₹{viewOrder.totalAmount}</p>
              </div>
              <button onClick={() => setViewOrder(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium">Items ({viewOrder.items?.length || 0})</p>
              <div className="divide-y divide-slate-800/60 rounded-xl border border-slate-800 overflow-hidden">
                {viewOrder.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-white font-medium">{item.materialName}</p>
                      {item.category && (
                        <p className="text-xs text-slate-500">{item.category}{item.brand ? ` · ${item.brand}` : ''}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white">×{item.quantity}</p>
                      <p className="text-xs text-sky-400">₹{item.lineTotal}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-xs text-slate-400">Total</span>
                <span className="text-sm font-bold text-white">₹{viewOrder.totalAmount}</span>
              </div>
            </div>
            {viewOrder.orderNotes && (
              <div className="bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/40">
                <p className="text-xs text-slate-400 mb-1">Notes</p>
                <p className="text-xs text-slate-300">{viewOrder.orderNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const KitchenApprovalsPage: React.FC = () => (
  <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-white">Approval Requests</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage approval workflow</p>
      </div>
    </div>
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
        <Shield className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-white">Pending Approvals</h2>
        <span className="badge-warning ml-auto">3 pending</span>
      </div>
      <div className="divide-y divide-slate-800/60">
        {[
          { id: 'APR-001', type: 'Stock Replenishment', requested: 'Mozzarella Cheese - 50kg', requester: 'North Kitchen', time: '2h ago' },
          { id: 'APR-002', type: 'Special Order', requested: 'Bulk Pepperoni - 20kg', requester: 'Central Kitchen', time: '5h ago' },
          { id: 'APR-003', type: 'Return Request', requested: 'Damaged goods - Flour 10kg', requester: 'West Kitchen', time: '1d ago' },
        ].map(req => (
          <div key={req.id} className="px-5 py-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{req.type} <span className="font-mono text-xs text-slate-500">#{req.id}</span></p>
                <p className="text-xs text-slate-400 mt-0.5">{req.requested}</p>
                <p className="text-xs text-slate-600 mt-0.5">{req.requester} · {req.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">Approve</button>
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);