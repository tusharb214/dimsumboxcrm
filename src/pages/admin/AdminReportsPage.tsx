import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Clock, Download } from 'lucide-react';

const monthly = [
  { month: 'Jan', revenue: 45000, orders: 120 },
  { month: 'Feb', revenue: 62000, orders: 158 },
  { month: 'Mar', revenue: 51000, orders: 134 },
  { month: 'Apr', revenue: 78000, orders: 201 },
  { month: 'May', revenue: 69000, orders: 176 },
  { month: 'Jun', revenue: 94000, orders: 240 },
];

const kitchenPerf = [
  { kitchen: 'Central', orders: 98 },
  { kitchen: 'North Hub', orders: 74 },
  { kitchen: 'South Hub', orders: 63 },
  { kitchen: 'West Hub', orders: 45 },
];

const tt = { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' };

const AdminReportsPage: React.FC = () => (
  <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-white">Reports & Analytics</h1>
        <p className="text-slate-400 text-sm mt-0.5">Franchise performance insights</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-400">Backend Integration Pending</span>
        </div>
        <button className="btn-secondary"><Download className="w-4 h-4" />Export</button>
      </div>
    </div>

    <div className="grid lg:grid-cols-2 gap-5">
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthly}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt} />
            <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="url(#rev)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Monthly Orders</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt} />
            <Bar dataKey="orders" fill="#a855f7" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Kitchen Performance</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={kitchenPerf} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="kitchen" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
            <Tooltip contentStyle={tt} />
            <Bar dataKey="orders" fill="#10b981" radius={[0,6,6,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Summary Table</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="table-th pl-0">Month</th>
              <th className="table-th">Orders</th>
              <th className="table-th">Revenue</th>
              <th className="table-th">Avg/Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {monthly.map(row => (
              <tr key={row.month}>
                <td className="table-td pl-0 font-medium text-white">{row.month}</td>
                <td className="table-td">{row.orders}</td>
                <td className="table-td text-sky-400 font-semibold">₹{row.revenue.toLocaleString()}</td>
                <td className="table-td text-emerald-400">₹{Math.round(row.revenue / row.orders)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default AdminReportsPage;
