//  import React, { useEffect, useState } from 'react';
// import { ClipboardList, Clock, CheckCircle, Truck, RefreshCw } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { kitchenApi, dashboardApi } from '../../api/services';
// import { Order } from '../../types';
// import StatusBadge from '../../components/common/StatusBadge';
// import StatCard from '../../components/common/StatCard';
// import EmptyState from '../../components/common/EmptyState';
// import { CardSkeleton, TableSkeleton } from '../../components/common/Skeleton';
// import toast from 'react-hot-toast';

// const KitchenDashboard: React.FC = () => {
//   const navigate = useNavigate();
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [dashStats, setDashStats] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [updating, setUpdating] = useState<string | null>(null);

//   const fetchOrders = async () => {
//     setLoading(true);
//     try {
//       const r = await kitchenApi.getAssignedOrders();
//       setOrders(r.data.data ?? []);
//       dashboardApi.getKitchenDashboard()
//         .then(res => setDashStats(res.data?.data))
//         .catch(() => {});
//     }
//     catch { toast.error('Failed to load orders'); }
//     finally { setLoading(false); }
//   };

//   useEffect(() => { fetchOrders(); }, []);

//   const acceptOrder = async (orderId: string) => {
//     setUpdating(orderId);
//     try {
//       await kitchenApi.acceptOrder(orderId);
//       toast.success('Order accepted — now Preparing!');
//       fetchOrders();
//     } catch { toast.error('Failed to accept order'); }
//     finally { setUpdating(null); }
//   };

//   const markReady = async (orderId: string) => {
//     setUpdating(orderId);
//     try {
//       await kitchenApi.markReady(orderId);
//       toast.success('Order marked as Ready!');
//       fetchOrders();
//     } catch { toast.error('Failed to mark ready'); }
//     finally { setUpdating(null); }
//   };

//   const markDelivered = async (orderId: string) => {
//     setUpdating(orderId);
//     try {
//       await kitchenApi.markDelivered(orderId);
//       toast.success('Order marked as Delivered!');
//       fetchOrders();
//     } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to mark delivered'); }
//     finally { setUpdating(null); }
//   };

//   const byStatus = (s: string) => orders.filter(o => o.status === s).length;

//   return (
//     <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-xl font-bold text-white">Kitchen Dashboard</h1>
//           <p className="text-slate-400 text-sm mt-0.5">Manage your assigned orders</p>
//         </div>
//         <button onClick={fetchOrders} className="btn-secondary"><RefreshCw className="w-4 h-4" />Refresh</button>
//       </div>

//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         {loading ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />) : (
//           <>
//             <StatCard title="Total Assigned" value={dashStats?.totalOrders ?? orders.length} icon={ClipboardList} color="sky" />
//             <StatCard title="Preparing" value={dashStats?.preparingNow ?? byStatus('PREPARING')} icon={Clock} color="amber" />
//             <StatCard title="Ready / Approved" value={dashStats?.readyNow ?? (byStatus('READY') + byStatus('APPROVAL_PENDING'))} icon={CheckCircle} color="emerald" />
//             <StatCard title="Completed" value={dashStats?.completedByMe ?? byStatus('DELIVERED')} icon={Truck} color="purple" />
//           </>
//         )}
//       </div>

//       <div className="card overflow-hidden">
//         <div className="px-5 py-4 border-b border-slate-800">
//           <h2 className="text-sm font-semibold text-white">Assigned Orders</h2>
//         </div>
//         <div className="overflow-x-auto">
//           {loading ? <TableSkeleton rows={5} cols={5} /> : orders.length === 0 ? (
//             <EmptyState icon={ClipboardList} title="No orders assigned" description="Orders assigned to this kitchen will appear here" />
//           ) : (
//             <table className="w-full">
//               <thead className="border-b border-slate-800 bg-slate-900/50">
//                 <tr>
//                   <th className="table-th">Order ID</th>
//                   <th className="table-th">Customer</th>
//                   <th className="table-th">Items</th>
//                   <th className="table-th">Current Status</th>
//                   <th className="table-th">Action</th>
//                   <th className="table-th">Date</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-800/60">
//                 {orders.map(order => (
//                   <tr key={order.id} className={`hover:bg-white/2 transition-colors ${updating === order.id ? 'opacity-60' : ''}`}>
//                     <td className="table-td font-mono text-sky-400 text-xs">#{String(order.id).slice(-8).toUpperCase()}</td>
//                     <td className="table-td">{order.userName || '—'}</td>
//                     <td className="table-td text-slate-400">{order.items?.length || 0} items</td>
//                     <td className="table-td"><StatusBadge status={order.status} /></td>
//                     <td className="table-td">
//                       <div className="flex items-center gap-2">
//                         {order.status === 'ASSIGNED' && (
//                           <button
//                             onClick={() => acceptOrder(String(order.id))}
//                             disabled={updating === order.id}
//                             className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
//                           >
//                             Start Preparing
//                           </button>
//                         )}
//                         {order.status === 'PREPARING' && (
//                           <button
//                             onClick={() => markReady(String(order.id))}
//                             disabled={updating === order.id}
//                             className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
//                           >
//                             Mark Ready
//                           </button>
//                         )}
//                         {order.status === 'APPROVAL_PENDING' && (
//                           <button
//                             onClick={() => navigate('/kitchen/dispatch')}
//                             className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
//                           >
//                             Go to Dispatch →
//                           </button>
//                         )}
//                         {order.status === 'DISPATCHED' && (
//                           <button
//                             onClick={() => markDelivered(String(order.id))}
//                             disabled={updating === order.id}
//                             className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
//                           >
//                             Mark Delivered
//                           </button>
//                         )}
//                         {(order.status === 'READY' || order.status === 'DELIVERED') && (
//                           <span className="text-xs text-slate-500">—</span>
//                         )}
//                         {(order.status === 'READY' || order.status === 'DELIVERED') && (
//                           <span className="text-xs text-slate-500">—</span>
//                         )}
//                       </div>
//                     </td>
//                     <td className="table-td text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default KitchenDashboard;

import React, { useEffect, useState } from 'react';
import { ClipboardList, Clock, CheckCircle, Truck, RefreshCw, Eye, X, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // npm install xlsx
import { kitchenApi, dashboardApi } from '../../api/services';
import { Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton, TableSkeleton } from '../../components/common/Skeleton';
import toast from 'react-hot-toast';

// Pulls a readable item name out of the OrderItem -> Material relation.
// Backend shape: OrderItem { material: { name, ... }, quantity, priceAtOrder }
const getItemName = (item: any, idx: number): string =>
  item?.material?.name ??
  item?.materialName ??
  item?.name ??
  item?.itemName ??
  `Item ${idx + 1}`;

const getItemQty = (item: any): number => item?.quantity ?? 1;

// priceAtOrder is the snapshot price captured when the order was placed
const getItemPrice = (item: any): number | undefined =>
  item?.priceAtOrder ?? item?.material?.price ?? item?.price;

const KitchenDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dashStats, setDashStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  // NEW: which order's details modal is open
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);

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

  const markDelivered = async (orderId: string) => {
    setUpdating(orderId);
    try {
      await kitchenApi.markDelivered(orderId);
      toast.success('Order marked as Delivered!');
      fetchOrders();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to mark delivered'); }
    finally { setUpdating(null); }
  };

  const byStatus = (s: string) => orders.filter(o => o.status === s).length;

  // NEW: export the currently open order's items to a .xlsx file
  const exportOrderItemsToExcel = (order: Order) => {
    const items = (order as any).items ?? [];
    if (items.length === 0) {
      toast.error('No items to export');
      return;
    }
    const rows = items.map((item: any, idx: number) => {
      const qty = getItemQty(item);
      const price = getItemPrice(item);
      return {
        '#': idx + 1,
        'Item Name': getItemName(item, idx),
        Quantity: qty,
        ...(price !== undefined ? { 'Unit Price (₹)': price, 'Total (₹)': +(price * qty).toFixed(2) } : {}),
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 12 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');
    const orderCode = String(order.id).slice(-8).toUpperCase();
    XLSX.writeFile(workbook, `Order-${orderCode}-Items.xlsx`);
  };

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
            <StatCard title="Ready / Approved" value={dashStats?.readyNow ?? (byStatus('READY') + byStatus('APPROVAL_PENDING'))} icon={CheckCircle} color="emerald" />
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
                        {/* NEW: See Details button — always visible for every order */}
                        <button
                          onClick={() => setDetailsOrder(order)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 transition-all flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </button>

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
                        {order.status === 'APPROVAL_PENDING' && (
                          <button
                            onClick={() => navigate('/kitchen/dispatch')}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                          >
                            Go to Dispatch →
                          </button>
                        )}
                        {order.status === 'DISPATCHED' && (
                          <button
                            onClick={() => markDelivered(String(order.id))}
                            disabled={updating === order.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            Mark Delivered
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

      {/* NEW: Order Details Modal — full-screen on mobile, centered card on desktop */}
      {detailsOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
          onClick={() => setDetailsOrder(null)}
        >
          <div
            className="card w-full sm:max-w-md h-[92vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-800 shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  Order #{String(detailsOrder.id).slice(-8).toUpperCase()}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{detailsOrder.userName || '—'}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => exportOrderItemsToExcel(detailsOrder)}
                  title="Download items as Excel"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Excel</span>
                </button>
                <button
                  onClick={() => setDetailsOrder(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Meta row */}
            <div className="px-4 sm:px-5 py-2.5 border-b border-slate-800/60 shrink-0 flex items-center justify-between text-xs bg-slate-900/40">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Status</span>
                <StatusBadge status={detailsOrder.status} />
              </div>
              <span className="text-slate-400">{new Date(detailsOrder.createdAt).toLocaleString('en-IN')}</span>
            </div>

            {/* Items list — scrolls independently so 50+ items stay usable on mobile */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 sm:px-5 py-2.5 sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800/60 z-10">
                <p className="text-xs font-semibold text-slate-300">
                  Items ({detailsOrder.items?.length || 0})
                </p>
              </div>
              {detailsOrder.items && detailsOrder.items.length > 0 ? (
                <div className="divide-y divide-slate-800/60">
                  {detailsOrder.items.map((item: any, idx: number) => {
                    const qty = getItemQty(item);
                    const price = getItemPrice(item);
                    return (
                      <div key={item.id ?? idx} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="text-[11px] text-slate-500 mt-0.5 shrink-0 w-4 text-right">{idx + 1}.</span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm text-white truncate">{getItemName(item, idx)}</span>
                            {item.notes && <span className="text-[11px] text-slate-500 truncate">{item.notes}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-slate-400 whitespace-nowrap">x{qty}</span>
                          {price !== undefined && (
                            <span className="text-xs font-medium text-emerald-400 whitespace-nowrap">₹{price}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 px-4 sm:px-5 py-4">No item details available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;