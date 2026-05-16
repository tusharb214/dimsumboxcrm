import React, { useEffect, useState } from 'react';
import { Plus, Users, RefreshCw, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/services';
import { User, UserRole } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';
import toast from 'react-hot-toast';

const LIMIT = 10;

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' as UserRole });

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
  const paginated = filtered.slice((page-1)*LIMIT, page*LIMIT);

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
            <select value={form.role} onChange={set('role')} className="input-field">
              <option value="USER">Franchise User</option>
              <option value="ADMIN">Administrator</option>
              <option value="KITCHEN">Kitchen Staff</option>
            </select>
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