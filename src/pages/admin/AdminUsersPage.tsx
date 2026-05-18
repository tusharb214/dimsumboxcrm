import React, { useEffect, useState } from 'react';
import { Plus, Users, RefreshCw, Loader2, Eye, X, ShoppingBag, TrendingUp, BarChart3, Calendar, Download } from 'lucide-react';
import { adminApi } from '../../api/services';
import { User, UserRole, Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const LIMIT = 10;
interface DailyRevenue {
  date: string;
  revenue: number;
  orderCount: number;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' as UserRole });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await adminApi.getAllUsers();
      const d = r.data as any;
      setUsers(Array.isArray(d) ? d : d?.users ?? d?.data ?? []);
    }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createUser(form);
      toast.success('User created!');
      setModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'USER' });
      fetchUsers();
    } catch { toast.error('Failed to create user'); }
    finally { setSubmitting(false); }
  };

  const openUserDetail = async (user: User) => {
    setSelectedUser(user);
    setDetailLoading(true);
    setUserOrders([]);
    setDailyRevenue([]);
    try {
      const ordersRes = await adminApi.getAllOrders();
      const raw = ordersRes.data as any;
      const all: Order[] = Array.isArray(raw) ? raw : raw?.orders ?? raw?.data ?? [];
      const orders = all.filter(
        o => String(o.userId) === String(user.id) || o.userEmail === user.email
      );
      setUserOrders(orders);
      const map: Record<string, { revenue: number; orderCount: number }> = {};
      orders
        .filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status))
        .forEach(o => {
          const date = new Date(o.createdAt).toISOString().split('T')[0];
          if (!map[date]) map[date] = { revenue: 0, orderCount: 0 };
          map[date].revenue += o.totalAmount || 0;
          map[date].orderCount += 1;
        });
      setDailyRevenue(
        Object.entries(map)
          .map(([date, v]) => ({ date, ...v }))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 30)
      );
    } catch { toast.error('Failed to load user details'); }
    finally { setDetailLoading(false); }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const totalRevenue = userOrders
    .filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status))
    .reduce((s, o) => s + (o.totalAmount || 0), 0);

const downloadUserExcel = () => {
  if (dailyRevenue.length === 0) return toast.error('No data to download');
  const rows = dailyRevenue.map(row => ({
    'Date': new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    'Revenue (₹)': row.revenue,
    'Orders': row.orderCount,
  }));
  rows.push({
    'Date': 'TOTAL',
    'Revenue (₹)': dailyRevenue.reduce((s, r) => s + r.revenue, 0),
    'Orders': dailyRevenue.reduce((s, r) => s + r.orderCount, 0),
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Revenue');
  XLSX.writeFile(wb, `${selectedUser?.name}-revenue-log.xlsx`);
  toast.success('Excel downloaded!');
};




  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-0.5">{users.length} registered users</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} className="btn-secondary"><RefreshCw className="w-4 h-4" />Refresh</button>
          <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Create User</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search users..." />
        </div>
        <div className="overflow-x-auto">
          {loading ? <TableSkeleton rows={6} cols={5} /> : paginated.length === 0 ? (
            <EmptyState icon={Users} title="No users found" description="Create your first user" action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Create User</button>} />
          ) : (
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Role</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Joined</th>


                </tr>

              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginated.map(user => (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="table-td text-slate-400">{user.email}</td>
                    <td className="table-td"><span className="badge-info">{user.role}</span></td>
                    <td className="table-td"><StatusBadge status={user.status || 'ACTIVE'} /></td>
                    <td className="table-td text-slate-500 text-xs">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="table-td">
                      <button
                        onClick={() => openUserDetail(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all"
                      >
                        <Eye className="w-3 h-3" /> See Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} total={filtered.length} limit={LIMIT} onChange={setPage} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New User">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="John Doe" className="input-field" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="user@company.com" className="input-field" required />
          </div>
          <div>
            <label className="label">Role</label>
            {/* <select value={form.role} onChange={set('role')} className="input-field">
              <option value="USER">Franchise User</option>
              <option value="ADMIN">Administrator</option>
              <option value="KITCHEN">Kitchen Staff</option>
            </select> */}
            <select value={form.role} onChange={set('role')} className="input-field">
  <option value="USER">Franchise User</option>
  <option value="ADMIN">Administrator</option>
</select>
<p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
  ⚠ Kitchen staff create karnyasathi Kitchens page var ja — tithech Kitchen entity + login dono create hote.
</p>
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" className="input-field" required minLength={8} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedUser(null)}>
          <div
            className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shadow-2xl animate-[slideInRight_0.25s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{selectedUser.name}</h2>
                  <p className="text-xs text-slate-400">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {detailLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700/40">
                      <p className="text-xs text-slate-500 mb-1">Role</p>
                      <span className="badge-info text-xs">{selectedUser.role}</span>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700/40">
                      <p className="text-xs text-slate-500 mb-1">Status</p>
                      <StatusBadge status={selectedUser.status || 'ACTIVE'} />
                    </div>
                    <div className="bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700/40 col-span-2">
                      <p className="text-xs text-slate-500 mb-1">Joined</p>
                      <p className="text-sm font-medium text-white">
                        {new Date(selectedUser.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Order Overview</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-sky-500/10 to-sky-500/5 border border-sky-500/20 rounded-xl p-4 text-center">
                        <ShoppingBag className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-white">{userOrders.length}</p>
                        <p className="text-xs text-slate-500">Total Orders</p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
                        <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-white">{fmt(totalRevenue)}</p>
                        <p className="text-xs text-slate-500">Total Revenue</p>
                      </div>
                    </div>
                  </div>

                  {dailyRevenue.length > 0 && (
                    <div>
                     <div className="flex items-center justify-between mb-3">
  <div className="flex items-center gap-2">
    <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daily Revenue Log</h3>
  </div>
  <button
    onClick={downloadUserExcel}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
  >
    <Download className="w-3 h-3" /> Export Excel
  </button>
</div>

                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {dailyRevenue.map(row => (
                          <div key={row.date} className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700/40">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <p className="text-xs text-slate-300">
                                {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-400">{fmt(row.revenue)}</p>
                              <p className="text-xs text-slate-500">{row.orderCount} order{row.orderCount > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Orders</h3>
                    {userOrders.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">No orders placed yet</div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {userOrders.slice(0, 15).map(order => (
                          <div key={order.id} className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700/40">
                            <div>
                              <p className="text-xs font-mono text-sky-400">#{String(order.id).slice(-6).toUpperCase()}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{order.items?.length || 0} items · {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-white mb-1">{fmt(order.totalAmount || 0)}</p>
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
    </div>

  );
};

export default AdminUsersPage;