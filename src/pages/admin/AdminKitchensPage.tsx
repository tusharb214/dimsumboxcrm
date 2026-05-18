import React, { useEffect, useState } from 'react';
import { Plus, ChefHat, RefreshCw, MapPin, Loader2, X, ShoppingBag, TrendingUp, Clock, Eye, CheckCircle2, Calendar } from 'lucide-react';
import { adminApi } from '../../api/services';
import { Kitchen, Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';
import toast from 'react-hot-toast';

// ── Kitchen Detail Types ─────────────────────────────────────────
interface KitchenDetail {
  kitchen: Kitchen;
  orders: Order[];
  assignedUsers: any[];
}

const AdminKitchensPage: React.FC = () => {
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', email: '', password: '' });

  // ── FIX 4: Kitchen detail panel ──────────────────────────────────
  const [selectedKitchen, setSelectedKitchen] = useState<KitchenDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchKitchens = async () => {
    setLoading(true);
    try {
      const r = await adminApi.getAllKitchens();
      const d = r.data as any;
      setKitchens(Array.isArray(d) ? d : d?.kitchens ?? d?.data ?? []);
    } catch { toast.error('Failed to load kitchens'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchKitchens(); }, []);

  const filtered = kitchens.filter(k =>
    k.name.toLowerCase().includes(search.toLowerCase()) ||
    k.location.toLowerCase().includes(search.toLowerCase())
  );

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.location || !form.email || !form.password) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.createKitchen(form);
      toast.success('Kitchen created!');
      setModalOpen(false);
      // FIX 2: Reset form on success
      setForm({ name: '', location: '', email: '', password: '' });
      fetchKitchens();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create kitchen');
    } finally { setSubmitting(false); }
  };

  // FIX 2: Also reset form when modal closes
  const handleCloseModal = () => {
    setModalOpen(false);
    setForm({ name: '', location: '', email: '', password: '' });
  };

  // ── FIX 4: Load kitchen detail ───────────────────────────────────
  const openKitchenDetail = async (kitchen: Kitchen) => {
    setDetailLoading(true);
    setSelectedKitchen({ kitchen, orders: [], assignedUsers: [] });
    try {
      const ordersRes = await adminApi.getAllOrders();
      const allOrders = ordersRes.data as any;
      const allOrdersList: Order[] = Array.isArray(allOrders) ? allOrders : allOrders?.orders ?? allOrders?.data ?? [];
      const kitchenOrders = allOrdersList.filter(
        o => String(o.kitchenId) === String(kitchen.id) || o.kitchenName === kitchen.name
      );
      setSelectedKitchen({ kitchen, orders: kitchenOrders, assignedUsers: [] });
    } catch { toast.error('Failed to load kitchen details'); }
    finally { setDetailLoading(false); }
  };

  // Kitchen status summary
  const getKitchenStats = (orders: Order[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const total = orders.length;
    const preparing = orders.filter(o => o.status === 'PREPARING').length;
    const ready = orders.filter(o => o.status === 'READY').length;
    const delivered = orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length;
    const todayOrders = orders.filter(o => o.createdAt?.startsWith(todayStr)).length;
    const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    return { total, preparing, ready, delivered, todayOrders, totalRevenue };
  };


  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Kitchens</h1>
          <p className="text-slate-400 text-sm mt-0.5">{kitchens.length} kitchens registered</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchKitchens} className="btn-secondary"><RefreshCw className="w-4 h-4" />Refresh</button>
          <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Kitchen</button>
        </div>
      </div>

      <div className="card p-4 border-b border-slate-800 rounded-b-none">
        <SearchBar value={search} onChange={setSearch} placeholder="Search kitchens..." />
      </div>

      {loading ? (
        <div className="card overflow-hidden"><TableSkeleton rows={5} cols={4} /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ChefHat}
            title="No kitchens found"
            description="Add your first kitchen"
            action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Kitchen</button>}
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(kitchen => (
            <div key={kitchen.id} className="card-hover p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-emerald-400" />
                </div>
                <StatusBadge status={kitchen.status} />
              </div>
              <h3 className="font-semibold text-white mb-1">{kitchen.name}</h3>
              <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                {kitchen.location}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Orders: <span className="text-white font-semibold">{kitchen.assignedOrders ?? 0}</span></span>
                <span>Added: {new Date(kitchen.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              {/* FIX 4: View details button */}
              <button
                onClick={() => openKitchenDetail(kitchen)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-sky-500/40 hover:bg-sky-500/10 transition-all"
              >
                <Eye className="w-3 h-3" /> View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── FIX 4: Kitchen Detail Slide Panel ─────────────────────── */}
      {selectedKitchen && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedKitchen(null)}>
          <div
            className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shadow-2xl animate-[slideInRight_0.25s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800/60 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{selectedKitchen.kitchen.name}</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedKitchen.kitchen.location}</p>
                </div>
              </div>
              <button onClick={() => setSelectedKitchen(null)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {detailLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
              ) : (
                <>
                  {/* Status */}
                  <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700/40">
                    <span className="text-sm text-slate-400">Status</span>
                    <StatusBadge status={selectedKitchen.kitchen.status} />
                  </div>

                  {/* Stats */}
                  {(() => {
                    const stats = getKitchenStats(selectedKitchen.orders);
                    return (
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Performance</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gradient-to-br from-sky-500/10 to-sky-500/5 border border-sky-500/20 rounded-xl p-4 text-center">
                            <ShoppingBag className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                            <p className="text-xs text-slate-500">Total Orders</p>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
                            <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Revenue</p>
                          </div>
                          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
                            <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-white">{stats.preparing}</p>
                            <p className="text-xs text-slate-500">Preparing</p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4 text-center">
                            <CheckCircle2 className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-white">{stats.delivered}</p>
                            <p className="text-xs text-slate-500">Delivered</p>
                          </div>
                          <div className="bg-gradient-to-br from-sky-500/10 to-sky-500/5 border border-sky-500/20 rounded-xl p-4 text-center col-span-2">
                            <Calendar className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-white">{stats.todayOrders}</p>
                            <p className="text-xs text-slate-500">Today's Orders</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Recent Orders */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Orders</h3>
                    {selectedKitchen.orders.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">No orders assigned yet</div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {selectedKitchen.orders.slice(0, 10).map(order => (
                          <div key={order.id} className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700/40">
                            <div>
                              <p className="text-xs font-mono text-sky-400">#{String(order.id).slice(-6).toUpperCase()}</p>
                              <p className="text-xs text-slate-500">{order.userName || 'Unknown user'}</p>
                              <p className="text-xs text-slate-600">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-white mb-1">₹{order.totalAmount}</p>
                              <StatusBadge status={order.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Kitchen Modal */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} title="Add New Kitchen">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Kitchen Name *</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Pune Central Kitchen" className="input-field" required />
          </div>
          <div>
            <label className="label">Location *</label>
            <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Baner, Pune" className="input-field" required />
          </div>
          <div>
            <label className="label">Kitchen Login Email *</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="e.g. pune@kitchen.com" className="input-field" required />
          </div>
          <div>
            <label className="label">Kitchen Login Password *</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" className="input-field" required />
          </div>
          <p className="text-xs text-slate-500">Kitchen staff will use this email & password to login.</p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Kitchen'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminKitchensPage;