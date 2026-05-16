import React, { useState } from 'react';
import { Tags, Plus, Edit2, Trash2, Clock } from 'lucide-react';
import Modal from '../../components/common/Modal';

const DUMMY_CATS = [
  { id: '1', name: 'Sauces', products: 4, color: '#ef4444' },
  { id: '2', name: 'Dairy', products: 6, color: '#f59e0b' },
  { id: '3', name: 'Bakery', products: 8, color: '#10b981' },
  { id: '4', name: 'Meat', products: 5, color: '#3b82f6' },
  { id: '5', name: 'Oils', products: 3, color: '#a855f7' },
  { id: '6', name: 'Produce', products: 10, color: '#ec4899' },
];

const AdminCategoriesPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Categories</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage product categories</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-400">Backend Integration Pending</span>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Category</button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DUMMY_CATS.map(cat => (
          <div key={cat.id} className="card-hover p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}20`, border: `1px solid ${cat.color}30` }}>
                <Tags className="w-5 h-5" style={{ color: cat.color }} />
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <h3 className="font-semibold text-white">{cat.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{cat.products} products</p>
          </div>
        ))}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Category">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Clock className="w-4 h-4 text-amber-400" /><p className="text-xs text-amber-400">Backend Integration Pending</p>
          </div>
          <div><label className="label">Category Name</label><input type="text" className="input-field" placeholder="e.g. Beverages" /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={() => setModalOpen(false)} className="btn-primary flex-1 justify-center">Add Category</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCategoriesPage;
