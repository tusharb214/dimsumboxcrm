 import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Download, TrendingUp, ShoppingBag, Users, ChefHat } from 'lucide-react';
import { adminApi, dashboardApi } from '../../api/services';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const tt = {
  backgroundColor: '#1e293b', border: '1px solid #334155',
  borderRadius: '12px', color: '#f1f5f9', fontSize: '12px',
};

const AdminReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<6 | 12>(6);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ordRes, kitRes, dashRes] = await Promise.all([
          adminApi.getAllOrders(),
          adminApi.getAllKitchens(),
          dashboardApi.getAdminDashboard(),
        ]);
        const rawOrders = ordRes.data as any;
        setOrders(Array.isArray(rawOrders) ? rawOrders : rawOrders?.data ?? []);
        const rawKit = kitRes.data as any;
        setKitchens(Array.isArray(rawKit) ? rawKit : rawKit?.data ?? []);
        const rawDash = dashRes.data as any;
        setDashboard(rawDash?.data ?? rawDash);
      } catch { toast.error('Failed to load reports'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const delivered = useMemo(
    () => orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)),
    [orders]
  );

  const now = new Date();

  // monthly data for charts
  const monthlyData = useMemo(() => {
    const result = [];
    for (let i = chartRange - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const mo = d.getMonth(); const yr = d.getFullYear();
      const filtered = delivered.filter(o => {
        const od = new Date(o.createdAt);
        return od.getMonth() === mo && od.getFullYear() === yr;
      });
      const revenue = filtered.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
      result.push({ month: label, revenue, orders: filtered.length, avg: filtered.length ? Math.round(revenue / filtered.length) : 0 });
    }
    return result;
  }, [delivered, chartRange]);

  // kitchen performance
  const kitchenData = useMemo(() => {
    return kitchens.map((k: any) => ({
      kitchen: k.name || k.kitchenName || `Kitchen ${k.id}`,
      orders: orders.filter(o => String(o.kitchenId) === String(k.id)).length,
    })).sort((a, b) => b.orders - a.orders);
  }, [kitchens, orders]);

  const totalRevenue = delivered.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const downloadExcel = () => {
    if (monthlyData.length === 0) return toast.error('No data to export');
    const ws = XLSX.utils.json_to_sheet(monthlyData.map(r => ({
      'Month': r.month, 'Orders': r.orders,
      'Revenue (₹)': r.revenue, 'Avg/Order (₹)': r.avg,
    })));
    ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
    XLSX.writeFile(wb, `reports-${now.toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel downloaded!');
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Franchise performance insights</p>
        </div>
        <button onClick={downloadExcel} className="btn-secondary">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* ── KPI Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <p className="text-xs text-slate-500">Total Revenue</p>
            </div>
            <p className="text-lg font-bold text-emerald-400">{fmt(totalRevenue)}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-4 h-4 text-sky-400" />
              <p className="text-xs text-slate-500">Total Orders</p>
            </div>
            <p className="text-lg font-bold text-white">{dashboard?.totalOrders ?? orders.length}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-violet-400" />
              <p className="text-xs text-slate-500">Total Users</p>
            </div>
            <p className="text-lg font-bold text-white">{dashboard?.totalUsers ?? '—'}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <ChefHat className="w-4 h-4 text-amber-400" />
              <p className="text-xs text-slate-500">Total Kitchens</p>
            </div>
            <p className="text-lg font-bold text-white">{dashboard?.totalKitchens ?? kitchens.length}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-72 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Revenue Trend */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Revenue Trend</h2>
              <div className="flex gap-1">
                {([6, 12] as const).map(r => (
                  <button key={r} onClick={() => setChartRange(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${chartRange === r ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                    {r}M
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
                <Tooltip contentStyle={tt} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Orders */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Monthly Orders</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tt} />
                <Bar dataKey="orders" fill="#a855f7" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Kitchen Performance */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Kitchen Performance</h2>
            {kitchenData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">No kitchen data</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, kitchenData.length * 52)}>
                <BarChart data={kitchenData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="kitchen" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={tt} />
                  <Bar dataKey="orders" fill="#10b981" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Summary Table */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Summary Table</h2>
            <div className="overflow-auto max-h-[280px]">
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
                  {monthlyData.map(row => (
                    <tr key={row.month}>
                      <td className="table-td pl-0 font-medium text-white">{row.month}</td>
                      <td className="table-td">{row.orders}</td>
                      <td className="table-td text-sky-400 font-semibold">{fmt(row.revenue)}</td>
                      <td className="table-td text-emerald-400">{row.avg ? fmt(row.avg) : '—'}</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="border-t-2 border-slate-700">
                    <td className="table-td pl-0 font-bold text-white">Total</td>
                    <td className="table-td font-bold text-white">{monthlyData.reduce((s, r) => s + r.orders, 0)}</td>
                    <td className="table-td text-sky-400 font-bold">{fmt(monthlyData.reduce((s, r) => s + r.revenue, 0))}</td>
                    <td className="table-td text-slate-500">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;