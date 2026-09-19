import React, { useState } from 'react';
import { posSetupApi } from '../../../../api/posServices';
import { FranchiseProduct } from '../../../../types/pos';

export const ImportProductsStep: React.FC<{ onFinish: () => void; onBack: () => void }> = ({ onFinish, onBack }) => {
  const [imported, setImported] = useState<FranchiseProduct[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await posSetupApi.importProducts();
      setImported(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to import products');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    setError('');
    try {
      await onFinish();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to complete setup');
      setFinishing(false);
    }
  };

     return (
    <div className="space-y-4">
      {!imported ? (
        <>
          <p className="text-slate-500 text-sm">
            This pulls every active product from your Materials catalog and sets an initial
            selling price (you can edit prices later in POS Settings).
          </p>
          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full bg-[#E3422C] hover:bg-[#c93a24] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Importing...' : 'Import Master Products'}
          </button>
        </>
      ) : (
        <div className="max-h-56 overflow-y-auto space-y-2">
          <p className="text-emerald-600 text-sm mb-2">{imported.length} products imported</p>
          {imported.map((p) => (
            <div key={p.id} className="flex flex-wrap justify-between gap-1 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm">
              <span className="text-black">{p.name}</span>
              <span className="text-slate-500">₹{p.sellingPrice}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-black font-medium py-2.5 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleFinish}
          disabled={!imported || finishing}
          className="flex-1 bg-[#E3422C] hover:bg-[#c93a24] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {finishing ? 'Finishing...' : 'Finish Setup'}
        </button>
      </div>
    </div>
  );
};