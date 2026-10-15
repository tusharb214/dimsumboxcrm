 
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Boxes,
  Package,
  PackagePlus,
  Truck,
  History,
  IndianRupee,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react';
import { warehouseApi } from '../../api/services';

type Tab = 'stock' | 'inward' | 'dispatch' | 'transactions';

interface Material {
  id: number;
  name: string;
  category?: string;
  unitsPerPacket?: number;
  isActive?: boolean;
}

interface Franchise {
  id: number;
  name: string;
  email?: string;
}

interface Stock {
  id?: number;
  materialId: number;
  materialName: string;
  category?: string;
  unitsPerPacket?: number;
  quantityPieces: number;
  averageCostPerPiece?: number;
}

interface Transaction {
  id: number;
  materialName?: string;
  transactionType?: string;
  packets?: number;
  pieces?: number;
  totalCost?: number;
  supplierName?: string;
  franchiseName?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt?: string;
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'stock', label: 'Warehouse Stock', icon: Boxes },
  { id: 'inward', label: 'Stock Inward', icon: PackagePlus },
  { id: 'dispatch', label: 'Stock Dispatch', icon: Truck },
  { id: 'transactions', label: 'Transactions', icon: History },
];

const inputClass =
  'w-full min-w-0 rounded-xl border border-[#ffeee7] bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-gray-400 focus:border-[#E3422C] focus:ring-2 focus:ring-[#E3422C]/15';

const labelClass = 'mb-2 block text-sm font-medium text-black';
const panelClass =
  'rounded-2xl border border-[#E3422C]/70 bg-white shadow-sm';

const money = (value?: number) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

const unwrap = (response: any): any => {
  let result = response?.data;
  if (result?.data !== undefined) result = result.data;
  return result;
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
};

const PrimaryButton: React.FC<
  React.PropsWithChildren<{
    disabled?: boolean;
    type?: 'button' | 'submit';
  }>
> = ({ children, disabled, type = 'button' }) => (
  <button
    type={type}
    disabled={disabled}
    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E3422C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c93220] disabled:cursor-not-allowed disabled:opacity-60"
  >
    {children}
  </button>
);

const WarehousePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('stock');

  const [stock, setStock] = useState<Stock[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [stockSearch, setStockSearch] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');

  const [inward, setInward] = useState({
    materialId: '',
    packets: '1',
    piecesPerPacket: '',
    costPerPacket: '',
    supplierName: '',
    notes: '',
  });

  const [dispatch, setDispatch] = useState({
    materialId: '',
    franchiseId: '',
    packets: '1',
    notes: '',
  });

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    try {
      const [stockRes, materialsRes, franchisesRes, transactionsRes] =
        await Promise.all([
          warehouseApi.getStock(),
          warehouseApi.getMaterials(),
          warehouseApi.getFranchises(),
          warehouseApi.getTransactions(),
        ]);

      const stockData = unwrap(stockRes);
      const materialData = unwrap(materialsRes);
      const franchiseData = unwrap(franchisesRes);
      const transactionData = unwrap(transactionsRes);

      setStock(Array.isArray(stockData) ? stockData : []);
      setMaterials(Array.isArray(materialData) ? materialData : []);
      setFranchises(Array.isArray(franchiseData) ? franchiseData : []);
      setTransactions(
        Array.isArray(transactionData) ? transactionData : []
      );
    } catch (error) {
      console.error('Warehouse loading error:', error);
      toast.error('Unable to load warehouse data.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeMaterials = useMemo(
    () => materials.filter((material) => material.isActive !== false),
    [materials]
  );

  const selectedInward = activeMaterials.find(
    (material) => String(material.id) === inward.materialId
  );

  const selectedDispatch = activeMaterials.find(
    (material) => String(material.id) === dispatch.materialId
  );

  const totalPieces = stock.reduce(
    (sum, item) => sum + Number(item.quantityPieces || 0),
    0
  );

  const totalValue = stock.reduce(
    (sum, item) =>
      sum +
      Number(item.quantityPieces || 0) *
        Number(item.averageCostPerPiece || 0),
    0
  );

  const piecesPerPacket = Number(
    inward.piecesPerPacket || selectedInward?.unitsPerPacket || 0
  );

  const totalInwardPieces =
    Math.max(0, Number(inward.packets || 0)) *
    Math.max(0, piecesPerPacket);

  const totalDispatchPieces =
    Math.max(0, Number(dispatch.packets || 0)) *
    Number(selectedDispatch?.unitsPerPacket || 0);

  const filteredStock = stock.filter((item) =>
    `${item.materialName} ${item.category || ''}`
      .toLowerCase()
      .includes(stockSearch.trim().toLowerCase())
  );

  const filteredTransactions = transactions.filter((item) =>
    [
      item.materialName,
      item.transactionType,
      item.supplierName,
      item.franchiseName,
      item.referenceNumber,
      item.notes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(transactionSearch.trim().toLowerCase())
  );

  const handleInward = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const packets = Number(inward.packets);
    const cost = Number(inward.costPerPacket);

    if (!inward.materialId) {
      toast.error('Select a material.');
      return;
    }

    if (
      !Number.isInteger(packets) ||
      packets <= 0
    ) {
      toast.error('Enter a valid packet quantity.');
      return;
    }

    if (
      !Number.isInteger(piecesPerPacket) ||
      piecesPerPacket <= 0
    ) {
      toast.error('Enter a valid pieces-per-packet quantity.');
      return;
    }

    if (
      inward.costPerPacket.trim() === '' ||
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      toast.error('Enter a valid cost per packet.');
      return;
    }

    setSubmitting(true);

    try {
      // The current API does not accept piecesPerPacket.
      // Update the backend DTO and service to persist this value.
      await warehouseApi.stockInward({
        materialId: Number(inward.materialId),
        packets,
        costPerPacket: cost,
        supplierName: inward.supplierName.trim() || undefined,
        notes: inward.notes.trim() || undefined,
      });

      toast.success('Stock inward recorded successfully.');

      setInward({
        materialId: '',
        packets: '1',
        piecesPerPacket: '',
        costPerPacket: '',
        supplierName: '',
        notes: '',
      });

      await loadData(false);
      setActiveTab('stock');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to add stock.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatch = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const packets = Number(dispatch.packets);

    if (!dispatch.materialId || !dispatch.franchiseId) {
      toast.error('Select a material and franchise.');
      return;
    }

    if (!Number.isInteger(packets) || packets <= 0) {
      toast.error('Enter a valid packet quantity.');
      return;
    }

    setSubmitting(true);

    try {
      await warehouseApi.dispatchStock({
        materialId: Number(dispatch.materialId),
        franchiseId: Number(dispatch.franchiseId),
        packets,
        notes: dispatch.notes.trim() || undefined,
      });

      toast.success('Stock dispatched successfully.');

      setDispatch({
        materialId: '',
        franchiseId: '',
        packets: '1',
        notes: '',
      });

      await loadData(false);
      setActiveTab('stock');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to dispatch stock.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
  }> = ({ title, value, icon: Icon, color }) => (
    <div className={`${panelClass} min-w-0 p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {title}
          </p>
          <p className="mt-2 break-words text-2xl font-bold text-black sm:text-3xl">
            {value}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${color}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );

  const SideInfo: React.FC<{
    kind: 'inward' | 'dispatch';
  }> = ({ kind }) => {
    const isInward = kind === 'inward';
    const Icon = isInward ? PackagePlus : Truck;

    return (
      <aside
        className="h-fit min-w-0 rounded-2xl border border-[#ffeee7] p-5 sm:p-6"
        style={{ backgroundColor: '#FFF0E8', color: '#000000' }}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white">
          <Icon size={22} color="#E3422C" />
        </div>

        <h3
          className="text-lg font-bold"
          style={{ color: '#000000' }}
        >
          {isInward ? 'Stock Inward' : 'Stock Dispatch'}
        </h3>

        <p
          className="mt-2 text-sm leading-6"
          style={{ color: '#333333' }}
        >
          {isInward
            ? 'Record supplier deliveries and the number of pieces in each packet.'
            : 'Choose the material and destination franchise before dispatching stock.'}
        </p>

        <div className="mt-5 border-t border-[#E3422C]/20 pt-4">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: '#333333' }}
          >
            {isInward ? 'Current Material Types' : 'Available Stock'}
          </p>

          <p
            className="mt-1 text-2xl font-bold"
            style={{ color: '#000000' }}
          >
            {isInward
              ? activeMaterials.length
              : totalPieces.toLocaleString('en-IN')}

            {!isInward && (
              <span className="ml-1 text-sm font-normal text-gray-600">
                pieces
              </span>
            )}
          </p>

          {!isInward && (
            <p
              className="mt-2 text-sm"
              style={{ color: '#333333' }}
            >
              Franchises: {franchises.length}
            </p>
          )}
        </div>
      </aside>
    );
  };

  const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="px-4 py-12 text-center">
      <Package size={34} className="mx-auto mb-3 text-gray-400" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-[1600px] min-w-0 space-y-5 px-3 pb-8 pt-3 sm:px-5 lg:px-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#E3422C]">
            Admin / Inventory
          </p>
          <h1 className="mt-1 text-2xl font-bold text-black sm:text-3xl">
            Warehouse Management
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Manage central stock, supplier inward and franchise dispatches.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E3422C]/30 bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#FFF0E8] disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh data
        </button>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          title="Material Types"
          value={String(stock.length)}
          icon={Boxes}
          color="border-blue-200 bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Total Stock Pieces"
          value={totalPieces.toLocaleString('en-IN')}
          icon={Package}
          color="border-emerald-200 bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Estimated Stock Value"
          value={money(totalValue)}
          icon={IndianRupee}
          color="border-amber-200 bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Transactions"
          value={String(transactions.length)}
          icon={History}
          color="border-purple-200 bg-purple-50 text-purple-600"
        />
      </section>

      <section className={`${panelClass} min-w-0 overflow-hidden`}>
        <nav className="border-b border-[#ffeee7] px-3 pt-3 sm:px-5 sm:pt-4">
          <div className="flex gap-2 overflow-x-auto pb-3">
            {tabs.map(({ id, label: title, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-pressed={activeTab === id}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold sm:px-4 ${
                  activeTab === id
                    ? 'bg-[#E3422C] text-white'
                    : 'bg-[#FFF0E8] text-black hover:bg-[#ffe4d7]'
                }`}
              >
                <Icon size={17} />
                {title}
              </button>
            ))}
          </div>
        </nav>

        {activeTab === 'stock' && (
          <div className="min-w-0 p-3 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-black">
                  Warehouse Stock
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Current inventory for all materials.
                </p>
              </div>

              <input
                className={`${inputClass} sm:max-w-xs`}
                type="search"
                value={stockSearch}
                onChange={(event) => setStockSearch(event.target.value)}
                placeholder="Search material or category"
              />
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-gray-600">
                Loading warehouse stock...
              </p>
            ) : filteredStock.length === 0 ? (
              <EmptyState
                message={
                  stock.length
                    ? 'No materials match your search.'
                    : 'No stock available yet. Record stock inward first.'
                }
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#ffeee7]">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-[#FFF0E8]">
                    <tr className="border-b border-[#E3422C]/20 text-xs uppercase tracking-wide text-gray-700">
                      <th className="px-4 py-4">Material</th>
                      <th className="px-4 py-4">Category</th>
                      <th className="px-4 py-4">Pieces / Packet</th>
                      <th className="px-4 py-4">Stock Pieces</th>
                      <th className="px-4 py-4">Avg. Cost / Piece</th>
                      <th className="px-4 py-4 text-right">Stock Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ffeee7]">
                    {filteredStock.map((item, index) => (
                      <tr
                        key={item.id ?? item.materialId ?? index}
                        className="hover:bg-[#FFF9F5]"
                      >
                        <td className="px-4 py-4 font-semibold text-black">
                          {item.materialName}
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {item.category || '-'}
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {item.unitsPerPacket ?? '-'}
                        </td>
                        <td className="px-4 py-4 font-semibold text-black">
                          {Number(item.quantityPieces || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {money(item.averageCostPerPiece)}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-[#E3422C]">
                          {money(
                            Number(item.quantityPieces || 0) *
                              Number(item.averageCostPerPiece || 0)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inward' && (
          <div className="grid min-w-0 grid-cols-1 gap-5 p-3 sm:p-5 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-black">
                  Add Stock Inward
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Record materials received from your supplier.
                </p>
              </div>

              <form onSubmit={handleInward} className="space-y-5">
                <div>
                  <label className={labelClass} htmlFor="in-material">
                    Material *
                  </label>
                  <select
                    id="in-material"
                    className={inputClass}
                    value={inward.materialId}
                    required
                    onChange={(event) => {
                      const material = activeMaterials.find(
                        (item) => String(item.id) === event.target.value
                      );

                      setInward((previous) => ({
                        ...previous,
                        materialId: event.target.value,
                        piecesPerPacket: material?.unitsPerPacket
                          ? String(material.unitsPerPacket)
                          : '',
                      }));
                    }}
                  >
                    <option value="">Select material</option>
                    {activeMaterials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name}
                      </option>
                    ))}
                  </select>

                  {!activeMaterials.length && (
                    <p className="mt-2 text-xs text-[#C93220]">
                      No active materials found. Add a material first.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="in-packets">
                      Packets received *
                    </label>
                    <input
                      id="in-packets"
                      className={inputClass}
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={inward.packets}
                      onChange={(event) =>
                        setInward((previous) => ({
                          ...previous,
                          packets: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="in-pieces">
                      Pieces per packet *
                    </label>
                    <input
                      id="in-pieces"
                      className={inputClass}
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="e.g. 25"
                      value={inward.piecesPerPacket}
                      onChange={(event) =>
                        setInward((previous) => ({
                          ...previous,
                          piecesPerPacket: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="in-cost">
                      Cost per packet (₹) *
                    </label>
                    <input
                      id="in-cost"
                      className={inputClass}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="Enter packet cost"
                      value={inward.costPerPacket}
                      onChange={(event) =>
                        setInward((previous) => ({
                          ...previous,
                          costPerPacket: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="rounded-xl border border-[#ffeee7] bg-[#FFF0E8] px-4 py-3">
                    <p className="text-sm font-medium text-gray-700">
                      Total pieces received
                    </p>
                    <p className="mt-1 text-2xl font-bold text-black">
                      {totalInwardPieces.toLocaleString('en-IN')}
                      <span className="text-sm font-normal text-gray-600">
                        {' '}pieces
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {inward.packets || 0} packet(s) × {piecesPerPacket || 0} pieces
                    </p>
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="in-supplier">
                    Supplier name (optional)
                  </label>
                  <input
                    id="in-supplier"
                    className={inputClass}
                    placeholder="Enter supplier name"
                    value={inward.supplierName}
                    onChange={(event) =>
                      setInward((previous) => ({
                        ...previous,
                        supplierName: event.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="in-notes">
                    Notes (optional)
                  </label>
                  <textarea
                    id="in-notes"
                    className={inputClass}
                    rows={3}
                    placeholder="Invoice number or additional details"
                    value={inward.notes}
                    onChange={(event) =>
                      setInward((previous) => ({
                        ...previous,
                        notes: event.target.value,
                      }))
                    }
                  />
                </div>

                <PrimaryButton
                  type="submit"
                  disabled={submitting || activeMaterials.length === 0}
                >
                  <ArrowDownToLine size={17} />
                  {submitting ? 'Saving...' : 'Add Stock'}
                </PrimaryButton>

                <p className="text-xs leading-5 text-gray-500">
                  Backend update required: the current inward API does not
                  save the Pieces per packet field. Update the backend request
                  and stock calculation before relying on this value for actual
                  inventory.
                </p>
              </form>
            </div>

            <SideInfo kind="inward" />
          </div>
        )}

        {activeTab === 'dispatch' && (
          <div className="grid min-w-0 grid-cols-1 gap-5 p-3 sm:p-5 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-black">
                  Dispatch Stock to Franchise
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Record stock sent to a franchise outlet.
                </p>
              </div>

              <form onSubmit={handleDispatch} className="space-y-5">
                <div>
                  <label className={labelClass} htmlFor="out-material">
                    Material *
                  </label>
                  <select
                    id="out-material"
                    className={inputClass}
                    required
                    value={dispatch.materialId}
                    onChange={(event) =>
                      setDispatch((previous) => ({
                        ...previous,
                        materialId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select material</option>
                    {activeMaterials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="out-franchise">
                    Franchise outlet *
                  </label>
                  <select
                    id="out-franchise"
                    className={inputClass}
                    required
                    value={dispatch.franchiseId}
                    onChange={(event) =>
                      setDispatch((previous) => ({
                        ...previous,
                        franchiseId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select franchise</option>
                    {franchises.map((franchise) => (
                      <option key={franchise.id} value={franchise.id}>
                        {franchise.name}
                        {franchise.email ? ` — ${franchise.email}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="out-packets">
                    Packets to dispatch *
                  </label>
                  <input
                    id="out-packets"
                    className={inputClass}
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={dispatch.packets}
                    onChange={(event) =>
                      setDispatch((previous) => ({
                        ...previous,
                        packets: event.target.value,
                      }))
                    }
                  />
                </div>

                {selectedDispatch && (
                  <div className="rounded-xl border border-[#ffeee7] bg-[#FFF0E8] p-4">
                    <p className="text-sm text-gray-700">
                      Dispatch quantity preview
                    </p>
                    <p className="mt-1 text-xl font-bold text-black">
                      {totalDispatchPieces.toLocaleString('en-IN')} pieces
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      {dispatch.packets} packet(s) ×{' '}
                      {selectedDispatch.unitsPerPacket || 0} pieces
                    </p>
                  </div>
                )}

                <div>
                  <label className={labelClass} htmlFor="out-notes">
                    Notes (optional)
                  </label>
                  <textarea
                    id="out-notes"
                    className={inputClass}
                    rows={3}
                    placeholder="Delivery reference or details"
                    value={dispatch.notes}
                    onChange={(event) =>
                      setDispatch((previous) => ({
                        ...previous,
                        notes: event.target.value,
                      }))
                    }
                  />
                </div>

                <PrimaryButton
                  type="submit"
                  disabled={
                    submitting ||
                    !activeMaterials.length ||
                    !franchises.length
                  }
                >
                  <ArrowUpFromLine size={17} />
                  {submitting ? 'Dispatching...' : 'Dispatch Stock'}
                </PrimaryButton>
              </form>
            </div>

            <SideInfo kind="dispatch" />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="min-w-0 p-3 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-black">
                  Warehouse Transactions
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Review stock inward and dispatch activity.
                </p>
              </div>

              <input
                className={`${inputClass} sm:max-w-xs`}
                type="search"
                value={transactionSearch}
                onChange={(event) =>
                  setTransactionSearch(event.target.value)
                }
                placeholder="Search transactions"
              />
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-gray-600">
                Loading transactions...
              </p>
            ) : filteredTransactions.length === 0 ? (
              <EmptyState
                message={
                  transactions.length
                    ? 'No transactions match your search.'
                    : 'No warehouse transactions recorded yet.'
                }
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#ffeee7]">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-[#FFF0E8]">
                    <tr className="border-b border-[#E3422C]/20 text-xs uppercase tracking-wide text-gray-700">
                      {[
                        'Date',
                        'Material',
                        'Transaction',
                        'Packets',
                        'Pieces',
                        'Total Cost',
                        'Supplier / Franchise',
                        'Reference / Notes',
                      ].map((heading) => (
                        <th key={heading} className="px-4 py-4">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ffeee7]">
                    {filteredTransactions.map((item, index) => {
                      const isInward = String(item.transactionType || '')
                        .toUpperCase()
                        .includes('INWARD');

                      return (
                        <tr
                          key={item.id ?? index}
                          className="hover:bg-[#FFF9F5]"
                        >
                          <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-4 py-4 font-semibold text-black">
                            {item.materialName || '-'}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                isInward
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-[#FFF0E8] text-[#C93220]'
                              }`}
                            >
                              {item.transactionType || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {item.packets ?? '-'}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {item.pieces ?? '-'}
                          </td>
                          <td className="px-4 py-4 font-semibold text-black">
                            {money(item.totalCost)}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {item.supplierName || item.franchiseName || '-'}
                          </td>
                          <td className="max-w-[240px] px-4 py-4 text-gray-700">
                            <div
                              className="truncate"
                              title={item.referenceNumber || item.notes || ''}
                            >
                              {item.referenceNumber || item.notes || '-'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default WarehousePage;
