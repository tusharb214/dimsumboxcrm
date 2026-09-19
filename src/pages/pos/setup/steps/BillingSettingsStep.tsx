import React, { useState } from 'react';
import { posSetupApi } from '../../../../api/posServices';

export const BillingSettingsStep: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [form, setForm] = useState({
    gstEnabled: false,
    gstPercentage: 5,
    invoicePrefix: 'INV-',
    invoiceFooter: '',
    receiptTemplate: 'STANDARD',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      await posSetupApi.updateBillingSettings(form);
      onNext();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save billing settings');
    } finally {
      setSaving(false);
    }
  };

   return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 text-black">
        <input
          type="checkbox"
          checked={form.gstEnabled}
          onChange={(e) => setForm({ ...form, gstEnabled: e.target.checked })}
          className="w-4 h-4 accent-[#E3422C]"
        />
        Enable GST on bills
      </label>

      {form.gstEnabled && (
        <input
          type="number"
          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-black placeholder-slate-400 focus:border-[#E3422C] focus:outline-none transition-colors"
          placeholder="GST %"
          value={form.gstPercentage}
          onChange={(e) => setForm({ ...form, gstPercentage: Number(e.target.value) })}
        />
      )}

      <input
        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-black placeholder-slate-400 focus:border-[#E3422C] focus:outline-none transition-colors"
        placeholder="Invoice Prefix (e.g. PUN-)"
        value={form.invoicePrefix}
        onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
      />

      <textarea
        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-black placeholder-slate-400 focus:border-[#E3422C] focus:outline-none transition-colors"
        placeholder="Invoice Footer (e.g. 'Thank you, visit again!')"
        value={form.invoiceFooter}
        onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })}
      />

      <select
        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-black focus:border-[#E3422C] focus:outline-none transition-colors"
        value={form.receiptTemplate}
        onChange={(e) => setForm({ ...form, receiptTemplate: e.target.value })}
      >
        <option value="STANDARD">Standard Receipt</option>
        <option value="COMPACT">Compact Receipt</option>
      </select>

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