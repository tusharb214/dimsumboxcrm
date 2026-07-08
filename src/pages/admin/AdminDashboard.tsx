//  import React, { useEffect, useState } from 'react';
// import { ShoppingBag, ChefHat, Clock, TrendingUp, ArrowRight } from 'lucide-react';
// import { Link } from 'react-router-dom';
// import { adminApi, dashboardApi } from '../../api/services';
// import { Order, Kitchen, User } from '../../types';
// import StatCard from '../../components/common/StatCard';
// import StatusBadge from '../../components/common/StatusBadge';
// import { CardSkeleton } from '../../components/common/Skeleton';
// // import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// const chartData = [
//   { day: 'Mon', orders: 24 }, { day: 'Tue', orders: 38 }, { day: 'Wed', orders: 29 },
//   { day: 'Thu', orders: 45 }, { day: 'Fri', orders: 52 }, { day: 'Sat', orders: 61 }, { day: 'Sun', orders: 33 },
// ];

// const AdminDashboard: React.FC = () => {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [kitchens, setKitchens] = useState<Kitchen[]>([]);
//   // const [users, setUsers] = useState<User[]>([]);
//   const [, setUsers] = useState<User[]>([]);
//   const [dashStats, setDashStats] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     Promise.all([
//       adminApi.getAllOrders().catch(() => ({ data: { data: [] } })),
//       adminApi.getAllKitchens().catch(() => ({ data: { data: [] } })),
//       adminApi.getAllUsers().catch(() => ({ data: { data: [] } })),
//     ]).then(([o, k, u]) => {
//       setOrders(o.data?.data ?? []);
//       setKitchens(k.data?.data ?? []);
//       setUsers(u.data?.data ?? []);
//     }).finally(() => setLoading(false));

//     dashboardApi.getAdminDashboard()
//       .then(r => setDashStats(r.data?.data))
//       .catch(() => {});
//   }, []);

//   const pending = orders.filter(o => o.status === 'REQUESTED').length;
//   const activeKitchens = kitchens.filter(k => k.status === 'ACTIVE').length;

//   return (
//     <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
//           <p className="text-slate-400 text-sm mt-0.5">Franchise operations overview</p>
//         </div>
//       </div>

//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         {loading ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />) : (
//           <>
//             <StatCard title="Total Orders" value={dashStats?.totalOrders ?? orders.length} icon={ShoppingBag} color="sky" />
//             <StatCard title="Pending Orders" value={dashStats?.pendingOrders ?? pending} icon={Clock} color="amber" />
//             <StatCard title="Active Kitchens" value={activeKitchens} icon={ChefHat} color="emerald" />
//             <StatCard title="Total Revenue" value={`₹${(dashStats?.totalRevenue ?? 0).toLocaleString('en-IN')}`} icon={TrendingUp} color="purple" />
//           </>
//         )}
//       </div>

//       <div className="grid lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2 card p-5">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-sm font-semibold text-white">Weekly Order Volume</h2>
//             <TrendingUp className="w-4 h-4 text-sky-400" />
//           </div>
//           <ResponsiveContainer width="100%" height={220}>
//             <BarChart data={chartData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
//               <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//               <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//               <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }} />
//               <Bar dataKey="orders" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>

//         <div className="card overflow-hidden">
//           <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
//             <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
//             <Link to="/admin/orders" className="text-xs text-sky-400 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
//           </div>
//           {loading ? <div className="p-4 space-y-2">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}</div> : (
//             <div className="divide-y divide-slate-800/60">
//               {orders.slice(0, 5).map(order => (
//                 <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/2 transition-colors">
//                   <div>
//                     <p className="text-xs font-mono text-sky-400">#{String(order.id).slice(-6).toUpperCase()}</p>
//                     <p className="text-xs text-slate-500">{order.userName || 'Unknown'}</p>
//                   </div>
//                   <StatusBadge status={order.status} />
//                 </div>
//               ))}
//               {orders.length === 0 && <p className="text-center text-slate-500 text-sm py-8">No orders yet</p>}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
 import {
  ShoppingBag,
  IndianRupee,
  Clock,
  Truck,
  Eye,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminApi, dashboardApi } from '../../api/services';
import { Order, Kitchen, User } from '../../types';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { CardSkeleton, TableSkeleton, Skeleton } from '../../components/common/Skeleton';


const isToday = (isoDate?: string) => {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  );
};

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [, setUsers] = useState<User[]>([]);
  const [dashStats, setDashStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getAllOrders().catch(() => ({ data: { data: [] } })),
      adminApi.getAllKitchens().catch(() => ({ data: { data: [] } })),
      adminApi.getAllUsers().catch(() => ({ data: { data: [] } })),
    ])
      .then(([o, k, u]) => {
        setOrders(o.data?.data ?? []);
        setKitchens(k.data?.data ?? []);
        setUsers(u.data?.data ?? []);
      })
      .finally(() => setLoading(false));

    dashboardApi
      .getAdminDashboard()
      .then((r) => setDashStats(r.data?.data))
      .catch(() => { });
  }, []);

  // ---- Stats (real orders, with dashStats override when API provides it) ----
  const todaysOrders = orders.filter((o) => isToday(o.createdAt));
  const todaysOrdersCount = dashStats?.todaysOrders ?? todaysOrders.length;
  const todaysSales = dashStats?.todaysSales ?? todaysOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingCount = dashStats?.pendingOrders ?? orders.filter((o) => o.status === 'REQUESTED').length;
  const dispatchedToday =
    dashStats?.dispatchedToday ??
    orders.filter((o) => o.status === 'DISPATCHED' && isToday(o.updatedAt || o.createdAt)).length;

  // ---- Top outlets by sales, derived from real orders + kitchens ----
  const topOutlets = useMemo(() => {
    const salesByKitchen: Record<string, number> = {};
    orders.forEach((o) => {
      const name = o.kitchenName || kitchens.find((k) => k.id === o.kitchenId)?.name;
      if (!name) return;
      salesByKitchen[name] = (salesByKitchen[name] || 0) + (o.totalAmount || 0);
    });
    return Object.entries(salesByKitchen)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [orders, kitchens]);

  const recentOrders = orders.slice(0, 5);

  return (
    // <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
    <div className="max-w-[1600px] mx-auto px-6 pt-2 pb-6 space-y-4  animate-[fadeIn_0.3s_ease-out]">
    

      {/* Stat cards */}
      {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"> */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl">
      {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"> */}
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Today's Orders" value={todaysOrdersCount} icon={ShoppingBag} color="sky" />
            <StatCard
              title="Today's Sales"
              value={`₹${todaysSales.toLocaleString('en-IN')}`}
              icon={IndianRupee}
              color="emerald"
            />
            <StatCard title="Pending Orders" value={pendingCount} icon={Clock} color="amber" />
            <StatCard title="Dispatched Today" value={dispatchedToday} icon={Truck} color="purple" />
          </>
        )}
      </div>

      {/* <div className="grid lg:grid-cols-3 gap-6"> */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Recent orders table */}
        {/* <div className="lg:col-span-2 card overflow-hidden"> */}
        <div className="lg:col-span-2 card overflow-hidden min-w-0">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
          </div>

          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                    {/* <th className="px-5 py-3 font-medium">Order ID</th> */}
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">order ID</th>
                    <th className="px-4 py-2.5 font-medium">Outlet</th>
                    <th className="px-4 py-2.5 font-medium">Order Date</th>
                    <th className="px-4 py-2.5 font-medium">Amount</th>
                    <th className="px-4 py-2.5 font-medium">Payment</th>
                    <th className="px-4 py-2.5 font-medium">Order Status</th>
                    <th className="px-4 py-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentOrders.map((order) => {
                    // Payment status isn't part of the Order model yet - shown
                    // as a simple derived badge until a real field exists.
                    const isPaid = ['DELIVERED', 'COMPLETED', 'DISPATCHED'].includes(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-sky-400 whitespace-nowrap">
                          #{String(order.id).slice(-6).toUpperCase()}
                        </td>
                        <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap">
                          {order.kitchenName || 'Unassigned'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-2.5 text-slate-200 whitespace-nowrap">
                          ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={isPaid ? 'badge-success' : 'badge-warning'}>
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-sky-400 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-slate-500 text-sm py-8">
                        No orders yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-5 py-4 border-t border-slate-800">
            <Link
              to="/admin/orders"
              className="w-full inline-flex items-center justify-center py-2 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              View All Orders
            </Link>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4 w-[300px]">
        
          {/* Payment overview */}
          <div className="card p-3">
            <h2 className="text-sm font-semibold text-white mb-3">Payment Overview</h2>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-32" />
              </div>
            ) : (
              <>
                 <div>
                  <p className="text-xs text-slate-400">Total Outstanding</p>
                  <p className="text-xl font-bold text-white mt-1">
                    ₹{(dashStats?.paymentOverview?.totalOutstanding ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-red-400 font-medium">Overdue Outlets</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {dashStats?.paymentOverview?.overdueOutlets ?? 0}
                  </p>
                </div>
                <button className="mt-4 w-full py-2 rounded-xl border border-sky-500/30 text-sky-400 text-sm font-medium hover:bg-sky-500/10 transition-colors">
                  View Outstanding Report
                </button>
              </>
            )}
          </div>

          {/* Top outlets by sales - real, derived from orders + kitchens */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Top Outlets by Sales</h2>
            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : (
              <ol className="space-y-2.5">
                {topOutlets.map((outlet, idx) => (
                  <li key={outlet.name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 truncate pr-2">
                      <span className="text-slate-500 mr-1.5">{idx + 1}.</span>
                      {outlet.name}
                    </span>
                    <span className="text-slate-200 font-medium whitespace-nowrap">
                      ₹{outlet.sales.toLocaleString('en-IN')}
                    </span>
                  </li>
                ))}
                {topOutlets.length === 0 && <p className="text-center text-slate-500 text-sm py-2">No data yet</p>}
              </ol>
            )}
          </div>           
        </div>
      </div>

      {/* Sales overview chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Sales Overview</h2>
        </div>
        {loading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              // data={dashStats?.salesOverview ?? dummySalesOverview}
              data={dashStats?.salesOverview ?? []}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`₹${Number(value ?? 0).toLocaleString('en-IN')}`, 'Sales']}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                fill="url(#salesGradient)"
                dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;