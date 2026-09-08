 import React, { useState, useEffect } from 'react';
import { Plus, Package, Edit2, Trash2, RefreshCw } from 'lucide-react';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';
import { adminApi } from '../../api/services';
import toast from 'react-hot-toast';

const LIMIT = 10;

const AdminProductsPage: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  // const [form, setForm] = useState({ name: '', category: '', brand: '', costPerItem: '' });
  const [form, setForm] = useState({ name: '', category: '', brand: '', costPerItem: '', unitsPerPacket: '' });

  const fetchMaterials = () => {
    setLoading(true);
    adminApi.getAllMaterials()
      .then(r => {
        const data = r.data?.data ?? r.data ?? [];
        setMaterials(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error('Failed to load materials'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMaterials(); }, []);

  const openAdd = () => {
    setEditItem(null);
    // setForm({ name: '', category: '', brand: '', costPerItem: '' });
    setForm({ name: '', category: '', brand: '', costPerItem: '', unitsPerPacket: '' });
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    // setForm({
    //   name: item.name,
    //   category: item.category,
    //   brand: item.brand ?? '',
    //   costPerItem: String(item.costPerItem),
    // });
    setForm({
      name: item.name,
      category: item.category,
      brand: item.brand ?? '',
      costPerItem: String(item.costPerItem),
      unitsPerPacket: String(item.unitsPerPacket ?? ''),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.costPerItem) {
      toast.error('Name, Category and Price are required');
      return;
    }
    setSaving(true);
    try {
      // const payload = {
      //   name: form.name,
      //   category: form.category,
      //   brand: form.brand,
      //   costPerItem: Number(form.costPerItem),
      // };
      const payload = {
        name: form.name,
        category: form.category,
        brand: form.brand,
        costPerItem: Number(form.costPerItem),
        unitsPerPacket: form.unitsPerPacket ? Number(form.unitsPerPacket) : null,
      };
      if (editItem) {
        await adminApi.updateMaterial(editItem.id, payload);
        toast.success('Material updated!');
      } else {
        await adminApi.addMaterial(payload);
        toast.success('Material added!');
      }
      setModalOpen(false);
      fetchMaterials();
    } catch {
      toast.error('Failed to save material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteMaterial(String(deleteId));
      toast.success('Material deactivated');
      setDeleteId(null);
      fetchMaterials();
    } catch {
      toast.error('Failed to delete material');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await adminApi.restoreMaterial(String(id));
      toast.success('Material restored!');
      fetchMaterials();
    } catch {
      toast.error('Failed to restore material');
    }
  };

  const filtered = materials.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-xl font-bold text-black">Materials / Products</h1>
<p className="text-black/60 text-sm mt-0.5">{materials.length} materials in catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchMaterials} className="btn-secondary">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Material
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[#E3422C]">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name, category, brand..." />
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
               <Package className="w-10 h-10 text-black/30 mb-3" />
<p className="text-black/60 text-sm">No materials found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-[#E3422C] bg-[#FFEEE7]/95">
                <tr>
                  <th className="table-th">Material</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Brand</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3422C]/40">
                {paginated.map(product => (
                  <tr key={product.id} className="hover:bg-[#E3422C]/5 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                          <Package className="w-4 h-4 text-sky-400" />
                        </div>
                        <span className="font-medium text-black">{product.name}</span>
                      </div>
                    </td>
                    <td className="table-td"><span className="badge-neutral">{product.category}</span></td>
                    <td className="table-td text-black/60">{product.brand || '—'}</td>
                    {/* <td className="table-td font-semibold text-white">₹{product.costPerItem}</td> */}
                    <td className="table-td font-semibold text-black">
  ₹{product.costPerItem}
  {product.unitsPerPacket ? <span className="block text-xs text-black/50 font-normal">{product.unitsPerPacket} pcs/packet</span> : null}
</td>
                    <td className="table-td">
                      <StatusBadge status={product.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1.5 rounded-lg text-black/50 hover:text-sky-500 hover:bg-sky-500/10 transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {product.isActive ? (
                          <button
                            onClick={() => setDeleteId(product.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestore(product.id)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-all"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} total={filtered.length} limit={LIMIT} onChange={setPage} />
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Material' : 'Add Material'}>
        <div className="space-y-4">
          <div>
            <label className="label">Material Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Paneer"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. DUMPLINGS"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Brand</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Amul"
                value={form.brand}
                onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Price (₹) per Packet*</label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 150"
              value={form.costPerItem}
              onChange={e => setForm(f => ({ ...f, costPerItem: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Pieces per Packet</label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 8 (momos per packet)"
              value={form.unitsPerPacket}
              onChange={e => setForm(f => ({ ...f, unitsPerPacket: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Add Material'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Deactivate Material">
        <div className="space-y-4">
          <p className="text-black/60 text-sm">Are you sure you want to deactivate this material? It won't appear for users.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleDelete} className="btn-danger flex-1 justify-center">
              <Trash2 className="w-4 h-4" /> Deactivate
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProductsPage;