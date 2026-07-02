import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ChefHat, User, RefreshCw, Download, MapPin, Truck } from 'lucide-react';
import { adminApi } from '../../api/services';
import { Order, Kitchen } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const AdminOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [addressModal, setAddressModal] = useState<{ address: string } | null>(null);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const [o, k] = await Promise.all([
        adminApi.getOrderById(orderId!),
        adminApi.getAllKitchens(),
      ]);
      const orderData = o.data?.data ?? o.data;
      setOrder(orderData);
      setKitchens(k.data?.data ?? []);
    } catch { toast.error('Failed to load order'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  const assignKitchen = async (kitchenId: string) => {
    if (!kitchenId || !order) return;
    if (order.status !== 'ACCEPTED') {
      toast.error('Order must be ACCEPTED to assign kitchen');
      return;
    }
    setUpdating(true);
    try {
      await adminApi.assignKitchenToOrder(String(order.id), kitchenId);
      toast.success('Kitchen assigned!');
      fetchOrder();
    } catch { toast.error('Failed to assign kitchen'); }
    finally { setUpdating(false); }
  };

  const acceptOrder = async () => {
    setUpdating(true);
    try { await adminApi.acceptOrder(String(order!.id)); toast.success('Order accepted!'); fetchOrder(); }
    catch { toast.error('Failed to accept'); } finally { setUpdating(false); }
  };

  const rejectOrder = async () => {
    setUpdating(true);
    try { await adminApi.rejectOrder(String(order!.id)); toast.success('Order rejected!'); fetchOrder(); }
    catch { toast.error('Failed to reject'); } finally { setUpdating(false); }
  };

  const markDelivered = async () => {
    setUpdating(true);
    try { await adminApi.markDelivered(String(order!.id)); toast.success('Order marked as Delivered!'); fetchOrder(); }
    catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to mark delivered'); }
    finally { setUpdating(false); }
  };

  const confirmApproveDelivery = async () => {
    if (!addressModal || !order) return;
    setUpdating(true);
    try {
      await adminApi.approveDelivery(String(order.id), addressModal.address);
      toast.success('Delivery approved! Address sent to kitchen.');
      setAddressModal(null);
      fetchOrder();
    } catch { toast.error('Failed to approve delivery'); }
    finally { setUpdating(false); }
  };

  const downloadExcel = () => {
    if (!order) return;
    const itemRows = (order.items || []).map((item: any, i: number) => ({
      'Sr No': i + 1,
      'Item Name': item.materialName || '—',
      'Category': item.category || '—',
      'Brand': item.brand || '—',
      'Quantity': item.quantity ?? 0,
      'Price Per Unit (₹)': item.priceAtOrder ?? item.price ?? 0,
      'Line Total (₹)': item.lineTotal ?? 0,
    }));
    itemRows.push({} as any);
    itemRows.push({
      'Sr No': '' as any, 'Item Name': 'TOTAL', 'Category': '', 'Brand': '',
      'Quantity': '' as any, 'Price Per Unit (₹)': '' as any, 'Line Total (₹)': order.totalAmount,
    });
    const ws = XLSX.utils.json_to_sheet(itemRows);
    ws['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 14 }];
    const infoRows = [
      { Field: 'Order ID', Value: `#${String(order.id).slice(-8).toUpperCase()}` },
      { Field: 'Date', Value: new Date(order.createdAt).toLocaleDateString('en-IN') },
      { Field: 'Franchise / User', Value: order.userName || '—' },
      { Field: 'Email', Value: order.userEmail || '—' },
      { Field: 'Kitchen', Value: order.kitchenName || 'Not Assigned' },
      { Field: 'Status', Value: order.status },
      { Field: 'Delivery Address', Value: order.deliveryAddress || '—' },
      { Field: 'Driver Name', Value: order.driverName || '—' },
      { Field: 'Vehicle Number', Value: order.vehicleNumber || '—' },
      { Field: 'Total Amount (₹)', Value: order.totalAmount },
      { Field: 'Amount Paid (₹)', Value: (order as any).amountPaid ?? 0 },
      { Field: 'Amount Remaining (₹)', Value: (order as any).amountRemaining ?? 0 },
      { Field: 'Order Notes', Value: order.orderNotes || '—' },
    ];
    const ws2 = XLSX.utils.json_to_sheet(infoRows);
    ws2['!cols'] = [{ wch: 22 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws2, 'Order Info');
    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    XLSX.writeFile(wb, `Order-${String(order.id).slice(-8).toUpperCase()}.xlsx`);
    toast.success('Excel downloaded!');
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  if (!order) return <div className="flex items-center justify-center h-64 text-slate-400">Order not found</div>;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/orders')} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Order #{String(order.id).slice(-8).toUpperCase()}</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <button onClick={downloadExcel} className="btn-secondary"><Download className="w-4 h-4" /> Download Excel</button>
          <button onClick={fetchOrder} className="btn-secondary"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

   <div className="lg:col-span-2 space-y-5">

          {/* Order Items */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-white">Order Items ({order.items?.length || 0})</h2>
            </div>
            <div className="divide-y divide-slate-800/60">
              {order.items?.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No items</p>
              ) : (
                order.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">{item.materialName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.category || ''}{item.brand ? ` • ${item.brand}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">x{item.quantity}</p>
                      <p className="text-xs text-slate-400">₹{item.priceAtOrder} each</p>
                      <p className="text-xs font-semibold text-sky-400 mt-0.5">₹{item.lineTotal}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-400">Total Amount</span>
              <span className="text-lg font-bold text-white">₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Dispatch Info — visible once dispatched */}
          {(order.deliveryAddress || order.driverName || order.currentLocation) && (
            <div className="card px-5 py-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-semibold text-white">Dispatch Info</h2>
              </div>
              {order.deliveryAddress && (
                <div>
                  <p className="text-xs text-slate-400">Delivery Address</p>
                  <p className="text-sm text-slate-300">{order.deliveryAddress}</p>
                </div>
              )}
              {order.driverName && (
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-slate-400">Driver</p>
                    <p className="text-sm text-slate-300">{order.driverName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Vehicle</p>
                    <p className="text-sm text-slate-300">{order.vehicleNumber || '—'}</p>
                  </div>
                  {order.estimatedDeliveryTime && (
                    <div>
                      <p className="text-xs text-slate-400">ETA</p>
                      <p className="text-sm text-slate-300">{order.estimatedDeliveryTime}</p>
                    </div>
                  )}
                </div>
              )}
              {order.currentLocation && (
                <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                  <MapPin className="w-3.5 h-3.5" /> {order.currentLocation}
                </div>
              )}
            </div>
          )}

          {order.orderNotes && (
            <div className="card px-5 py-4">
              <p className="text-xs text-slate-400 mb-1">Order Notes</p>
              <p className="text-sm text-slate-300">{order.orderNotes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {order.status === 'REQUESTED' && (
              <>
                <button onClick={acceptOrder} disabled={updating}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 transition-all">
                  Accept Order
                </button>
                <button onClick={rejectOrder} disabled={updating}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-40 transition-all">
                  Reject Order
                </button>
              </>
            )}
           {order.status === 'READY' && (
              <button onClick={() => setAddressModal({ address: '' })} disabled={updating}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 transition-all">
                Approve for Delivery
              </button>
            )}
            {order.status === 'DISPATCHED' && (
              <button onClick={markDelivered} disabled={updating}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 transition-all">
                {updating ? 'Marking...' : 'Mark as Delivered'}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — Info */}
        <div className="space-y-4">

          <div className="card px-5 py-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-white">Franchise Info</h2>
            </div>
            <div>
              <p className="text-xs text-slate-400">Name</p>
              <p className="text-sm font-semibold text-white">{order.userName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-sm text-slate-300">{order.userEmail || '—'}</p>
            </div>
          </div>

          <div className="card px-5 py-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <ChefHat className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Kitchen</h2>
            </div>
            {order.kitchenName ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <ChefHat className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">{order.kitchenName}</span>
              </div>
            ) : (
              <>
                <select
                  onChange={e => assignKitchen(e.target.value)}
                  disabled={updating || order.status !== 'ACCEPTED'}
                  defaultValue=""
                  className="w-full text-sm bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Select kitchen</option>
                  {kitchens.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
                {order.status !== 'ACCEPTED' && (
                  <p className="text-xs text-amber-400">Order must be ACCEPTED first</p>
                )}
              </>
            )}
          </div>

          <div className="card px-5 py-4 space-y-3">
            <h2 className="text-sm font-semibold text-white mb-1">Payment</h2>
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Total</span>
              <span className="text-sm font-bold text-white">₹{order.totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Paid</span>
              <span className="text-sm font-bold text-emerald-400">₹{(order as any).amountPaid ?? 0}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2">
              <span className="text-xs text-slate-400">Remaining</span>
              <span className="text-sm font-bold text-amber-400">₹{(order as any).amountRemaining ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {addressModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Approve for Delivery</h3>
            <p className="text-xs text-slate-400">Enter the delivery address. Kitchen will see this on their Dispatch page.</p>
            <textarea
              value={addressModal.address}
              onChange={e => setAddressModal({ address: e.target.value })}
              placeholder="Full delivery address..."
              className="input-field w-full py-2 text-sm resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setAddressModal(null)} className="flex-1 py-2 rounded-xl text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 transition-all">Cancel</button>
              <button
                onClick={confirmApproveDelivery}
                disabled={!addressModal.address.trim() || updating}
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

export default AdminOrderDetailPage;