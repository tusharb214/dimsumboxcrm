import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Eye, EyeOff, CheckCircle, Clock } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password === form.confirm) setDone(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 gradient-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500 shadow-xl shadow-sky-500/30 mb-4">
            <Boxes className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">New password</h1>
          <p className="text-slate-400 text-sm mt-1">Choose a strong password</p>
        </div>

        <div className="card p-6 shadow-2xl shadow-black/40">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5">
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-400">Backend Integration Pending — UI preview only</p>
          </div>

          {done ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Password reset!</h3>
              <p className="text-slate-400 text-sm mb-5">Your password has been updated successfully.</p>
              <Link to="/login" className="btn-primary justify-center">Go to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" className="input-field pr-10" required minLength={8} />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" value={form.confirm} onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" className="input-field" required />
                {form.confirm && form.password !== form.confirm && (
                  <p className="text-xs text-rose-400 mt-1">Passwords do not match</p>
                )}
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-3" disabled={form.password !== form.confirm || !form.password}>
                Reset Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
