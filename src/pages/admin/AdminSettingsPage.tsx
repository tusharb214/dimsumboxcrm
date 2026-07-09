 import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, IndianRupee, Save, QrCode, Landmark, UploadCloud } from 'lucide-react';
import { adminApi } from '../../api/services';
import { getFileUrl } from '../../api/client';
import toast from 'react-hot-toast';

const AdminSettingsPage: React.FC = () => {
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [savingBankDetails, setSavingBankDetails] = useState(false);
  const [qrImagePath, setQrImagePath] = useState<string | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettings();
      const data = (res.data as any)?.data ?? res.data;
      setMinOrderAmount(String(data?.minOrderAmount ?? 0));
      setAccountNumber(data?.accountNumber ?? '');
      const handleSaveBankDetails = async () => {
    if (!ifscCode.trim()) return toast.error('Enter IFSC code');
    setSavingBankDetails(true);
    try {
      await adminApi.updateBankDetails({
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
        ifscCode: ifscCode.trim(),
      });
      toast.success('Bank details updated');
    } catch {
      toast.error('Failed to update bank details');
    } finally {
      setSavingBankDetails(false);
    }
  };
      setQrImagePath(data?.upiQrImagePath ?? null);
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

  const handleSaveAccountNumber = async () => {
    if (!accountNumber.trim()) return toast.error('Enter account number');
    setSavingPayment(true);
    try {
      await adminApi.updateAccountNumber(accountNumber.trim());
      toast.success('Account number updated');
    } catch {
      toast.error('Failed to update account number');
    } finally {
      setSavingPayment(false);
    }
  };


  const handleSaveBankDetails = async () => {
    if (!ifscCode.trim()) return toast.error('Enter IFSC code');
    setSavingBankDetails(true);
    try {
      await adminApi.updateBankDetails({
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
        ifscCode: ifscCode.trim(),
      });
      toast.success('Bank details updated');
    } catch {
      toast.error('Failed to update bank details');
    } finally {
      setSavingBankDetails(false);
    }
  };

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setQrFile(file);
    setQrPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleUploadQr = async () => {
    if (!qrFile) return toast.error('Choose a QR image first');
    setUploadingQr(true);
    try {
      const res = await adminApi.uploadUpiQr(qrFile);
      const data = (res.data as any)?.data ?? res.data;
      setQrImagePath(data?.upiQrImagePath ?? null);
      setQrFile(null);
      setQrPreview(null);
      toast.success('UPI QR updated');
    } catch {
      toast.error('Failed to upload QR image');
    } finally {
      setUploadingQr(false);
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

      {/* Payment Settings: UPI QR + Account Number, shown to franchise at checkout */}
      <div className="card p-5 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Payment Details (UPI)</h2>
            <p className="text-xs text-slate-500">Shown to franchise while placing an order</p>
          </div>
        </div>

        {loading ? (
          <div className="skeleton h-10 rounded-xl" />
        ) : (
          <div className="space-y-5">
            {/* Account number */}
            <div>
              <label className="label flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" /> Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="input-field"
                placeholder="e.g. 1234567890"
              />
              <button
                onClick={handleSaveAccountNumber}
                disabled={savingPayment}
                className="btn-secondary w-full justify-center mt-2 text-xs"
              >
                <Save className="w-3.5 h-3.5" /> {savingPayment ? 'Saving...' : 'Save Account Number'}
              </button>
            </div>
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <label className="label flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" /> Bank Details</label>
              <div>
                <label className="label text-xs">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={e => setAccountHolderName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Dim Sum Foods Pvt Ltd"
                />
              </div>
              <div>
                <label className="label text-xs">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. HDFC Bank"
                />
              </div>
              <div>
                <label className="label text-xs">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={e => setIfscCode(e.target.value.toUpperCase())}
                  className="input-field"
                  placeholder="e.g. HDFC0001234"
                />
              </div>
              <button
                onClick={handleSaveBankDetails}
                disabled={savingBankDetails}
                className="btn-secondary w-full justify-center text-xs"
              >
                <Save className="w-3.5 h-3.5" /> {savingBankDetails ? 'Saving...' : 'Save Bank Details'}
              </button>
            </div>

            {/* QR image */}
            <div className="border-t border-slate-800 pt-4">
              <label className="label">UPI QR Code</label>

              {qrImagePath && !qrPreview && (
                <img
                  src={getFileUrl(qrImagePath)}
                  alt="Current UPI QR"
                  className="w-40 h-40 object-contain rounded-xl border border-slate-700 bg-white mb-3"
                />
              )}
              {qrPreview && (
                <img
                  src={qrPreview}
                  alt="New UPI QR preview"
                  className="w-40 h-40 object-contain rounded-xl border border-sky-500/40 bg-white mb-3"
                />
              )}
              {!qrImagePath && !qrPreview && (
                <p className="text-xs text-slate-500 mb-3">No QR uploaded yet.</p>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleQrFileChange}
                className="text-xs text-slate-400 mb-2 w-full"
              />
              <button
                onClick={handleUploadQr}
                disabled={uploadingQr || !qrFile}
                className="btn-primary w-full justify-center text-xs"
              >
                <UploadCloud className="w-3.5 h-3.5" /> {uploadingQr ? 'Uploading...' : 'Upload / Replace QR'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;