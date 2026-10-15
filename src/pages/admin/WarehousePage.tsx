import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { warehouseApi } from '../../api/services';


interface WarehouseStock {
  id: number;
  materialId: number;
  materialName: string;
  category: string;
  unitsPerPacket: number;
  quantityPieces: number;
  averageCostPerPiece: number;
}

interface WarehouseTransaction {
  id: number;
  materialId: number;
  materialName: string;
  transactionType: 'INWARD' | 'DISPATCH' | 'ADJUSTMENT';
  packets: number;
  pieces: number;
  unitCost?: number;
  totalCost?: number;
  supplierName?: string;
  franchiseName?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

type Tab = 'stock' | 'inward' | 'dispatch' | 'transactions';

const money = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0);

const WarehousePage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('stock');
  const [stock, setStock] = useState<WarehouseStock[]>([]);
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [materialId, setMaterialId] = useState('');
  const [packets, setPackets] = useState('1');
  const [costPerPacket, setCostPerPacket] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [franchiseId, setFranchiseId] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);

    try {
      const [stockRes, materialsRes, franchisesRes, transactionsRes] =
        await Promise.all([
          warehouseApi.getStock(),
          warehouseApi.getMaterials(),
          warehouseApi.getFranchises(),
          warehouseApi.getTransactions(),
        ]);

      setStock(stockRes.data);
      setMaterials(materialsRes.data);
      setFranchises(franchisesRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Failed to load warehouse data:', error);
      toast.error('Could not load warehouse data. Check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredStock = useMemo(() => {
    const query = search.trim().toLowerCase();

    return stock.filter((item) =>
      `${item.materialName} ${item.category}`.toLowerCase().includes(query)
    );
  }, [stock, search]);

  const totalPieces = stock.reduce(
    (sum, item) => sum + (item.quantityPieces || 0),
    0
  );

  const totalValue = stock.reduce(
    (sum, item) =>
      sum + item.quantityPieces * item.averageCostPerPiece,
    0
  );

  const submitInward = async (event: React.FormEvent) => {
    event.preventDefault();

    const count = Number(packets);
    const cost = Number(costPerPacket);

    if (!materialId || !Number.isInteger(count) || count <= 0) {
      toast.error('Select a material and enter valid packets.');
      return;
    }

    if (!Number.isFinite(cost) || cost < 0) {
      toast.error('Enter a valid cost per packet.');
      return;
    }

    setSaving(true);

    try {
      await warehouseApi.stockInward({
        materialId: Number(materialId),
        packets: count,
        costPerPacket: cost,
        supplierName: supplierName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success('Stock added successfully.');
      setPackets('1');
      setCostPerPacket('');
      setSupplierName('');
      setNotes('');
      await loadData();
      setTab('stock');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to add warehouse stock.'
      );
    } finally {
      setSaving(false);
    }
  };

  const submitDispatch = async (event: React.FormEvent) => {
    event.preventDefault();

    const count = Number(packets);

    if (!materialId || !franchiseId ||
        !Number.isInteger(count) || count <= 0) {
      toast.error('Select a material, franchise and valid packet quantity.');
      return;
    }

    setSaving(true);

    try {
      await warehouseApi.dispatchStock({
        materialId: Number(materialId),
        franchiseId: Number(franchiseId),
        packets: count,
        notes: notes.trim() || undefined,
      });

      toast.success('Stock dispatched successfully.');
      setPackets('1');
      setNotes('');
      await loadData();
      setTab('stock');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to dispatch stock.'
      );
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'stock', label: 'Warehouse Stock' },
    { id: 'inward', label: 'Stock Inward' },
    { id: 'dispatch', label: 'Stock Dispatch' },
    { id: 'transactions', label: 'Transactions' },
  ];

  const inputClass =
    'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-500';

  const cardClass =
    'rounded-xl border border-slate-800 bg-slate-900/70 p-4';

  return (
    <div className="min-h-screen space-y-6 bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-sky-400">Admin / Inventory</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Warehouse Management
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Manage central stock, incoming materials and franchise dispatches.
          </p>
        </div>

        <button
          onClick={() => void loadData()}
          className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm hover:bg-slate-800"
        >
          Refresh data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className={cardClass}>
          <p className="text-sm text-slate-400">Materials in warehouse</p>
          <p className="mt-3 text-2xl font-bold">{stock.length}</p>
        </div>

        <div className={cardClass}>
          <p className="text-sm text-slate-400">Total pieces in stock</p>
          <p className="mt-3 text-2xl font-bold">
            {totalPieces.toLocaleString('en-IN')}
          </p>
        </div>

        <div className={cardClass}>
          <p className="text-sm text-slate-400">Estimated stock value</p>
          <p className="mt-3 text-2xl font-bold">{money(totalValue)}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setTab(item.id);
              setMaterialId('');
              setPackets('1');
              setNotes('');
            }}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              tab === item.id
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <section className={cardClass}>
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-lg font-semibold">Current Stock</h2>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search material..."
              className={`${inputClass} sm:max-w-xs`}
            />
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-400">Loading stock...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="p-3">Material</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Pieces / Packet</th>
                    <th className="p-3">Available Pieces</th>
                    <th className="p-3">Average Cost / Piece</th>
                    <th className="p-3">Stock Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredStock.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-medium">{item.materialName}</td>
                      <td className="p-3 text-slate-400">{item.category || '—'}</td>
                      <td className="p-3">{item.unitsPerPacket}</td>
                      <td className="p-3">{item.quantityPieces}</td>
                      <td className="p-3">{money(item.averageCostPerPiece)}</td>
                      <td className="p-3">
                        {money(item.quantityPieces * item.averageCostPerPiece)}
                      </td>
                    </tr>
                  ))}
                  {!filteredStock.length && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {search ? 'No matching materials found.' : 'No warehouse stock yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'inward' && (
        <form onSubmit={submitInward} className={`${cardClass} max-w-2xl space-y-4`}>
          <h2 className="text-lg font-semibold">Add Stock Inward</h2>

          <label className="block space-y-2 text-sm">
            <span className="text-slate-300">Material</span>
            <select required value={materialId} onChange={(e) => setMaterialId(e.target.value)} className={inputClass}>
              <option value="">Select material</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.unitsPerPacket ?? 0} pieces/packet)
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">Packets received</span>
              <input required min="1" step="1" type="number" value={packets} onChange={(e) => setPackets(e.target.value)} className={inputClass} />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">Cost per packet (₹)</span>
              <input required min="0" step="0.01" type="number" value={costPerPacket} onChange={(e) => setCostPerPacket(e.target.value)} className={inputClass} />
            </label>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="text-slate-300">Supplier name (optional)</span>
            <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className={inputClass} placeholder="Enter supplier name" />
          </label>

          <label className="block space-y-2 text-sm">
            <span className="text-slate-300">Notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={3} placeholder="Invoice number or additional details" />
          </label>

          <button disabled={saving} className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Stock'}
          </button>
        </form>
      )}

      {tab === 'dispatch' && (
        <form onSubmit={submitDispatch} className={`${cardClass} max-w-2xl space-y-4`}>
          <h2 className="text-lg font-semibold">Dispatch to Franchise</h2>

          <label className="block space-y-2 text-sm">
            <span className="text-slate-300">Material</span>
            <select required value={materialId} onChange={(e) => setMaterialId(e.target.value)} className={inputClass}>
              <option value="">Select material</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.unitsPerPacket ?? 0} pieces/packet)
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm">
            <span className="text-slate-300">Franchise</span>
            <select required value={franchiseId} onChange={(e) => setFranchiseId(e.target.value)} className={inputClass}>
              <option value="">Select franchise</option>
              {franchises.map((franchise) => (
                <option key={franchise.id} value={franchise.id}>
                  {franchise.name} ({franchise.email})
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm">
            <span className="text-slate-300">Packets to dispatch</span>
            <input required min="1" step="1" type="number" value={packets} onChange={(e) => setPackets(e.target.value)} className={inputClass} />
          </label>

          <label className="block space-y-2 text-sm">
            <span className="text-slate-300">Notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={3} />
          </label>

          <button disabled={saving} className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50">
            {saving ? 'Dispatching...' : 'Dispatch Stock'}
          </button>
        </form>
      )}

      {tab === 'transactions' && (
        <section className={cardClass}>
          <h2 className="mb-4 text-lg font-semibold">Transaction History</h2>
          {loading ? (
            <p className="py-8 text-center text-slate-400">Loading transactions...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Material</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Packets</th>
                    <th className="p-3">Pieces</th>
                    <th className="p-3">Supplier / Franchise</th>
                    <th className="p-3">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/50">
                      <td className="whitespace-nowrap p-3">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="p-3">{item.materialName}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          item.transactionType === 'INWARD'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-sky-500/10 text-sky-400'
                        }`}>
                          {item.transactionType}
                        </span>
                      </td>
                      <td className="p-3">{item.packets ?? 0}</td>
                      <td className="p-3">{item.pieces ?? 0}</td>
                      <td className="p-3">{item.supplierName || item.franchiseName || '—'}</td>
                      <td className="p-3">{money(item.totalCost ?? 0)}</td>
                    </tr>
                  ))}
                  {!transactions.length && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default WarehousePage;
