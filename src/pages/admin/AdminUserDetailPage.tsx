import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShoppingBag, TrendingUp, BarChart3, Calendar, Download,
  ChevronDown, ChevronUp, LayoutDashboard, Package
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { adminApi } from '../../api/services';
import { User, Order } from '../../types';
import { PosOrderResponse } from '../../types/pos';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const ORDER_LIMIT = 8;
const DAILY_LIMIT = 8;

interface DailyRevenue {
  date: string;
  revenue: number;
  orderCount: number;
  orders: PosOrderResponse[];
}

// ─── Compact Date Filter ──────────────────────────────────────────────────────
const DateFilter: React.FC<{
  from: string; to: string;
  onFrom: (v: string) => void; onTo: (v: string) => void;
  onClear: () => void;
}> = ({ from, to, onFrom, onTo, onClear }) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    <input type="date" value={from} onChange={e => onFrom(e.target.value)}
      className="input-field py-1 px-2 text-xs min-w-0 w-[130px]" />
    <span className="text-xs text-slate-600">–</span>
    <input type="date" value={to} onChange={e => onTo(e.target.value)}
      className="input-field py-1 px-2 text-xs min-w-0 w-[130px]" />
    {(from || to) && (
      <button onClick={onClear} className="text-xs text-slate-500 hover:text-white underline leading-none">Clear</button>
    )}
  </div>
);

// ─── Custom Pie Tooltip ───────────────────────────────────────────────────────
const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs">
        <p className="text-white font-semibold">{payload[0].name}</p>
        <p className="text-emerald-400">₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
        <p className="text-slate-400">{payload[0].payload.qty} units</p>
      </div>
    );
  }
  return null;
};

// ─── Bar Tooltip ─────────────────────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-emerald-400 font-semibold">₹{Number(payload[0]?.value || 0).toLocaleString('en-IN')}</p>
        <p className="text-sky-400">{payload[1]?.value || 0} orders</p>
      </div>
    );
  }
  return null;
};

const PIE_COLORS = ['#38bdf8', '#34d399', '#fb923c', '#a78bfa', '#f472b6', '#facc15', '#4ade80', '#60a5fa'];

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminUserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [posOrders, setPosOrders] = useState<PosOrderResponse[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [detailLoading, setDetailLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'daily' | 'stock'>('dashboard');

  // orders tab
  const [orderPage, setOrderPage] = useState(1);
  const [orderFrom, setOrderFrom] = useState('');
  const [orderTo, setOrderTo] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // daily tab
  const [dailyPage, setDailyPage] = useState(1);
  const [dailyFrom, setDailyFrom] = useState('');
  const [dailyTo, setDailyTo] = useState('');
  // const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [stockProducts, setStockProducts] = useState<any[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockLoaded, setStockLoaded] = useState(false);
  const [expandedStockId, setExpandedStockId] = useState<string | null>(null);

  // dashboard
  const [chartRange, setChartRange] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const load = async () => {
      setDetailLoading(true);
      try {
        const usersRes = await adminApi.getAllUsers();
        const rawUsers = usersRes.data as any;
        const allUsers: User[] = Array.isArray(rawUsers) ? rawUsers : rawUsers?.users ?? rawUsers?.data ?? [];
        const user = allUsers.find(u => String(u.id) === String(userId)) || null;
        setSelectedUser(user);
        if (!user) { toast.error('User not found'); setDetailLoading(false); return; }

        const ordersRes = await adminApi.getAllOrders();
        const raw = ordersRes.data as any;
        const all: Order[] = Array.isArray(raw) ? raw : raw?.orders ?? raw?.data ?? [];
        const orders = all.filter(o => String(o.userId) === String(user.id) || o.userEmail === user.email);
        setUserOrders(orders);

        // Real POS bills for this franchise — powers Daily Sales tab
        const posRes = await adminApi.getUserPosOrders(String(user.id));

        const rawPos = posRes.data as any;
        const posList: PosOrderResponse[] = Array.isArray(rawPos) ? rawPos : rawPos?.data ?? [];
        setPosOrders(posList);

        const map: Record<string, { revenue: number; orderCount: number; orders: PosOrderResponse[] }> = {};
        posList.forEach(o => {
          const date = (o.billDateTime || '').split('T')[0];
          if (!date) return;
          if (!map[date]) map[date] = { revenue: 0, orderCount: 0, orders: [] };
          map[date].revenue += o.totalAmount || 0;
          map[date].orderCount += 1;
          map[date].orders.push(o);
        });
        setDailyRevenue(
          Object.entries(map).map(([date, v]) => ({ date, ...v }))
            .sort((a, b) => b.date.localeCompare(a.date))
        );
      } catch { toast.error('Failed to load user details'); }
      finally { setDetailLoading(false); }
    };
    load();
  }, [userId]);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const deliveredOrders = useMemo(
    () => userOrders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)),
    [userOrders]
  );
  const totalRevenue = useMemo(() => posOrders.reduce((s, o) => s + (o.totalAmount || 0), 0), [posOrders]);

  // ── Dashboard data ──────────────────────────────────────────────────────────
  const now = new Date();

  const lastMonthRevenue = useMemo(() => {
    const m = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return posOrders
      .filter(o => { const d = new Date(o.billDateTime || ''); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); })
      .reduce((s, o) => s + (o.totalAmount || 0), 0);
  }, [posOrders]);

  const thisMonthRevenue = useMemo(() => {
    return posOrders
      .filter(o => { const d = new Date(o.billDateTime || ''); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
      .reduce((s, o) => s + (o.totalAmount || 0), 0);
  }, [posOrders]);

  // bar chart data
  const barData = useMemo(() => {
    if (chartRange === 'monthly') {
      // last 6 months
      const months: { label: string; revenue: number; orders: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        const mo = d.getMonth(); const yr = d.getFullYear();
        const filtered = posOrders.filter(o => {
          const od = new Date(o.billDateTime || '');
          return od.getMonth() === mo && od.getFullYear() === yr;
        });
        months.push({ label, revenue: filtered.reduce((s, o) => s + (o.totalAmount || 0), 0), orders: filtered.length });
      }
      return months;
    } else {
      // last 4 years
      const years: { label: string; revenue: number; orders: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const yr = now.getFullYear() - i;
        const filtered = posOrders.filter(o => new Date(o.billDateTime || '').getFullYear() === yr);
        years.push({ label: String(yr), revenue: filtered.reduce((s, o) => s + (o.totalAmount || 0), 0), orders: filtered.length });
      }
      return years;
    }
  }, [posOrders, chartRange]);

  // pie chart — top products by revenue
  const pieData = useMemo(() => {
    const map: Record<string, { revenue: number; qty: number }> = {};
    posOrders.forEach(o => {
      (o.items || []).forEach((item: any) => {
        const name = item.name || 'Unknown';
        if (!map[name]) map[name] = { revenue: 0, qty: 0 };
        map[name].revenue += item.lineTotal ?? (item.priceAtSale ?? 0) * item.quantity;
        map[name].qty += item.quantity || 0;
      });
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, value: v.revenue, qty: v.qty }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [posOrders]);

  // ── Orders tab ──────────────────────────────────────────────────────────────
  const sortedOrders = useMemo(() =>
    [...userOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [userOrders]
  );
  const filteredOrders = useMemo(() => sortedOrders.filter(o => {
    const d = new Date(o.createdAt).toISOString().split('T')[0];
    if (orderFrom && d < orderFrom) return false;
    if (orderTo && d > orderTo) return false;
    return true;
  }), [sortedOrders, orderFrom, orderTo]);
  const paginatedOrders = filteredOrders.slice((orderPage - 1) * ORDER_LIMIT, orderPage * ORDER_LIMIT);

  // ── Daily tab (real POS bills, grouped by day) ────────────────────────────
  const filteredDaily = useMemo(() => dailyRevenue.filter(row => {
    if (dailyFrom && row.date < dailyFrom) return false;
    if (dailyTo && row.date > dailyTo) return false;
    return true;
  }), [dailyRevenue, dailyFrom, dailyTo]);
  const paginatedDaily = filteredDaily.slice((dailyPage - 1) * DAILY_LIMIT, dailyPage * DAILY_LIMIT);

  const downloadExcel = () => {
    if (filteredDaily.length === 0) return toast.error('No data to download');
    const rows = filteredDaily.map(row => ({
      'Date': new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      'Revenue (₹)': row.revenue,
      'Orders': row.orderCount,
    }));
    rows.push({ 'Date': 'TOTAL', 'Revenue (₹)': filteredDaily.reduce((s, r) => s + r.revenue, 0), 'Orders': filteredDaily.reduce((s, r) => s + r.orderCount, 0) });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Revenue');
    XLSX.writeFile(wb, `${selectedUser?.name}-revenue-log.xlsx`);
    toast.success('Excel downloaded!');
  };

  const getDayMaterialSummary = (row: DailyRevenue) => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    row.orders.forEach(order => {
      (order.items || []).forEach((item: any) => {
        const name = item.name || 'Unknown';
        if (!map[name]) map[name] = { qty: 0, revenue: 0 };
        map[name].qty += item.quantity || 0;
        map[name].revenue += item.lineTotal ?? (item.priceAtSale ?? 0) * item.quantity;
      });
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const downloadDayExcel = (row: DailyRevenue) => {
    const summary = getDayMaterialSummary(row);
    if (summary.length === 0) return toast.error('No data to download');
    const rows = summary.map(item => ({
      'Material': item.name,
      'Qty Sold': item.qty,
      'Revenue (₹)': item.revenue,
    }));
    rows.push({
      'Material': 'TOTAL',
      'Qty Sold': summary.reduce((s, i) => s + i.qty, 0),
      'Revenue (₹)': summary.reduce((s, i) => s + i.revenue, 0),
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, row.date);
    const dateLabel = new Date(row.date)
      .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(/\s/g, '-');
    XLSX.writeFile(wb, `${selectedUser?.name}-${dateLabel}-materials.xlsx`);
    toast.success('Excel downloaded!');
  };

  if (detailLoading) return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <button onClick={() => navigate('/admin/users')} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Back to Users</button>
      <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
    </div>
  );

  if (!selectedUser) return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <button onClick={() => navigate('/admin/users')} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Back to Users</button>
      <div className="text-center py-16 text-slate-500 text-sm">User not found</div>
    </div>
  );

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" />, color: 'violet' },
    { key: 'orders', label: 'Orders', icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'sky' },
    { key: 'daily', label: 'Daily Sales', icon: <BarChart3 className="w-3.5 h-3.5" />, color: 'emerald' },
    { key: 'stock', label: 'Stock', icon: <Package className="w-3.5 h-3.5" />, color: 'amber' },
  ] as const;

  const tabActive: Record<string, string> = {
    dashboard: 'text-violet-400 border-b-2 border-violet-400 bg-violet-500/5',
    orders: 'text-sky-400 border-b-2 border-sky-400 bg-sky-500/5',
    daily: 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5',
    stock: 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5',
  };
  const badgeActive: Record<string, string> = {
    dashboard: 'bg-violet-500/20 text-violet-400',
    orders: 'bg-sky-500/20 text-sky-400',
    daily: 'bg-emerald-500/20 text-emerald-400',
    stock: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <button onClick={() => navigate('/admin/users')} className="btn-secondary">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </button>

      {/* ── User Info Card ── */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {selectedUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white truncate">{selectedUser.name}</h2>
            <p className="text-xs text-slate-400 truncate">{selectedUser.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-700/40">
            <p className="text-xs text-slate-500 mb-1">Role</p>
            <span className="badge-info text-xs">{selectedUser.role}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-700/40">
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <StatusBadge status={selectedUser.status || 'ACTIVE'} />
          </div>
          <div className="bg-gradient-to-br from-sky-500/10 to-sky-500/5 border border-sky-500/20 rounded-xl px-3 py-2 text-center">
            <ShoppingBag className="w-3.5 h-3.5 text-sky-400 mx-auto mb-0.5" />
            <p className="text-lg font-bold text-white">{posOrders.length}</p>
            <p className="text-xs text-slate-500">Total Bills</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2 text-center">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-0.5" />
            <p className="text-lg font-bold text-white truncate">{fmt(totalRevenue)}</p>
            <p className="text-xs text-slate-500">Total Revenue</p>
          </div>
        </div>
      </div>

      {/* ── Tabs Card ── */}
      <div className="card overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-slate-800">
          {tabs.map(tab => (
            <button key={tab.key} onClick={async () => {
              setActiveTab(tab.key);
              if (tab.key === 'stock' && !stockLoaded) {
                setStockLoading(true);
                try {
                  const res = await adminApi.getUserProducts(userId!);
                  const raw = res.data as any;
                  const products: any[] = Array.isArray(raw) ? raw : raw?.data ?? [];
                  setStockProducts(products);
                } catch { toast.error('Failed to load stock data'); }
                finally { setStockLoading(false); setStockLoaded(true); }
              }
            }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${activeTab === tab.key ? tabActive[tab.key] : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.key === 'daily' ? 'Daily' : tab.label}</span>
              {tab.key === 'orders' && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? badgeActive[tab.key] : 'bg-slate-800 text-slate-500'}`}>
                  {userOrders.length}
                </span>
              )}
              {tab.key === 'daily' && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? badgeActive[tab.key] : 'bg-slate-800 text-slate-500'}`}>
                  {dailyRevenue.length}
                </span>
              )}
              {tab.key === 'stock' && stockLoaded && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? badgeActive[tab.key] : 'bg-slate-800 text-slate-500'}`}>
                  {stockProducts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">

          {/* ══════════════════════════════════════
              DASHBOARD TAB
          ══════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">

              {/* Last month vs This month */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
                  <p className="text-xs text-slate-500 mb-1">Last Month</p>
                  <p className="text-xl font-bold text-white">{fmt(lastMonthRevenue)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">This Month</p>
                  <p className="text-xl font-bold text-violet-400">{fmt(thisMonthRevenue)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Bar Chart */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenue Trend</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setChartRange('monthly')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${chartRange === 'monthly' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                    >Monthly</button>
                    <button
                      onClick={() => setChartRange('yearly')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${chartRange === 'yearly' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                    >Yearly</button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="revenue" fill="#34d399" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="orders" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart — top products */}
              {pieData.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Top Products by Revenue</p>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                          paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="w-full sm:w-auto space-y-1.5 shrink-0">
                      {pieData.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-xs text-slate-300 truncate max-w-[120px]">{entry.name}</span>
                          </div>
                          <span className="text-xs text-slate-400 shrink-0">{fmt(entry.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {pieData.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">No sales data available</div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════
              ORDERS TAB
          ══════════════════════════════════════ */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <DateFilter
                  from={orderFrom} to={orderTo}
                  onFrom={v => { setOrderFrom(v); setOrderPage(1); }}
                  onTo={v => { setOrderTo(v); setOrderPage(1); }}
                  onClear={() => { setOrderFrom(''); setOrderTo(''); setOrderPage(1); }}
                />
                <span className="text-xs text-slate-500">{filteredOrders.length} of {userOrders.length}</span>
              </div>

              {userOrders.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No orders placed yet</div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No orders in this date range</div>
              ) : (
                <div className="rounded-xl border border-slate-700/40 overflow-hidden">
                  <div className="divide-y divide-slate-800/60">
                    {paginatedOrders.map(order => {
                      const isOpen = expandedOrderId === String(order.id);
                      return (
                        <div key={order.id}>
                          <button
                            onClick={() => setExpandedOrderId(isOpen ? null : String(order.id))}
                            className="w-full flex items-center justify-between bg-slate-800/60 hover:bg-slate-800/80 px-4 py-3 transition-colors text-left gap-2"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="font-mono text-xs text-sky-400">#{String(order.id).slice(-6).toUpperCase()}</span>
                              <span className="text-xs text-slate-400">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-semibold text-white">{fmt(order.totalAmount || 0)}</span>
                              <StatusBadge status={order.status} />
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                            </div>
                          </button>

                          {isOpen && (
                            <div className="bg-slate-900/60 px-4 py-3">
                              {order.items && order.items.length > 0 ? (
                                <>
                                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
                                    Items ({order.items.length})
                                  </p>
                                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                                    {order.items.map((item: any, i: number) => (
                                      <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-white font-medium truncate">{item.materialName || `Item ${i + 1}`}</p>
                                          {item.category && <p className="text-xs text-slate-500">{item.category}</p>}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                          <span className="text-xs text-slate-500">×{item.quantity || 1}</span>
                                          <span className="text-xs text-emerald-400 font-semibold">
                                            {fmt(item.lineTotal ?? (item.priceAtOrder ?? item.price ?? 0) * item.quantity)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <p className="text-xs text-slate-500 text-center py-2">No item details available</p>
                              )}
                              {order.orderNotes && (
                                <p className="text-xs text-slate-500 mt-2 italic">Note: {order.orderNotes}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <Pagination page={orderPage} total={filteredOrders.length} limit={ORDER_LIMIT} onChange={setOrderPage} />
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════
              DAILY SALES TAB — real POS bills, grouped by day
          ══════════════════════════════════════ */}
          {activeTab === 'daily' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <DateFilter
                  from={dailyFrom} to={dailyTo}
                  onFrom={v => { setDailyFrom(v); setDailyPage(1); }}
                  onTo={v => { setDailyTo(v); setDailyPage(1); }}
                  onClear={() => { setDailyFrom(''); setDailyTo(''); setDailyPage(1); }}
                />
                <button onClick={downloadExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all">
                  <Download className="w-3 h-3" /> Export
                </button>
              </div>

              {filteredDaily.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No POS sales in this date range</div>
              ) : (
                <div className="rounded-xl border border-slate-700/40 overflow-hidden">
                  <div className="divide-y divide-slate-800/60">
                    {paginatedDaily.map(row => (
                      <div key={row.date} className="flex items-center justify-between bg-slate-800/60 hover:bg-slate-800/80 px-4 py-3 transition-colors">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                          <p className="text-xs text-slate-300">
                            {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-400">{fmt(row.revenue)}</p>
                            <p className="text-xs text-slate-500">{row.orderCount} order{row.orderCount > 1 ? 's' : ''}</p>
                          </div>
                          <button
                            onClick={() => setDetailDate(row.date)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 transition-all"
                          >
                            View Detail
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination page={dailyPage} total={filteredDaily.length} limit={DAILY_LIMIT} onChange={setDailyPage} />
                </div>
              )}
              {detailDate && (() => {
                const row = filteredDaily.find(r => r.date === detailDate);
                if (!row) return null;
                const summary = getDayMaterialSummary(row);
                return (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setDetailDate(null)}
                  >
                    <div
                      className="card w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                        <div>
                          <p className="text-sm font-bold text-white">
                            {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-500">{row.orderCount} orders · {fmt(row.revenue)}</p>
                        </div>
                        <button onClick={() => setDetailDate(null)} className="text-slate-500 hover:text-white text-sm">✕</button>
                      </div>

                      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
                        {summary.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-6">No item data for this day</p>
                        ) : summary.map((item, i) => (
                          <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                            <p className="text-xs text-white font-medium truncate flex-1">{item.name}</p>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-slate-400">×{item.qty}</span>
                              <span className="text-xs text-emerald-400 font-semibold">{fmt(item.revenue)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="px-4 py-3 border-t border-slate-800">
                        <button
                          onClick={() => downloadDayExcel(row)}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" /> Download This Day's Excel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ══════════════════════════════════════
    STOCK TAB — Live stock (FranchiseProduct.stockPieces) + Sales & Profit
══════════════════════════════════════ */}
          {activeTab === 'stock' && (() => {
            if (stockLoading) {
              return (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
                </div>
              );
            }

            // Qty sold + revenue per product — derived from real POS bills (posOrders, already loaded above)
            const soldMap: Record<number, { qty: number; revenue: number }> = {};
            posOrders.forEach(o => {
              (o.items || []).forEach((item: any) => {
                const pid = item.productId;
                if (pid == null) return;
                if (!soldMap[pid]) soldMap[pid] = { qty: 0, revenue: 0 };
                soldMap[pid].qty += item.quantity || 0;
                soldMap[pid].revenue += item.lineTotal ?? (item.priceAtSale ?? 0) * (item.quantity || 0);
              });
            });

            const stockList = stockProducts.map((p: any) => {
              const stockPieces = p.stockPieces ?? 0;
              const unitsPerPacket = p.unitsPerPacket && p.unitsPerPacket > 0 ? p.unitsPerPacket : 1;
              const threshold = p.lowStockThreshold ?? 20;
              const sold = soldMap[p.id] || { qty: 0, revenue: 0 };
              const costPerItem = p.costPerItem ?? 0;
              const profit = sold.revenue - costPerItem * sold.qty;
              const status: 'critical' | 'low' | 'ok' =
                stockPieces <= 0 ? 'critical' : stockPieces <= threshold ? 'low' : 'ok';
              return { ...p, stockPieces, unitsPerPacket, threshold, sold, profit, status };
            }).sort((a, b) => {
              const order: Record<string, number> = { critical: 0, low: 1, ok: 2 };
              return order[a.status] - order[b.status];
            });

            return stockList.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No products found for this franchise</div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">{stockList.length} products · live stock from POS inventory</p>
                <div className="space-y-2">
                  {stockList.map((item: any) => {
                    const isOpen = expandedStockId === String(item.id);
                    const packets = Math.floor(item.stockPieces / item.unitsPerPacket);
                    const loose = item.stockPieces % item.unitsPerPacket;
                    const barColor = item.status === 'critical' ? 'bg-red-500' : item.status === 'low' ? 'bg-amber-400' : 'bg-emerald-400';
                    const badge = item.status === 'critical'
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">⚠ Critical</span>
                      : item.status === 'low'
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">Low</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Ok</span>;
                    const pct = Math.min(100, Math.max(2, (item.stockPieces / Math.max(item.threshold * 3, 1)) * 100));

                    return (
                      <div key={item.id} className="rounded-xl border border-slate-700/40 overflow-hidden">
                        <button
                          onClick={() => setExpandedStockId(isOpen ? null : String(item.id))}
                          className="w-full bg-slate-800/60 hover:bg-slate-800/80 px-4 py-3 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-white uppercase tracking-wide">{item.name}</p>
                              {badge}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-sm font-bold text-white">{packets} Packets</span>
                                <span className="text-xs text-slate-500"> + {loose} pcs</span>
                              </div>
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-slate-500">Sold: {item.sold.qty} units</p>
                            <p className="text-xs text-slate-500">Alert below: {item.threshold}</p>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="bg-slate-900/60 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                              <p className="text-xs text-slate-500 mb-0.5">Category</p>
                              <p className="text-xs text-white font-medium">{item.category || '—'}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                              <p className="text-xs text-slate-500 mb-0.5">Current Stock</p>
                              <p className="text-xs text-amber-400 font-bold">{item.stockPieces} pieces</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                              <p className="text-xs text-slate-500 mb-0.5">Revenue (all-time)</p>
                              <p className="text-xs text-emerald-400 font-bold">{fmt(item.sold.revenue)}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                              <p className="text-xs text-slate-500 mb-0.5">Profit (all-time)</p>
                              <p className={`text-xs font-bold ${item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {fmt(item.profit)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
};

export default AdminUserDetailPage;