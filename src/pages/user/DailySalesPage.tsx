//  import React, { useEffect, useState, useMemo } from 'react';
import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, RefreshCw, AlertTriangle, History, Download, ChevronLeft, ChevronRight, Receipt, Printer, X, FileDown, Eye } from 'lucide-react';
 import { salesApi } from '../../api/services';
import { posBillingApi, posSetupApi } from '../../api/posServices';
import { FranchiseProduct } from '../../types/pos';
import { PosOrderResponse } from '../../types/pos';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// interface MaterialOption { name: string; unitsPerPacket: number; }
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
  id: number;
  name: string;
  category?: string;
  stockPieces: number;
  unitsPerPacket: number;
  lowStockThreshold: number;
  alertLevel: 'ok' | 'low' | 'critical';
}

const today = new Date().toISOString().split('T')[0];
 
const HISTORY_LIMIT      = 10;
const STOCK_LIMIT        = 10;
const DAILY_LIMIT        = 10;

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

const InvoiceModal: React.FC<{
  order: PosOrderResponse;
  outletName: string;
  onClose: () => void;
}> = ({ order, outletName, onClose }) => {
  const printRef = React.useRef<HTMLDivElement>(null);
  const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
      pdf.save(`${order.invoiceNumber || 'invoice'}.pdf`);
    } catch {
      toast.error('PDF download failed');
    }
  };

  const billDate = order.billDateTime
    ? new Date(order.billDateTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area { position: fixed; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div id="invoice-print-area" ref={printRef} className="p-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">{outletName}</h2>
            <p className="text-xs text-slate-500">Tax Invoice</p>
          </div>
          <div className="border-t border-b border-slate-200 py-3 mb-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Invoice No.</span><span className="font-semibold">{order.invoiceNumber}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Date & Time</span><span>{billDate}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Customer</span><span>{order.customerName || 'Walk-in'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Order Type</span><span>{order.orderType?.replace('_', ' ')}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Payment Method</span><span>{order.paymentMethod}</span></div>
          </div>

          <table className="w-full text-sm mb-3">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs">
                <th className="text-left py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Price</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-1.5">{item.name}</td>
                  <td className="py-1.5 text-center">{item.quantity}</td>
                  <td className="py-1.5 text-right">{fmt(item.priceAtSale)}</td>
                  <td className="py-1.5 text-right font-medium">{fmt(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 text-sm mb-3">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmt(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>-{fmt(order.discountAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{fmt(order.taxAmount)}</span></div>
            <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-1.5 mt-1.5">
              <span>Grand Total</span><span>{fmt(order.totalAmount)}</span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 mb-1">
            Payment Status: <span className="font-semibold text-emerald-600">{order.status}</span>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">Thank you for dining with us!</p>
        </div>

        <div className="no-print flex items-center gap-2 p-4 border-t border-slate-200">
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-all">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleDownloadPdf}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-all">
            <FileDown className="w-4 h-4" /> Download PDF
          </button>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ItemsBreakdownModal: React.FC<{ log: SalesReport; onClose: () => void }> = ({ log, onClose }) => {
  const items = useMemo(() => Object.entries(parseItemsSold(log.itemsSold || '')), [log.itemsSold]);
  const dateLabel = new Date(log.reportDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Items Sold</h3>
            <p className="text-xs text-slate-500 mt-0.5">{dateLabel}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
              <p className="text-xs text-slate-500">Total Sales</p>
              <p className="text-sm font-semibold text-emerald-400 mt-0.5">₹{(log.totalSales || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
              <p className="text-xs text-slate-500">Total Orders</p>
              <p className="text-sm font-semibold text-sky-400 mt-0.5">{log.totalOrders || 0}</p>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No item breakdown available for this entry</p>
          ) : (
            <div className="space-y-2">
              {items.map(([name, qty]) => (
                <div key={name} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
                  <span className="text-sm text-slate-200">{name}</span>
                  <span className="text-sm font-semibold text-sky-400">{qty} units</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DailySalesPage: React.FC = () => {
  // const [activeTab, setActiveTab] = useState<'log' | 'history' | 'stock'>('log');
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'stock' ? 'stock' : 'log';
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'stock'>(initialTab);
const [salesHistory, setSalesHistory] = useState<SalesReport[]>([]);
   const [franchiseProducts, setFranchiseProducts] = useState<FranchiseProduct[]>([]);
const [loadingStock, setLoadingStock] = useState(true);
  const [summary, setSummary]             = useState({ today: 0, weekly: 0, monthly: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Day-wise sales list (Log Sales tab) — filters, pagination, breakdown modal
  const [dailySearch, setDailySearch]   = useState('');
  const [dailyFrom, setDailyFrom]       = useState('');
  const [dailyTo, setDailyTo]           = useState('');
  const [dailyPage, setDailyPage]       = useState(1);
  const [selectedDailyLog, setSelectedDailyLog] = useState<SalesReport | null>(null);

  // POS bill history (History tab)
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom]     = useState('');
  const [historyTo, setHistoryTo]         = useState('');
  const [historyPage, setHistoryPage]     = useState(1);

  const [posOrders, setPosOrders] = useState<PosOrderResponse[]>([]);
  const [loadingPosOrders, setLoadingPosOrders] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<PosOrderResponse | null>(null);
  const [outletName, setOutletName] = useState('Restaurant');

  const [stockFilter, setStockFilter] = useState<'all' | 'critical' | 'low' | 'ok'>('all');
  const [stockSearch, setStockSearch] = useState('');
  const [stockPage, setStockPage]     = useState(1);

 useEffect(() => {
    fetchHistory(); fetchSummary(); fetchPosOrders(); fetchOutletName(); fetchStock();
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

 const fetchStock = () => {
    setLoadingStock(true);
    posSetupApi.getAllProducts()
      .then(r => setFranchiseProducts((r.data as any)?.data ?? []))
      .catch(() => setFranchiseProducts([]))
      .finally(() => setLoadingStock(false));
  };
  const fetchPosOrders = () => {
    setLoadingPosOrders(true);
    posBillingApi.getOrderHistory()
      .then(r => setPosOrders(r.data?.data ?? r.data ?? []))
      .catch(() => setPosOrders([]))
      .finally(() => setLoadingPosOrders(false));
  };

  const fetchOutletName = () => {
    posSetupApi.getSettings()
      .then(r => {
        const settings = r.data?.data ?? r.data ?? {};
        setOutletName(settings.outletName || 'Restaurant');
      })
      .catch(() => {});
  };

  // ── Day-wise sales (Log Sales tab list) ──
  const filteredDailyHistory = useMemo(() => {
    return salesHistory.filter(log => {
      const matchSearch = !dailySearch ||
        log.itemsSold?.toLowerCase().includes(dailySearch.toLowerCase()) ||
        String(log.totalSales).includes(dailySearch);
      const matchFrom = !dailyFrom || log.reportDate >= dailyFrom;
      const matchTo   = !dailyTo   || log.reportDate <= dailyTo;
      return matchSearch && matchFrom && matchTo;
    }).sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  }, [salesHistory, dailySearch, dailyFrom, dailyTo]);

  const paginatedDailyHistory = filteredDailyHistory.slice(
    (dailyPage - 1) * DAILY_LIMIT, dailyPage * DAILY_LIMIT
  );

  const downloadDailyExcel = () => {
    if (filteredDailyHistory.length === 0) return toast.error('There is no data to download');
    const rows = filteredDailyHistory.map(log => ({
      'Date': log.reportDate,
      'Total Sales (₹)': log.totalSales || 0,
      'Total Orders': log.totalOrders || 0,
      'Items Sold': log.itemsSold || '',
    }));
    rows.push({
      'Date': 'TOTAL',
      'Total Sales (₹)': filteredDailyHistory.reduce((s, l) => s + (l.totalSales || 0), 0),
      'Total Orders': filteredDailyHistory.reduce((s, l) => s + (l.totalOrders || 0), 0),
      'Items Sold': '',
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 45 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Day-wise Sales');
    XLSX.writeFile(wb, `day-wise-sales-${dailyFrom || 'all'}_to_${dailyTo || today}.xlsx`);
    toast.success('Excel downloaded!');
  };

  // ── POS bill history (History tab) ──
  const filteredOrders = useMemo(() => {
    return posOrders.filter(o => {
      const billDate = o.billDateTime ? o.billDateTime.split('T')[0] : '';
      const matchSearch = !historySearch ||
        o.invoiceNumber?.toLowerCase().includes(historySearch.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(historySearch.toLowerCase()) ||
        String(o.totalAmount).includes(historySearch);
      const matchFrom = !historyFrom || billDate >= historyFrom;
      const matchTo   = !historyTo   || billDate <= historyTo;
      return matchSearch && matchFrom && matchTo;
    });
  }, [posOrders, historySearch, historyFrom, historyTo]);

  const paginatedOrders = filteredOrders.slice(
    (historyPage - 1) * HISTORY_LIMIT, historyPage * HISTORY_LIMIT
  );

  const stockItems = useMemo((): StockItem[] => {
    return franchiseProducts.map(p => {
      const stockPieces = p.stockPieces ?? 0;
      const threshold = p.lowStockThreshold ?? 20;
      const alertLevel: 'ok' | 'low' | 'critical' =
        stockPieces <= 0 ? 'critical'
        : stockPieces <= threshold ? 'low'
        : 'ok';
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        stockPieces,
        unitsPerPacket: p.unitsPerPacket && p.unitsPerPacket > 0 ? p.unitsPerPacket : 1,
        lowStockThreshold: threshold,
        alertLevel,
      };
    }).sort((a, b) => {
      const orderMap: Record<string, number> = { critical: 0, low: 1, ok: 2 };
      return orderMap[a.alertLevel] - orderMap[b.alertLevel];
    });
  }, [franchiseProducts]);


  
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

  const downloadHistoryExcel = () => {
    if (filteredOrders.length === 0) return toast.error('Download करायला data नाही');
    const rows = filteredOrders.map(o => ({
      'Invoice Number': o.invoiceNumber,
      'Bill Date & Time': o.billDateTime ? new Date(o.billDateTime).toLocaleString('en-IN') : '',
      'Customer': o.customerName || 'Walk-in',
      'Order Type': o.orderType,
      'Payment Method': o.paymentMethod,
      'Grand Total': o.totalAmount || 0,
      'Payment Status': o.status,
    }));
    rows.push({
      'Invoice Number': 'TOTAL', 'Bill Date & Time': '', 'Customer': '', 'Order Type': '' as any, 'Payment Method': '' as any,
      'Grand Total': filteredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
      'Payment Status': '',
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales History');
    XLSX.writeFile(wb, `sales-history-${today}.xlsx`);
    toast.success('Excel downloaded!');
  };

  const downloadStockExcel = () => {
    if (filteredStock.length === 0) return toast.error('Download करायला data नाही');
    const rows = filteredStock.map(s => {
      const packets = Math.floor(s.stockPieces / s.unitsPerPacket);
      const loose = s.stockPieces % s.unitsPerPacket;
      return {
        'Item':                   s.name,
        'Current Stock (pieces)': s.stockPieces,
        'Packets + Pieces':       `${packets} Packets + ${loose} Pieces`,
        'Low Stock Alert Below':  s.lowStockThreshold,
        'Status':                 s.alertLevel.toUpperCase(),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Report');
    XLSX.writeFile(wb, `stock-report-${today}.xlsx`);
    toast.success('Excel downloaded!');
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Daily Sales</h1>
          <p className="text-slate-400 text-sm mt-0.5">Sales log & stock track</p>
        </div>
        {/* <button onClick={() => { fetchSummary(); fetchHistory(); fetchOrders(); fetchPosOrders(); }} className="btn-secondary"> */}
        <button onClick={() => { fetchSummary(); fetchHistory(); fetchStock(); fetchPosOrders(); }} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

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

      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {([
          { key: 'log',     label: 'Log Sales', icon: TrendingUp   },
          { key: 'history', label: 'History',    icon: History      },
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
        <div className="space-y-6">

          {/* Day-wise sales list — filter, export, pagination, breakdown action */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Day-wise Sales</h2>
                <button onClick={downloadDailyExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all">
                  <Download className="w-3.5 h-3.5" /> Export Excel
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* <input value={dailySearch} placeholder="Search items or amount..."
                  onChange={e => { setDailySearch(e.target.value); setDailyPage(1); }}
                  className="input-field flex-1 py-2" /> */}
                <div className="flex gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">From</label>
                    <input type="date" value={dailyFrom} max={today}
                      onChange={e => { setDailyFrom(e.target.value); setDailyPage(1); }}
                      className="input-field py-2 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">To</label>
                    <input type="date" value={dailyTo} max={today}
                      onChange={e => { setDailyTo(e.target.value); setDailyPage(1); }}
                      className="input-field py-2 text-xs" />
                  </div>
                  {(dailySearch || dailyFrom || dailyTo) && (
                    <button onClick={() => { setDailySearch(''); setDailyFrom(''); setDailyTo(''); setDailyPage(1); }}
                      className="self-end px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {filteredDailyHistory.length > 0 && (
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>{filteredDailyHistory.length} entries</span>
                  <span className="text-emerald-400 font-medium">
                    Total: {fmt(filteredDailyHistory.reduce((s, l) => s + (l.totalSales || 0), 0))}
                  </span>
                </div>
              )}
            </div>

            {loadingHistory ? (
              <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
            ) : paginatedDailyHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <History className="w-10 h-10 text-slate-700 mb-3" />
                <p className="text-slate-400 text-sm">No entries found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-800 bg-slate-900/50">
                      <tr>
                        <th className="table-th">Date</th>
                        <th className="table-th">Total Sales</th>
                        <th className="table-th">Total Orders</th>
                        <th className="table-th">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {paginatedDailyHistory.map(log => (
                        <tr key={log.id} className="hover:bg-white/2 transition-colors">
                          <td className="table-td text-slate-300">
                            {new Date(log.reportDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="table-td font-semibold text-emerald-400">{fmt(log.totalSales || 0)}</td>
                          <td className="table-td text-slate-300">{log.totalOrders || 0}</td>
                          <td className="table-td">
                            <button onClick={() => setSelectedDailyLog(log)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 transition-all">
                              <Eye className="w-3.5 h-3.5" /> View Items
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pager page={dailyPage} total={filteredDailyHistory.length} limit={DAILY_LIMIT} onChange={setDailyPage} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: History ── */}
      {activeTab === 'history' && (
        <div className="card overflow-hidden">
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
            {filteredOrders.length > 0 && (
              <div className="flex gap-4 text-xs text-slate-500">
                <span>{filteredOrders.length} bills</span>
                <span className="text-emerald-400 font-medium">
                  Total: {fmt(filteredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0))}
                </span>
              </div>
            )}
          </div>

          {loadingPosOrders ? (
            <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : paginatedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <History className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm">No bills found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-800 bg-slate-900/50">
                    <tr>
                      <th className="table-th">Invoice #</th>
                      <th className="table-th">Bill Date & Time</th>
                      <th className="table-th">Customer</th>
                      <th className="table-th">Order Type</th>
                      <th className="table-th">Payment Method</th>
                      <th className="table-th">Grand Total</th>
                      <th className="table-th">Payment Status</th>
                      <th className="table-th">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paginatedOrders.map(order => (
                      <tr key={order.id} className="hover:bg-white/2 transition-colors">
                        <td className="table-td font-medium text-white">{order.invoiceNumber}</td>
                        <td className="table-td text-slate-400 text-xs">
                          {order.billDateTime
                            ? new Date(order.billDateTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="table-td text-slate-300">{order.customerName || 'Walk-in'}</td>
                        <td className="table-td">
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                            {order.orderType?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="table-td text-slate-300">{order.paymentMethod}</td>
                        <td className="table-td font-semibold text-emerald-400">{fmt(order.totalAmount || 0)}</td>
                        <td className="table-td">
                          <span className={`text-xs px-2 py-0.5 rounded-lg border ${
                            order.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="table-td">
                          <button onClick={() => setSelectedInvoice(order)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 transition-all">
                            <Receipt className="w-3.5 h-3.5" /> View Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager page={historyPage} total={filteredOrders.length} limit={HISTORY_LIMIT} onChange={setHistoryPage} />
            </>
          )}
        </div>
      )}

      {/* ── TAB: Stock Alerts ── */}
      {activeTab === 'stock' && (
        <div className="card overflow-hidden">
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
          </div>

          {filteredStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertTriangle className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm">No stock data available</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-800/60">
                 {paginatedStock.map(item => {
                  const packets = Math.floor(item.stockPieces / item.unitsPerPacket);
                  const loose = item.stockPieces % item.unitsPerPacket;
                  const barColor = item.alertLevel === 'critical' ? 'bg-rose-500'
                                 : item.alertLevel === 'low'      ? 'bg-amber-500'
                                 : 'bg-emerald-500';
                  const badge = item.alertLevel === 'critical'
                    ? <span className="text-xs px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Critical</span>
                    : item.alertLevel === 'low'
                    ? <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Low</span>
                    : <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">OK</span>;

                  return (
                    <div key={item.id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          {badge}
                        </div>
                        <p className="text-xs text-slate-400">
                          <span className="text-white font-semibold">{packets} Packets</span> + {loose} Pieces
                        </p>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className={`${barColor} h-1.5 rounded-full transition-all`}
                          style={{ width: `${Math.min(100, Math.max(2, (item.stockPieces / Math.max(item.lowStockThreshold * 3, 1)) * 100))}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-slate-600">Total: {item.stockPieces} pieces</p>
                        <p className="text-xs text-slate-600">Alert below: {item.lowStockThreshold}</p>
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

      {selectedInvoice && (
        <InvoiceModal
          order={selectedInvoice}
          outletName={outletName}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {selectedDailyLog && (
        <ItemsBreakdownModal
          log={selectedDailyLog}
          onClose={() => setSelectedDailyLog(null)}
        />
      )}
    </div>
  );
};

export default DailySalesPage;
