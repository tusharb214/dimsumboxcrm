import React from 'react';
import { Truck, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const KitchenDispatchPage: React.FC = () => (
  <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-white">Dispatch</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage order dispatching</p>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs text-amber-400">Backend Integration Pending</span>
      </div>
    </div>

    <div className="grid sm:grid-cols-3 gap-4">
      {[
        { label: 'Ready for Dispatch', count: 3, color: 'emerald', icon: CheckCircle },
        { label: 'Dispatched Today', count: 12, color: 'sky', icon: Truck },
        { label: 'Pending Dispatch', count: 5, color: 'amber', icon: Clock },
      ].map((s, i) => (
        <div key={i} className="card p-5 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${s.color}-500/10 border border-${s.color}-500/20`}>
            <s.icon className={`w-5 h-5 text-${s.color}-400`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{s.count}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5">
        <Truck className="w-5 h-5 text-sky-400" />
        <h2 className="font-semibold text-white">Dispatch Form</h2>
      </div>
      <div className="space-y-4 max-w-md">
        <div><label className="label">Order ID</label><input type="text" className="input-field" placeholder="ORD-2401" /></div>
        <div><label className="label">Driver Name</label><input type="text" className="input-field" placeholder="Driver name" /></div>
        <div><label className="label">Vehicle Number</label><input type="text" className="input-field" placeholder="MH-12-AB-1234" /></div>
        <div><label className="label">Estimated Delivery Time</label><input type="time" className="input-field" /></div>
        <button className="btn-primary"><Truck className="w-4 h-4" />Dispatch Order</button>
      </div>
      <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <p className="text-xs text-amber-400">Backend Integration Pending — this form is a UI placeholder</p>
      </div>
    </div>
  </div>
);

export const KitchenApprovalsPage: React.FC = () => (
  <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-white">Approval Requests</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage approval workflow</p>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs text-amber-400">Backend Integration Pending</span>
      </div>
    </div>

    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
        <Shield className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-white">Pending Approvals</h2>
        <span className="badge-warning ml-auto">3 pending</span>
      </div>
      <div className="divide-y divide-slate-800/60">
        {[
          { id: 'APR-001', type: 'Stock Replenishment', requested: 'Mozzarella Cheese - 50kg', requester: 'North Kitchen', time: '2h ago' },
          { id: 'APR-002', type: 'Special Order', requested: 'Bulk Pepperoni - 20kg', requester: 'Central Kitchen', time: '5h ago' },
          { id: 'APR-003', type: 'Return Request', requested: 'Damaged goods - Flour 10kg', requester: 'West Kitchen', time: '1d ago' },
        ].map(req => (
          <div key={req.id} className="px-5 py-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{req.type} <span className="font-mono text-xs text-slate-500">#{req.id}</span></p>
                <p className="text-xs text-slate-400 mt-0.5">{req.requested}</p>
                <p className="text-xs text-slate-600 mt-0.5">{req.requester} · {req.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">Approve</button>
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
