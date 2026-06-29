 import React, { useEffect, useState, useMemo } from 'react';
import { Tags, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { adminApi } from '../../api/services';
import toast from 'react-hot-toast';

const CAT_COLORS = [
  '#ef4444','#f59e0b','#10b981','#3b82f6',
  '#a855f7','#ec4899','#14b8a6','#f97316',
];

const AdminCategoriesPage: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editOldName, setEditOldName] = useState('');
  const [editNewName, setEditNewName] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCat, setDeleteCat] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllMaterials();
      const raw = res.data as any;
      setMaterials(Array.isArray(raw) ? raw : raw?.data ?? []);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMaterials(); }, []);

  // unique categories from materials
  const categories = useMemo(() => {
    const map: Record<string, { count: number; colorIdx: number }> = {};
    let idx = 0;
    materials.forEach(m => {
      const cat = m.category || 'Uncategorized';
      if (!map[cat]) { map[cat] = { count: 0, colorIdx: idx++ % CAT_COLORS.length }; }
      map[cat].count += 1;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [materials]);

  // ── Add: just validate name is unique, no backend call needed
  // Category exists when first material is added with that category
  // So Add Category = just remember it locally (or add dummy material — not ideal)
  // Better: Add category as metadata by creating a placeholder — skip, just show toast
  const handleAdd = async () => {
    const trimmed = newCat.trim();
    if (!trimmed) return toast.error('Category name required');
    if (categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase()))
      return toast.error('Category already exists');
    // No separate category endpoint — category is auto-created when material added
    toast.success(`Category "${trimmed}" ready — assign it when adding products`);
    setAddOpen(false);
    setNewCat('');
  };

  // ── Edit: rename all materials in that category
  const handleEdit = async () => {
    const trimmed = editNewName.trim();
    if (!trimmed) return toast.error('Category name required');
    if (trimmed === editOldName) { setEditOpen(false); return; }
    setEditLoading(true);
    try {
      const toUpdate = materials.filter(m => m.category === editOldName);
      await Promise.all(
        toUpdate.map(m => adminApi.updateMaterial(String(m.id), {
          name: m.name, category: trimmed, brand: m.brand,
          costPerItem: m.costPerItem, unitsPerPacket: m.unitsPerPacket,
        }))
      );
      toast.success(`Renamed "${editOldName}" → "${trimmed}"`);
      setEditOpen(false);
      fetchMaterials();
    } catch { toast.error('Failed to rename category'); }
    finally { setEditLoading(false); }
  };

  // ── Delete: deactivate all materials in that category
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const toDelete = materials.filter(m => m.category === deleteCat && m.isActive !== false);
      await Promise.all(toDelete.map(m => adminApi.deleteMaterial(String(m.id))));
      toast.success(`Category "${deleteCat}" deactivated (${toDelete.length} products)`);
      setDeleteOpen(false);
      fetchMaterials();
    } catch { toast.error('Failed to delete category'); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Categories</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage product categories</p>
        </div>
        <button onClick={() => { setNewCat(''); setAddOpen(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">No categories found</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => {
            const color = CAT_COLORS[cat.colorIdx];
            return (
              <div key={cat.name} className="card-hover p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}>
                    <Tags className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditOldName(cat.name); setEditNewName(cat.name); setEditOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
                    ><Edit2 className="w-3.5 h-3.5" /></button>
                    <button
                      onClick={() => { setDeleteCat(cat.name); setDeleteOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    ><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-white">{cat.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{cat.count} products</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Category">
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <AlertCircle className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
            <p className="text-xs text-sky-400">Categories are auto-created when you add products. Use this to plan a new category name.</p>
          </div>
          <div>
            <label className="label">Category Name</label>
            <input
              type="text" value={newCat} onChange={e => setNewCat(e.target.value)}
              className="input-field" placeholder="e.g. Beverages"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleAdd} className="btn-primary flex-1 justify-center">Add Category</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Rename Category">
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            This will rename <span className="text-white font-semibold">"{editOldName}"</span> across all {materials.filter(m => m.category === editOldName).length} products.
          </p>
          <div>
            <label className="label">New Name</label>
            <input
              type="text" value={editNewName} onChange={e => setEditNewName(e.target.value)}
              className="input-field" placeholder="Category name"
              onKeyDown={e => e.key === 'Enter' && handleEdit()}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleEdit} disabled={editLoading} className="btn-primary flex-1 justify-center">
              {editLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Category">
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-xs text-rose-400">
              This will deactivate all <strong>{materials.filter(m => m.category === deleteCat).length} products</strong> in "{deleteCat}". This cannot be undone easily.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setDeleteOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleDelete} disabled={deleteLoading}
              className="flex-1 justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-all flex items-center gap-2">
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCategoriesPage;