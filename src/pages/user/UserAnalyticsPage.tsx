 import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { userApi, salesApi } from '../../api/services';
import { Order } from '../../types';

const chartTooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  color: '#f1f5f9',
  fontSize: '12px',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED:  '#10b981',
  REQUESTED:  '#f59e0b',
  ACCEPTED:   '#3b82f6',
  ASSIGNED:   '#8b5cf6',
  PREPARING:  '#a855f7',
  READY:      '#06b6d4',
  DELIVERED:  '#0ea5e9',
  REJECTED:   '#ef4444',
};

const UserAnalyticsPage: React.FC = () => {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [todaySales, setToday]    = useState<number>(0);
  const [weeklySales, setWeekly]  = useState<number>(0);
  const [monthlySales, setMonthly]= useState<number>(0);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      userApi.getMyOrders().catch(() => ({ data: { data: [] } })),
      salesApi.getToday().catch(() => ({ data: 0 })),
      salesApi.getWeekly().catch(() => ({ data: 0 })),
      salesApi.getMonthly().catch(() => ({ data: 0 })),
    ]).then(([ordersRes, todayRes, weeklyRes, monthlyRes]) => {
      const raw = ordersRes.data;
      setOrders(Array.isArray(raw) ? raw : raw?.data ?? raw?.orders ?? []);

      const parse = (v: any) => typeof v === 'number' ? v : v?.data ?? 0;
      setToday(parse(todayRes.data));
      setWeekly(parse(weeklyRes.data));
      setMonthly(parse(monthlyRes.data));
    }).finally(() => setLoading(false));
  }, []);

  // ── Status breakdown for pie chart ──────────────────────────
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name, value, color: STATUS_COLORS[name] ?? '#64748b',
  }));

  // ── Monthly revenue from completed orders ────────────────────
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyMap = orders.reduce<Record<string, { revenue: number; orders: number }>>((acc, o) => {
    const d = new Date(o.createdAt);
    const key = monthNames[d.getMonth()];
    if (!acc[key]) acc[key] = { revenue: 0, orders: 0 };
    acc[key].orders += 1;
    if (o.status === 'COMPLETED') acc[key].revenue += o.totalAmount;
    return acc;
  }, {});
  const revenueData = monthNames
    .filter(m => monthlyMap[m])
    .map(m => ({ month: m, ...monthlyMap[m] }));

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
        <div className="grid lg:grid-cols-2 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Revenue Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Your franchise performance overview</p>
        </div>
      </div>

      {/* ── Sales summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Today's Sales",   value: fmt(todaySales)   },
          { label: 'Weekly Sales',    value: fmt(weeklySales)  },
          { label: 'Monthly Sales',   value: fmt(monthlySales) },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className="text-xl font-bold text-white mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Revenue chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Monthly Revenue</h2>
          {revenueData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-16">No completed orders yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order volume chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Order Volume</h2>
          {revenueData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-16">No orders yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="orders" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status breakdown */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Order Status Breakdown</h2>
          {statusData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-12">No orders yet</p>
          ) : (
             <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={180} className="sm:!w-1/2">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1 w-full">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-sm text-slate-400">{s.name}</span>
                    <span className="text-sm font-semibold text-white ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly summary table */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Monthly Summary</h2>
          {revenueData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-12">No data yet</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="table-th pl-0">Month</th>
                  <th className="table-th">Orders</th>
                  <th className="table-th">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {revenueData.map(row => (
                  <tr key={row.month}>
                    <td className="table-td pl-0 font-medium text-white">{row.month}</td>
                    <td className="table-td">{row.orders}</td>
                    <td className="table-td font-semibold text-sky-400">
                      ₹{row.revenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAnalyticsPage;