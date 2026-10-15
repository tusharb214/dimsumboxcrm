import React, { useEffect, useState } from 'react';
import { Package, Save, AlertTriangle, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { posSetupApi } from '../../../api/posServices';
import { FranchiseProduct } from '../../../types/pos';

interface Draft {
  sellingPrice: string;
  piecesPerPlate: string;
  unitsPerPacket: string;
  lowStockThreshold: string;
  stockProductId: string;
  isRawStockProduct: boolean;
}

const PosProductSettingsPage: React.FC = () => {
  const [products, setProducts] = useState<FranchiseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});

  // Sync from admin
  const [syncing, setSyncing] = useState(false);

  // Add custom product
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newPieces, setNewPieces] = useState('1');
  const [newStock, setNewStock] = useState('0');
  const [newThreshold, setNewThreshold] = useState('20');
  const [adding, setAdding] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [stockPackets, setStockPackets] = useState<Record<number, string>>({});
  const [stockUpdatingId, setStockUpdatingId] = useState<number | null>(null);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await posSetupApi.getAllProducts();
      const list: FranchiseProduct[] = (res.data as any)?.data ?? [];
      setProducts(list);
      const d: Record<number, Draft> = {};
      list.forEach(p => {
        d[p.id] = {
          sellingPrice: String(p.sellingPrice ?? ''),
          piecesPerPlate: String(p.piecesPerPlate ?? 1),
          unitsPerPacket: String(p.unitsPerPacket ?? 1),
          lowStockThreshold: String(p.lowStockThreshold ?? 20),
          stockProductId: p.stockProductId ? String(p.stockProductId) : '',
          isRawStockProduct: Boolean(p.isRawStockProduct),
        };
      });
      setDrafts(d);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateDraft = (
    id: number,
    field: keyof Draft,
    value: string | boolean
  ) => {
    setDrafts(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };


  const toggleAvailable = async (p: FranchiseProduct) => {
    try {
      await posSetupApi.updateProduct(p.id, { isAvailable: !p.isAvailable });
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, isAvailable: !p.isAvailable } : x));
      toast.success(!p.isAvailable ? 'Product enabled for POS' : 'Product disabled from POS');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update product');
    }
  };

  const saveProduct = async (p: FranchiseProduct) => {
    const draft = drafts[p.id];
    if (!draft) return;
    const sellingPrice = parseFloat(draft.sellingPrice);
    const piecesPerPlate = parseInt(draft.piecesPerPlate, 10);
    const lowStockThreshold = parseInt(draft.lowStockThreshold, 10);
    const unitsPerPacket = parseInt(draft.unitsPerPacket, 10);
    const stockProductId = draft.stockProductId
      ? parseInt(draft.stockProductId, 10)
      : null;

    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      return toast.error('Enter a valid selling price');
    }

    if (isNaN(piecesPerPlate) || piecesPerPlate <= 0) {
      return toast.error('Enter valid pieces per plate');
    }

    if (isNaN(unitsPerPacket) || unitsPerPacket <= 0) {
      return toast.error('Enter valid units per packet');
    }

    setSavingId(p.id);

    try {
      await posSetupApi.updateProduct(p.id, {
        sellingPrice,
        piecesPerPlate,
        lowStockThreshold: isNaN(lowStockThreshold) ? undefined : lowStockThreshold,
        unitsPerPacket,
        stockProductId,
        isRawStockProduct: draft.isRawStockProduct,
      });
      await load();
      toast.success(`${p.name} updated`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update product');
    } finally {
      setSavingId(null);
    }
  };

  const syncNewProducts = async () => {
    setSyncing(true);
    try {
      const res = await posSetupApi.importProducts();
      const before = products.length;
      await load(); // refresh full list with drafts rebuilt
      const after = (res.data as any)?.data?.length ?? before;
      const newCount = after - before;
      toast.success(newCount > 0 ? `${newCount} new product(s) added` : 'No new products to sync');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to sync products');
    } finally {
      setSyncing(false);
    }
  };

  const addCustomProduct = async () => {
    if (!newName.trim()) return toast.error('Enter a product name');
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) return toast.error('Enter a valid selling price');
    const pieces = parseInt(newPieces, 10);
    if (isNaN(pieces) || pieces <= 0) return toast.error('Enter valid pieces per plate');
    const stock = parseInt(newStock, 10);
    const threshold = parseInt(newThreshold, 10);

    setAdding(true);
    try {
      await posSetupApi.addCustomProduct({
        name: newName.trim(),
        category: newCategory.trim() || undefined,
        sellingPrice: price,
        piecesPerPlate: pieces,
        stockPieces: isNaN(stock) ? 0 : stock,
        lowStockThreshold: isNaN(threshold) ? 20 : threshold,
      });
      toast.success(`${newName.trim()} added`);
      setNewName(''); setNewCategory(''); setNewPrice('');
      setNewPieces('1'); setNewStock('0'); setNewThreshold('20');
      setShowAddForm(false);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add product');
    } finally {
      setAdding(false);
    }
  };

  const deleteProduct = async (p: FranchiseProduct) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setDeletingId(p.id);
    try {
      await posSetupApi.deleteProduct(p.id);
      setProducts(prev => prev.filter(x => x.id !== p.id));
      toast.success(`${p.name} deleted`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const addStock = async (p: FranchiseProduct) => {
    const packets = parseInt(stockPackets[p.id] || '', 10);

    if (isNaN(packets) || packets <= 0) {
      return toast.error('Enter valid packets');
    }

    setStockUpdatingId(p.id);

    try {
      const res = await posSetupApi.addStock(p.id, { packets });

      const updated: FranchiseProduct = (res.data as any).data;

      setProducts(prev =>
        prev.map(x =>
          x.id === updated.id ? updated : x
        )
      );

      setStockPackets(prev => ({
        ...prev,
        [p.id]: '',
      }));

      toast.success(`${packets} packet(s) stock added`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Failed to add stock'
      );
    } finally {
      setStockUpdatingId(null);
    }
  };

  const stockLabel = (p: FranchiseProduct) => {
    const stockProduct = p.stockProductId
      ? products.find(x => x.id === p.stockProductId)
      : p;

    const pieces = stockProduct?.stockPieces ?? 0;

    const unitsPerPacket =
      stockProduct?.unitsPerPacket && stockProduct.unitsPerPacket > 0
        ? stockProduct.unitsPerPacket
        : 1;

    const packets = Math.floor(pieces / unitsPerPacket);
    const loose = pieces % unitsPerPacket;

    return `${packets} Packets + ${loose} Pieces`;
  };
  const isLow = (p: FranchiseProduct) =>
    (p.stockPieces ?? 0) <= (p.lowStockThreshold ?? 20);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-black flex items-center gap-2">
            <Package className="w-5 h-5 text-[#E3422C]" /> POS Settings — Products
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enable/disable products for billing, set your own selling price, and set pieces per plate for accurate stock tracking.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#fdece8] text-[#E3422C] border border-[#f3c9be] hover:bg-[#fbdcd4] transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
          <button
            onClick={syncNewProducts}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-all"
          >
            {syncing ? 'Syncing...' : 'Sync From Admin'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="card p-4 border border-[#f3c9be] space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-black">New Custom Product</p>
            <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Product Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Water Bottle" className="input-field w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Category</label>
              <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
                placeholder="e.g. Beverages" className="input-field w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Selling Price (₹) *</label>
              <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
                placeholder="e.g. 20" className="input-field w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Pieces / Plate *
              </label>
              <input
                type="number"
                value={newPieces}
                onChange={e => setNewPieces(e.target.value)}
                placeholder="e.g. 6"
                className="input-field w-full text-sm"
              />
            </div>



            <div>
              <label className="text-xs text-slate-500 mb-1 block">Opening Stock (pieces)</label>
              <input type="number" value={newStock} onChange={e => setNewStock(e.target.value)}
                placeholder="e.g. 0" className="input-field w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Low Stock Alert Below</label>
              <input type="number" value={newThreshold} onChange={e => setNewThreshold(e.target.value)}
                placeholder="e.g. 20" className="input-field w-full text-sm" />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            This product is added directly into your product list — same as admin-dispatched products (stock, low-stock alerts, and pieces-per-plate all apply).
          </p>
          <button
            onClick={addCustomProduct}
            disabled={adding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E3422C] text-white hover:bg-[#c93a24] disabled:opacity-50 transition-all"
          >
            {adding ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="card p-8 text-center text-slate-500 text-sm">
          No products found. Import products from POS Setup first.
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(p => {
            const draft = drafts[p.id] || {
              sellingPrice: '',
              piecesPerPlate: '1',
              unitsPerPacket: '1',
              lowStockThreshold: '20',
              stockProductId: ''
            };
            const low = isLow(p);
            return (
              <div key={p.id} className={`card p-4 border ${low ? 'border-red-300' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-bold text-black">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.category}{p.brand ? ` · ${p.brand}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {low && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    )}
                    <button
                      onClick={() => toggleAvailable(p)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${p.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${p.isAvailable ? 'translate-x-5' : ''}`} />
                    </button>
                    <span className="text-xs text-slate-500 w-16">{p.isAvailable ? 'Enabled' : 'Disabled'}</span>
                    <button
                      onClick={() => deleteProduct(p)}
                      disabled={deletingId === p.id}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      title="Delete product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Selling Price (₹)</label>
                    <input type="number" value={draft.sellingPrice}
                      onChange={e => updateDraft(p.id, 'sellingPrice', e.target.value)}
                      className="input-field w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Pieces / Plate</label>
                    <input type="number" value={draft.piecesPerPlate}
                      onChange={e => updateDraft(p.id, 'piecesPerPlate', e.target.value)}
                      className="input-field w-full text-sm" />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      {draft.stockProductId ? 'Stock Unit' : 'Pieces / Packet'}
                    </label>

                    {draft.stockProductId ? (
                      <div className="input-field w-full text-sm bg-slate-100 text-slate-500">
                        1 Packet = {
                          products.find(
                            x => x.id === Number(draft.stockProductId)
                          )?.unitsPerPacket ?? 1
                        } Pieces
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        value={draft.unitsPerPacket}
                        onChange={e =>
                          updateDraft(p.id, 'unitsPerPacket', e.target.value)
                        }
                        className="input-field w-full text-sm"
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Low Stock Alert Below</label>
                    <input type="number" value={draft.lowStockThreshold}
                      onChange={e => updateDraft(p.id, 'lowStockThreshold', e.target.value)}
                      className="input-field w-full text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Raw Stock Product
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.isRawStockProduct}
                        onChange={(e) =>
                          updateDraft(p.id, 'isRawStockProduct', e.target.checked)
                        }
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-slate-300">
                        Use as raw stock
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      Stock Mapping
                    </label>

                    <select
                      value={draft.stockProductId}
                      onChange={e =>
                        updateDraft(p.id, 'stockProductId', e.target.value)
                      }
                      className="input-field w-full text-sm"
                    >
                      <option value="">Own Stock</option>

                      {products
                        .filter(
                          stockProduct =>
                            stockProduct.id !== p.id &&
                            stockProduct.isRawStockProduct === true
                        )
                        .map(stockProduct => (
                          <option key={stockProduct.id} value={stockProduct.id}>
                            {stockProduct.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      Current Stock
                    </label>

                    <p
                      className={`text-sm font-semibold pt-2 ${low ? 'text-red-600' : 'text-emerald-600'
                        }`}
                    >
                      {stockLabel({
                        ...p,
                        stockProductId: draft.stockProductId
                          ? Number(draft.stockProductId)
                          : p.stockProductId,
                      })}
                    </p>

                    {p.stockUpdatedAt && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Updated:{' '}
                        {new Date(p.stockUpdatedAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      Add Stock (Packets)
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={stockPackets[p.id] || ''}
                        onChange={e =>
                          setStockPackets(prev => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        placeholder="Packets"
                        className="input-field w-full text-sm"
                      />

                      <button
                        onClick={() => addStock(p)}
                        disabled={stockUpdatingId === p.id}
                        className="px-3 py-2 rounded-lg text-xs font-medium bg-[#E3422C] text-white hover:bg-[#c93a24] disabled:opacity-50 whitespace-nowrap"
                      >
                        {stockUpdatingId === p.id ? 'Adding...' : 'Add'}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1">
                      1 packet = {
                        p.stockProductId
                          ? products.find(x => x.id === p.stockProductId)?.unitsPerPacket ?? 1
                          : p.unitsPerPacket ?? 1
                      } pieces
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => saveProduct(p)}
                    disabled={savingId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E3422C] text-white hover:bg-[#c93a24] disabled:opacity-50 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingId === p.id ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PosProductSettingsPage;