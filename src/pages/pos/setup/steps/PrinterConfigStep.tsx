import React, { useState } from 'react';
import { posSetupApi } from '../../../../api/posServices';

export const PrinterConfigStep: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [receiptPrinterName, setReceiptPrinterName] = useState('');
  const [kitchenPrinterName, setKitchenPrinterName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      // Stored as JSON strings on the backend (pos_settings.receipt_printer_config / kitchen_printer_config).
      // Real IP/driver config can be added to this JSON later without a schema change.
      const receiptConfig = JSON.stringify({ name: receiptPrinterName || 'Not configured' });
      const kitchenConfig = JSON.stringify({ name: kitchenPrinterName || 'Not configured' });
      await posSetupApi.updatePrinterConfig(receiptConfig, kitchenConfig);
      onNext();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save printer settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-slate-400 text-sm mb-1 block">Receipt Printer</label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
          placeholder="e.g. Epson TM-T82 (Counter)"
          value={receiptPrinterName}
          onChange={(e) => setReceiptPrinterName(e.target.value)}
        />
      </div>
      <div>
        <label className="text-slate-400 text-sm mb-1 block">Kitchen Printer</label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
          placeholder="e.g. Epson TM-T82 (Kitchen)"
          value={kitchenPrinterName}
          onChange={(e) => setKitchenPrinterName(e.target.value)}
        />
      </div>
      <p className="text-slate-500 text-xs">
        You can skip this and configure printers later from POS Settings — it won't block setup.
      </p>

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