 import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ChefHat, User, RefreshCw, Download } from 'lucide-react';
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

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const [o, k] = await Promise.all([
        adminApi.getOrderById(orderId!),
        adminApi.getAllKitchens(),
      ]);
    //   setOrder(o.data?.data ?? o.data);
     const orderData = o.data?.data ?? o.data;
      console.log('ORDER DATA:', orderData);
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
    try { await adminApi.markDelivered(String(order!.id)); toast.success('Marked as delivered!'); fetchOrder(); }
    catch { toast.error('Failed to mark delivered'); } finally { setUpdating(false); }
  };

  // ── Excel Download ─────────────────────────────────────────────
  const downloadExcel = () => {
    if (!order) return;

    // Items sheet
 
    const itemRows = (order.items || []).map((item: any, i: number) => ({
      'Sr No': i + 1,
      'Item Name': item.materialName || '—',
      'Category': item.category || '—',
      'Brand': item.brand || '—',
      'Quantity': item.quantity ?? 0,
      'Price Per Unit (₹)': item.priceAtOrder ?? item.price ?? 0,
      'Line Total (₹)': item.lineTotal ?? 0,
    }));
    
    // Summary rows at bottom
    itemRows.push({} as any);
    itemRows.push({
      'Sr No': '' as any,
      'Item Name': 'TOTAL',
      'Category': '',
      'Brand': '',
      'Quantity': '' as any,
      'Price Per Unit (₹)': '' as any,
      'Line Total (₹)': order.totalAmount,
    });

    const ws = XLSX.utils.json_to_sheet(itemRows);
    ws['!cols'] = [
      { wch: 6 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
      { wch: 10 }, { wch: 18 }, { wch: 14 },
    ];

    // Order Info sheet
    const infoRows = [
      { Field: 'Order ID', Value: `#${String(order.id).slice(-8).toUpperCase()}` },
      { Field: 'Date', Value: new Date(order.createdAt).toLocaleDateString('en-IN') },
      { Field: 'Franchise / User', Value: order.userName || '—' },
      { Field: 'Email', Value: order.userEmail || '—' },
      { Field: 'Kitchen', Value: order.kitchenName || 'Not Assigned' },
      { Field: 'Status', Value: order.status },
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

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
  );

  if (!order) return (
    <div className="flex items-center justify-center h-64 text-slate-400">Order not found</div>
  );

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/orders')} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              Order #{String(order.id).slice(-8).toUpperCase()}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <button onClick={downloadExcel} className="btn-secondary">
            <Download className="w-4 h-4" /> Download Excel
          </button>
          <button onClick={fetchOrder} className="btn-secondary">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* LEFT — Items */}
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
                        {item.category || ''}
                        {item.brand ? ` • ${item.brand}` : ''}
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

          {/* Notes */}
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
                  ✓ Accept Order
                </button>
                <button onClick={rejectOrder} disabled={updating}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-40 transition-all">
                  ✕ Reject Order
                </button>
              </>
            )}
            {order.status === 'READY' && (
              <button onClick={markDelivered} disabled={updating}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 disabled:opacity-40 transition-all">
                Mark as Delivered
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — Info */}
        <div className="space-y-4">

          {/* User Info */}
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

          {/* Kitchen Info */}
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

          {/* Payment Info */}
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
    </div>
  );
};

export default AdminOrderDetailPage;