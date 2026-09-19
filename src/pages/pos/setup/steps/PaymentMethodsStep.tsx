import React, { useState } from 'react';
import { posSetupApi } from '../../../../api/posServices';

const ALL_METHODS = ['CASH', 'UPI', 'CARD', 'ONLINE'];

export const PaymentMethodsStep: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [selected, setSelected] = useState<string[]>(['CASH', 'UPI']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (method: string) => {
    setSelected((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Select at least one payment method');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await posSetupApi.updatePaymentMethods(selected);
      onNext();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save payment methods');
    } finally {
      setSaving(false);
    }
  };

     return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {ALL_METHODS.map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => toggle(method)}
            className={`py-3 rounded-lg border font-medium transition-colors ${
              selected.includes(method)
                ? 'bg-[#E3422C] border-[#E3422C] text-white'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {method}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-black font-medium py-2.5 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-[#E3422C] hover:bg-[#c93a24] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Next'}
        </button>
      </div>
    </div>
  );
};