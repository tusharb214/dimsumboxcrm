import React, { useEffect, useState, useMemo } from 'react';
import { TrendingUp, Plus, RefreshCw, Calendar, Trash2, AlertTriangle, History, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { salesApi, materialApi, userApi } from '../../api/services';
import { Order } from '../../types';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface SaleItem { name: string; quantity: number; }
interface SalesReport {
  id: number;
  reportDate: string;
  totalSales: number;
  totalOrders: number;
  itemsSold: string;
  notes?: string;
  createdAt: string;
}
interface StockItem {
  name: string;
  purchased: number;
  sold: number;
  remaining: number;
  alertLevel: 'ok' | 'low' | 'critical';
}

const today = new Date().toISOString().split('T')[0];
const LOW_THRESHOLD      = 0.3;
const CRITICAL_THRESHOLD = 0.1;
const HISTORY_LIMIT      = 10;
const STOCK_LIMIT        = 10;

const parseItemsSold = (str: string): Record<string, number> => {
  if (!str) return {};
  const result: Record<string, number> = {};
  str.split(',').forEach(part => {
    const match = part.trim().match(/^(.+?)\s*x\s*(\d+)$/i);
    if (match) {
      const name = match[1].trim();
      result[name] = (result[name] || 0) + parseInt(match[2]);
    }
  });
  return result;
};

// ── Mini Pagination ───────────────────────────────────────────────
const Pager: React.FC<{ page: number; total: number; limit: number; onChange: (p: number) => void }> = ({ page, total, limit, onChange }) => {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
      <p className="text-xs text-slate-500">
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
              p === page ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}>
            {p}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === pages}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ── Custom searchable dropdown ────────────────────────────────────
const ItemSelect: React.FC<{
  value: string; suggestions: string[];
  onChange: (val: string) => void; placeholder?: string;
}> = ({ value, suggestions, onChange, placeholder }) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState(value);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} className="relative flex-1">
      <input value={query} placeholder={placeholder} className="input-field w-full py-2 pr-8"
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} />
      <span onClick={() => setOpen(o => !o)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer select-none text-xs">▾</span>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-800">
            {query.trim() && !suggestions.find(s => s.toLowerCase() === query.toLowerCase()) && (
              <div onMouseDown={() => { onChange(query.trim()); setQuery(query.trim()); setOpen(false); }}
                className="px-4 py-2.5 text-sm cursor-pointer text-emerald-400 hover:bg-slate-800 flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" /> Add "{query.trim()}"
              </div>
            )}
            {filtered.length > 0
              ? filtered.map(name => (
                  <div key={name} onMouseDown={() => { onChange(name); setQuery(name); setOpen(false); }}
                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                      value === name ? 'bg-sky-500/20 text-sky-400' : 'text-slate-300 hover:bg-slate-800'}`}>
                    {name}
                  </div>
                ))
              : query.trim() === '' && (
                  <div className="px-4 py-3 text-xs text-slate-500 text-center">Type to search or enter custom item</div>
                )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────
const DailySalesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'stock'>('log');

  // Form
  const [reportDate, setReportDate]   = useState(today);
  const [totalSales, setTotalSales]   = useState<number | ''>('');
  const [totalOrders, setTotalOrders] = useState<number | ''>('');
  const [items, setItems]             = useState<SaleItem[]>([{ name: '', quantity: 1 }]);
  const [submitting, setSubmitting]   = useState(false);

  // Data
  const [materialNames, setMaterialNames] = useState<string[]>([]);
  const [salesHistory, setSalesHistory]   = useState<SalesReport[]>([]);
  const [orders, setOrders]               = useState<Order[]>([]);
  const [summary, setSummary]             = useState({ today: 0, weekly: 0, monthly: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // History filters + pagination
  const [historySearch, setHistorySearch]   = useState('');
  const [historyFrom, setHistoryFrom]       = useState('');
  const [historyTo, setHistoryTo]           = useState('');
  const [historyPage, setHistoryPage]       = useState(1);

  // Stock filters + pagination
  const [stockFilter, setStockFilter] = useState<'all' | 'critical' | 'low' | 'ok'>('all');
  const [stockSearch, setStockSearch] = useState('');
  const [stockPage, setStockPage]     = useState(1);

  useEffect(() => {
    materialApi.getAllMaterials()
      .then(r => setMaterialNames((r.data?.data ?? r.data ?? []).map((m: any) => m.name)))
      .catch(() => {});
    fetchHistory(); fetchOrders(); fetchSummary();
  }, []);

  const fetchSummary = () => {
    setLoadingSummary(true);
    Promise.all([
      salesApi.getToday().catch(() => ({ data: 0 })),
      salesApi.getWeekly().catch(() => ({ data: 0 })),
      salesApi.getMonthly().catch(() => ({ data: 0 })),
    ]).then(([t, w, m]) => {
      const parse = (v: any) => typeof v === 'number' ? v : v?.data ?? 0;
      setSummary({ today: parse(t.data), weekly: parse(w.data), monthly: parse(m.data) });
    }).finally(() => setLoadingSummary(false));
  };

  const fetchHistory = () => {
    setLoadingHistory(true);
    salesApi.getMySales()
      .then(r => setSalesHistory(r.data?.data ?? r.data ?? []))
      .catch(() => setSalesHistory([]))
      .finally(() => setLoadingHistory(false));
  };

  const fetchOrders = () => {
    userApi.getMyOrders()
      .then(r => { const d = r.data; setOrders(Array.isArray(d) ? d : d?.data ?? d?.orders ?? []); })
      .catch(() => setOrders([]));
  };

  // ── Filtered history ──────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    return salesHistory.filter(log => {
      const matchSearch = !historySearch ||
        log.itemsSold?.toLowerCase().includes(historySearch.toLowerCase()) ||
        String(log.totalSales).includes(historySearch);
      const matchFrom = !historyFrom || log.reportDate >= historyFrom;
      const matchTo   = !historyTo   || log.reportDate <= historyTo;
      return matchSearch && matchFrom && matchTo;
    });
  }, [salesHistory, historySearch, historyFrom, historyTo]);

  const paginatedHistory = filteredHistory.slice(
    (historyPage - 1) * HISTORY_LIMIT, historyPage * HISTORY_LIMIT
  );

  // ── Stock calculation ─────────────────────────────────────────
  const stockItems = useMemo((): StockItem[] => {
    const purchased: Record<string, number> = {};
    orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).forEach(o => {
      o.items?.forEach(item => {
        purchased[item.materialName] = (purchased[item.materialName] || 0) + item.quantity;
      });
    });
    const sold: Record<string, number> = {};
    salesHistory.forEach(log => {
      Object.entries(parseItemsSold(log.itemsSold || '')).forEach(([name, qty]) => {
        sold[name] = (sold[name] || 0) + qty;
      });
    });
    return Object.entries(purchased).map(([name, purchasedQty]) => {
      const soldQty   = sold[name] || 0;
      const remaining = Math.max(0, purchasedQty - soldQty);
      const ratio     = purchasedQty > 0 ? remaining / purchasedQty : 1;
      const alertLevel = (ratio <= CRITICAL_THRESHOLD ? 'critical'
                        : ratio <= LOW_THRESHOLD      ? 'low'
                        : 'ok') as 'critical' | 'low' | 'ok';
      return { name, purchased: purchasedQty, sold: soldQty, remaining, alertLevel };
    }).sort((a, b) => {
      const orderMap: Record<string, number> = { critical: 0, low: 1, ok: 2 };
      return orderMap[a.alertLevel] - orderMap[b.alertLevel];
    });
  }, [orders, salesHistory]);

  const filteredStock = useMemo(() => {
    return stockItems.filter(s => {
      const matchAlert  = stockFilter === 'all' || s.alertLevel === stockFilter;
      const matchSearch = !stockSearch || s.name.toLowerCase().includes(stockSearch.toLowerCase());
      return matchAlert && matchSearch;
    });
  }, [stockItems, stockFilter, stockSearch]);

  const paginatedStock = filteredStock.slice(
    (stockPage - 1) * STOCK_LIMIT, stockPage * STOCK_LIMIT
  );

  const alertCount = stockItems.filter(s => s.alertLevel !== 'ok').length;

  // ── Excel Downloads ───────────────────────────────────────────
  const downloadHistoryExcel = () => {
    if (filteredHistory.length === 0) return toast.error('Download करायला data नाही');
    const rows = filteredHistory.map(log => ({
      'Date':         log.reportDate,
      'Total Sales':  log.totalSales || 0,
      'Total Orders': log.totalOrders || 0,
      'Items Sold':   log.itemsSold || '',
    }));
    // Summary row
    rows.push({
      'Date': 'TOTAL',
      'Total Sales':  filteredHistory.reduce((s, l) => s + (l.totalSales || 0), 0),
      'Total Orders': filteredHistory.reduce((s, l) => s + (l.totalOrders || 0), 0),
      'Items Sold': '',
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 50 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales History');
    XLSX.writeFile(wb, `sales-history-${today}.xlsx`);
    toast.success('Excel downloaded!');
  };

  const downloadStockExcel = () => {
    if (filteredStock.length === 0) return toast.error('Download करायला data नाही');
    const rows = filteredStock.map(s => ({
      'Item':         s.name,
      'Purchased':    s.purchased,
      'Sold':         s.sold,
      'Remaining':    s.remaining,
      'Status':       s.alertLevel.toUpperCase(),
      '% Remaining':  s.purchased > 0 ? Math.round((s.remaining / s.purchased) * 100) + '%' : '0%',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Report');
    XLSX.writeFile(wb, `stock-report-${today}.xlsx`);
    toast.success('Excel downloaded!');
  };

  // ── Item helpers ──────────────────────────────────────────────
  const addItem    = () => setItems(prev => [...prev, { name: '', quantity: 1 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof SaleItem, val: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const buildItemsSoldString = () =>
    items.filter(i => i.name.trim() && i.quantity > 0)
         .map(i => `${i.name.trim()} x${i.quantity}`).join(', ');

  const handleSubmit = async () => {
    if (!reportDate)                    return toast.error('Date select करा');
    if (!totalSales || totalSales <= 0) return toast.error('Total sales enter करा');
    const itemsSold = buildItemsSoldString();
    if (!itemsSold)                     return toast.error('कमीत कमी एक item add करा');
    setSubmitting(true);
    try {
      await salesApi.logDailySales({ reportDate, totalSales: Number(totalSales), totalOrders: Number(totalOrders) || 0, itemsSold });
      toast.success('Daily sales logged!');
      setTotalSales(''); setTotalOrders(''); setItems([{ name: '', quantity: 1 }]);
      fetchSummary(); fetchHistory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to log sales');
    } finally { setSubmitting(false); }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Daily Sales</h1>
          <p className="text-slate-400 text-sm mt-0.5">Sales log & stock track </p>
        </div>
        <button onClick={() => { fetchSummary(); fetchHistory(); fetchOrders(); }} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Today's Sales", value: summary.today,   color: 'text-emerald-400' },
          { label: 'Weekly Sales',  value: summary.weekly,  color: 'text-sky-400'     },
          { label: 'Monthly Sales', value: summary.monthly, color: 'text-purple-400'  },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-slate-400">{c.label}</p>
            {loadingSummary
              ? <div className="skeleton h-7 w-24 rounded-lg mt-2" />
              : <p className={`text-xl font-bold mt-1 ${c.color}`}>{fmt(c.value)}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {([
          { key: 'log',     label: 'Log Sales',  icon: TrendingUp    },
          { key: 'history', label: 'History',     icon: History       },
          { key: 'stock',   label: `Stock${alertCount > 0 ? ` (${alertCount})` : ''}`, icon: AlertTriangle },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key ? 'bg-sky-500 text-white shadow'
              : tab.key === 'stock' && alertCount > 0
              ? 'text-amber-400 hover:text-white'
              : 'text-slate-400 hover:text-white'
            }`}>
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Log Sales ── */}
      {activeTab === 'log' && (
        <div className="card p-6 max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white">Log Today's Sales</h2>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  <Calendar className="w-3 h-3 inline mr-1" />Report Date
                </label>
                <input type="date" value={reportDate} max={today}
                  onChange={e => setReportDate(e.target.value)} className="input-field w-full py-2.5" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Total Sales (₹)</label>
                <input type="number" value={totalSales} min={0} placeholder="e.g. 15000"
                  onChange={e => setTotalSales(e.target.value === '' ? '' : Number(e.target.value))}
                  className="input-field w-full py-2.5" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Total Orders</label>
                <input type="number" value={totalOrders} min={0} placeholder="e.g. 30"
                  onChange={e => setTotalOrders(e.target.value === '' ? '' : Number(e.target.value))}
                  className="input-field w-full py-2.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-slate-400">Items Sold</label>
                <button onClick={addItem}
                  className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ItemSelect value={item.name} suggestions={materialNames}
                      onChange={val => updateItem(index, 'name', val)}
                      placeholder="Search or type item name..." />
                    <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2 flex-shrink-0">
                      <button onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                        className="w-7 h-8 text-slate-400 hover:text-white transition-colors text-base">−</button>
                      <input type="number" value={item.quantity} min={1}
                        onChange={e => updateItem(index, 'quantity', Math.max(1, Number(e.target.value)))}
                        className="w-12 text-center bg-transparent text-white text-sm py-1.5 outline-none" />
                      <button onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                        className="w-7 h-8 text-slate-400 hover:text-white transition-colors text-base">+</button>
                    </div>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(index)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 transition-colors flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {buildItemsSoldString() && (
                <div className="mt-3 px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Backend ला pathvla janar:</p>
                  <p className="text-xs text-slate-300 font-mono leading-5">{buildItemsSoldString()}</p>
                </div>
              )}
            </div>

            <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full justify-center py-3">
              {submitting
                ? <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</span>
                : <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Log Sales</span>}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: History ── */}
      {activeTab === 'history' && (
        <div className="card overflow-hidden">
          {/* Filters + Download */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Sales History</h2>
              <button onClick={downloadHistoryExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all">
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={historySearch} placeholder="Search items or amount..."
                onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                className="input-field flex-1 py-2" />
              <div className="flex gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">From</label>
                  <input type="date" value={historyFrom} max={today}
                    onChange={e => { setHistoryFrom(e.target.value); setHistoryPage(1); }}
                    className="input-field py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">To</label>
                  <input type="date" value={historyTo} max={today}
                    onChange={e => { setHistoryTo(e.target.value); setHistoryPage(1); }}
                    className="input-field py-2 text-xs" />
                </div>
                {(historySearch || historyFrom || historyTo) && (
                  <button onClick={() => { setHistorySearch(''); setHistoryFrom(''); setHistoryTo(''); setHistoryPage(1); }}
                    className="self-end px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                    Clear
                  </button>
                )}
              </div>
            </div>
            {/* Summary bar */}
            {filteredHistory.length > 0 && (
              <div className="flex gap-4 text-xs text-slate-500">
                <span>{filteredHistory.length} records</span>
                <span className="text-emerald-400 font-medium">
                  Total: {fmt(filteredHistory.reduce((s, l) => s + (l.totalSales || 0), 0))}
                </span>
                <span>Orders: {filteredHistory.reduce((s, l) => s + (l.totalOrders || 0), 0)}</span>
              </div>
            )}
          </div>

          {loadingHistory ? (
            <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : paginatedHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <History className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm">कोणताही sales log नाही</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-800 bg-slate-900/50">
                    <tr>
                      <th className="table-th">#</th>
                      <th className="table-th">Date</th>
                      <th className="table-th">Total Sales</th>
                      <th className="table-th">Orders</th>
                      <th className="table-th">Items Sold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paginatedHistory.map((log, idx) => (
                      <tr key={log.id} className="hover:bg-white/2 transition-colors">
                        <td className="table-td text-slate-600 text-xs">
                          {(historyPage - 1) * HISTORY_LIMIT + idx + 1}
                        </td>
                        <td className="table-td font-medium text-white">
                          {new Date(log.reportDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="table-td font-semibold text-emerald-400">{fmt(log.totalSales || 0)}</td>
                        <td className="table-td text-slate-400">{log.totalOrders || 0}</td>
                        <td className="table-td">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(parseItemsSold(log.itemsSold || '')).map(([name, qty]) => (
                              <span key={name} className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                                {name} ×{qty}
                              </span>
                            ))}
                            {!log.itemsSold && <span className="text-slate-600 text-xs">—</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager page={historyPage} total={filteredHistory.length} limit={HISTORY_LIMIT} onChange={setHistoryPage} />
            </>
          )}
        </div>
      )}

      {/* ── TAB: Stock Alerts ── */}
      {activeTab === 'stock' && (
        <div className="card overflow-hidden">
          {/* Filters + Download */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Stock Remaining</h2>
              <button onClick={downloadStockExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all">
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={stockSearch} placeholder="Search item name..."
                onChange={e => { setStockSearch(e.target.value); setStockPage(1); }}
                className="input-field flex-1 py-2" />
              <div className="flex gap-1">
                {(['all', 'critical', 'low', 'ok'] as const).map(f => (
                  <button key={f} onClick={() => { setStockFilter(f); setStockPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                      stockFilter === f
                        ? f === 'critical' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                        : f === 'low'      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        : f === 'ok'       ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-sky-500/30 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                    }`}>
                    {f === 'all' ? 'All' : f}
                    {f !== 'all' && (
                      <span className="ml-1 opacity-70">
                        ({stockItems.filter(s => s.alertLevel === f).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Orders (DELIVERED/COMPLETED) मधून purchased − Sales logs मधून sold = Remaining
            </p>
          </div>

          {filteredStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertTriangle className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm">Stock data नाही</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-800/60">
                {paginatedStock.map(item => {
                  const ratio    = item.purchased > 0 ? item.remaining / item.purchased : 1;
                  const pct      = Math.round(ratio * 100);
                  const barColor = item.alertLevel === 'critical' ? 'bg-rose-500'
                                 : item.alertLevel === 'low'      ? 'bg-amber-500'
                                 : 'bg-emerald-500';
                  const badge = item.alertLevel === 'critical'
                    ? <span className="text-xs px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Critical</span>
                    : item.alertLevel === 'low'
                    ? <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Low</span>
                    : <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">OK</span>;

                  return (
                    <div key={item.name} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          {badge}
                        </div>
                        <p className="text-xs text-slate-400">
                          <span className="text-white font-semibold">{item.remaining}</span> / {item.purchased} units
                        </p>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className={`${barColor} h-1.5 rounded-full transition-all`}
                          style={{ width: `${Math.max(2, pct)}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-slate-600">Sold: {item.sold}</p>
                        <p className="text-xs text-slate-600">{pct}% remaining</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pager page={stockPage} total={filteredStock.length} limit={STOCK_LIMIT} onChange={setStockPage} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DailySalesPage;