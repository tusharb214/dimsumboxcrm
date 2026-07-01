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
          <div key={i} className="flex gap-3 items-center">
            <input
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
              placeholder="Table name (e.g. T1)"
              value={t.tableName}
              onChange={(e) => updateRow(i, 'tableName', e.target.value)}
            />
            <input
              type="number"
              className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white"
              placeholder="Seats"
              value={t.capacity}
              onChange={(e) => updateRow(i, 'capacity', Number(e.target.value))}
            />
            <button
              onClick={() => removeRow(i)}
              className="text-slate-500 hover:text-red-400 px-2"
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
        className="text-sky-400 text-sm hover:text-sky-300"
      >
        + Add another table
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Next'}
        </button>
      </div>
    </div>
  );
};