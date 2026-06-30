import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, IndianRupee, Save } from 'lucide-react';
import { adminApi } from '../../api/services';
import toast from 'react-hot-toast';

const AdminSettingsPage: React.FC = () => {
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettings();
      const data = (res.data as any)?.data ?? res.data;
      setMinOrderAmount(String(data?.minOrderAmount ?? 0));
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    const value = Number(minOrderAmount);
    if (Number.isNaN(value) || value < 0)
      return toast.error('Enter a valid amount');

    setSaving(true);
    try {
      await adminApi.updateMinOrderAmount(value);
      toast.success('Minimum order amount updated');
    } catch {
      toast.error('Failed to update minimum order amount');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Configure ordering rules for franchises</p>
      </div>

      <div className="card p-5 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Minimum Order Amount</h2>
            <p className="text-xs text-slate-500">Franchises cannot place an order below this total</p>
          </div>
        </div>

        {loading ? (
          <div className="skeleton h-10 rounded-xl" />
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label">Minimum Order Amount (₹)</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  value={minOrderAmount}
                  onChange={e => setMinOrderAmount(e.target.value)}
                  className="input-field pl-9"
                  placeholder="e.g. 500"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Set to 0 to disable the minimum order limit.</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full justify-center"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;