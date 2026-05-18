// import React, { useEffect, useState } from 'react';
// import { ShoppingBag, ChefHat, Users, Clock, TrendingUp, ArrowRight } from 'lucide-react';
// import { Link } from 'react-router-dom';
// import { adminApi } from '../../api/services';
// import { Order, Kitchen, User } from '../../types';
// import StatCard from '../../components/common/StatCard';
// import StatusBadge from '../../components/common/StatusBadge';
// import { CardSkeleton } from '../../components/common/Skeleton';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// const chartData = [
//   { day: 'Mon', orders: 24 }, { day: 'Tue', orders: 38 }, { day: 'Wed', orders: 29 },
//   { day: 'Thu', orders: 45 }, { day: 'Fri', orders: 52 }, { day: 'Sat', orders: 61 }, { day: 'Sun', orders: 33 },
// ];

// const AdminDashboard: React.FC = () => {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [kitchens, setKitchens] = useState<Kitchen[]>([]);
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     Promise.all([
//       adminApi.getAllOrders().catch(() => ({ data: [] as any })),
//       adminApi.getAllKitchens().catch(() => ({ data: [] as any })),
//       adminApi.getAllUsers().catch(() => ({ data: [] as any })),
//     ]).then(([o, k, u]) => {
//       setOrders(Array.isArray(o.data) ? o.data : o.data?.orders ?? o.data?.data ?? []);
//       setKitchens(Array.isArray(k.data) ? k.data : k.data?.kitchens ?? k.data?.data ?? []);
//       setUsers(Array.isArray(u.data) ? u.data : u.data?.users ?? u.data?.data ?? []);
//     }).finally(() => setLoading(false));
//   }, []);
//   // const pending = orders.filter(o => o.status === 'PENDING').length;
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
//             {/* <StatCard title="Total Orders" value={orders.length} icon={ShoppingBag} color="sky" trend={{ value: 8, label: 'this week' }} />
//           <StatCard title="Pending Orders" value={pending} icon={Clock} color="amber" />
//           <StatCard title="Active Kitchens" value={activeKitchens} icon={ChefHat} color="emerald" />
//           <StatCard title="Total Users" value={users.length} icon={Users} color="purple" /> */}
        
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
//                     {/* <p className="text-xs font-mono text-sky-400">#{order.id.slice(-6).toUpperCase()}</p> */}
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
import React, { useEffect, useState } from 'react';
import { ShoppingBag, ChefHat, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi, dashboardApi } from '../../api/services';
import { Order, Kitchen, User } from '../../types';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { CardSkeleton } from '../../components/common/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { day: 'Mon', orders: 24 }, { day: 'Tue', orders: 38 }, { day: 'Wed', orders: 29 },
  { day: 'Thu', orders: 45 }, { day: 'Fri', orders: 52 }, { day: 'Sat', orders: 61 }, { day: 'Sun', orders: 33 },
];

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dashStats, setDashStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getAllOrders().catch(() => ({ data: { data: [] } })),
      adminApi.getAllKitchens().catch(() => ({ data: { data: [] } })),
      adminApi.getAllUsers().catch(() => ({ data: { data: [] } })),
    ]).then(([o, k, u]) => {
      setOrders(o.data?.data ?? []);
      setKitchens(k.data?.data ?? []);
      setUsers(u.data?.data ?? []);
    }).finally(() => setLoading(false));

    dashboardApi.getAdminDashboard()
      .then(r => setDashStats(r.data?.data))
      .catch(() => {});
  }, []);

  const pending = orders.filter(o => o.status === 'REQUESTED').length;
  const activeKitchens = kitchens.filter(k => k.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Franchise operations overview</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />) : (
          <>
            <StatCard title="Total Orders" value={dashStats?.totalOrders ?? orders.length} icon={ShoppingBag} color="sky" />
            <StatCard title="Pending Orders" value={dashStats?.pendingOrders ?? pending} icon={Clock} color="amber" />
            <StatCard title="Active Kitchens" value={activeKitchens} icon={ChefHat} color="emerald" />
            <StatCard title="Total Revenue" value={`₹${(dashStats?.totalRevenue ?? 0).toLocaleString('en-IN')}`} icon={TrendingUp} color="purple" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Weekly Order Volume</h2>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }} />
              <Bar dataKey="orders" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-sky-400 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {loading ? <div className="p-4 space-y-2">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}</div> : (
            <div className="divide-y divide-slate-800/60">
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/2 transition-colors">
                  <div>
                    <p className="text-xs font-mono text-sky-400">#{String(order.id).slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-slate-500">{order.userName || 'Unknown'}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
              {orders.length === 0 && <p className="text-center text-slate-500 text-sm py-8">No orders yet</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;