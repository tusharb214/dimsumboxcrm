import React, { useState } from 'react';
import { posSetupApi } from '../../../../api/posServices';

export const RestaurantDetailsStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [form, setForm] = useState({ outletName: '', address: '', gstNumber: '', contactNumber: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.outletName || !form.address || !form.contactNumber) {
      setError('Outlet name, address, and contact number are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await posSetupApi.saveRestaurantDetails(form);
      onNext();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
        placeholder="Outlet Name"
        value={form.outletName}
        onChange={(e) => setForm({ ...form, outletName: e.target.value })}
      />
      <textarea
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
        placeholder="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
      <input
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
        placeholder="GST Number (optional)"
        value={form.gstNumber}
        onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
      />
      <input
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
        placeholder="Contact Number"
        value={form.contactNumber}
        onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
      >
        {saving ? 'Saving...' : 'Next'}
      </button>
    </div>
  );
};