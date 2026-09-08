import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      // setUsers(Array.isArray(d) ? d : d?.users ?? d?.data ?? []);
      const allUsers = Array.isArray(d) ? d : d?.users ?? d?.data ?? [];
setUsers(allUsers.filter((u: any) => u.role !== 'KITCHEN'));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
           <h1 className="text-xl font-bold text-black">Users</h1>
<p className="text-black/60 text-sm mt-0.5">{users.length} registered users</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} className="btn-secondary"><RefreshCw className="w-4 h-4" />Refresh</button>
          <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Create User</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[#E3422C]">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search users..." />
        </div>
        <div className="overflow-x-auto">
          {loading ? <TableSkeleton rows={6} cols={5} /> : paginated.length === 0 ? (
            <EmptyState icon={Users} title="No users found" description="Create your first user" action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Create User</button>} />
          ) : (
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-[#E3422C] bg-[#FFEEE7]/95">
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Role</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Joined</th>


                </tr>

              </thead>
              <tbody className="divide-y divide-[#E3422C]/40">
                {paginated.map(user => (
                  <tr key={user.id} className="hover:bg-[#E3422C]/5 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-[#fff] text-xs font-bold flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-black">{user.name}</span>
                      </div>
                    </td>
                    <td className="table-td text-black/60">{user.email}</td>
                    <td className="table-td"><span className="badge-info">{user.role}</span></td>
                    <td className="table-td"><StatusBadge status={user.status || 'ACTIVE'} /></td>
                    <td className="table-td text-black/60 text-xs">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="table-td">
                      <button
                        onClick={() => navigate(`/admin/users/${user.id}`)}
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
              kitchen role is not available for creation here. Please go to the kitchen management page to create kitchen users.
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
       
    </div>

  );
};

export default AdminUsersPage;