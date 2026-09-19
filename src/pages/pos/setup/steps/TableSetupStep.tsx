import React, { useState } from 'react';
import { posSetupApi } from '../../../../api/posServices';
import { RestaurantTablePayload } from '../../../../types/pos';

export const TableSetupStep: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [tables, setTables] = useState<RestaurantTablePayload[]>([
    { tableName: 'T1', capacity: 4 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addRow = () => setTables([...tables, { tableName: '', capacity: 4 }]);

  const updateRow = (index: number, field: keyof RestaurantTablePayload, value: string | number) => {
    const next = [...tables];
    next[index] = { ...next[index], [field]: value };
    setTables(next);
  };

  const removeRow = (index: number) => setTables(tables.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    const valid = tables.filter((t) => t.tableName.trim() !== '');
    if (valid.length === 0) {
      setError('Add at least one table');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await posSetupApi.createTables(valid);
      onNext();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create tables');
    } finally {
      setSaving(false);
    }
  };

     return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {tables.map((t, i) => (
          <div key={i} className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
            <input
              className="flex-1 min-w-[140px] bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-black placeholder-slate-400 focus:border-[#E3422C] focus:outline-none transition-colors"
              placeholder="Table name (e.g. T1)"
              value={t.tableName}
              onChange={(e) => updateRow(i, 'tableName', e.target.value)}
            />
            <input
              type="number"
              className="w-20 sm:w-24 bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-black placeholder-slate-400 focus:border-[#E3422C] focus:outline-none transition-colors"
              placeholder="Seats"
              value={t.capacity}
              onChange={(e) => updateRow(i, 'capacity', Number(e.target.value))}
            />
            <button
              onClick={() => removeRow(i)}
              className="text-slate-400 hover:text-red-600 px-2 flex-shrink-0"
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        type="button"
        className="text-[#E3422C] text-sm hover:text-[#c93a24] font-medium"
      >
        + Add another table
      </button>

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