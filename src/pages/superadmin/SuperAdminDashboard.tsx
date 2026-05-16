import React from 'react';
import { Globe, Shield, DollarSign, TrendingUp, Users, Building2, BarChart3, Clock, FileText } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/common/StatCard';

const revenueData = [
  { month: 'Jan', revenue: 145000 }, { month: 'Feb', revenue: 192000 },
  { month: 'Mar', revenue: 171000 }, { month: 'Apr', revenue: 228000 },
  { month: 'May', revenue: 209000 }, { month: 'Jun', revenue: 284000 },
];

const franchiseData = [
  { name: 'Pune', orders: 340 }, { name: 'Mumbai', orders: 520 },
  { name: 'Delhi', orders: 290 }, { name: 'Bangalore', orders: 410 },
  { name: 'Hyderabad', orders: 230 },
];

const tt = { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' };

const FRANCHISES = [
  { name: 'Pune Central', admin: 'Rajesh Kumar', status: 'ACTIVE', revenue: '₹2.4L', orders: 340 },
  { name: 'Mumbai Hub', admin: 'Priya Sharma', status: 'ACTIVE', revenue: '₹4.1L', orders: 520 },
  { name: 'Delhi North', admin: 'Amit Singh', status: 'INACTIVE', revenue: '₹1.8L', orders: 290 },
];

const SuperAdminDashboard: React.FC = () => (
  <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-white">Super Admin</h1>
        <p className="text-slate-400 text-sm mt-0.5">Global franchise network overview</p>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs text-amber-400">Backend Integration Pending — Static Data</span>
      </div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Franchises" value={12} icon={Building2} color="sky" trend={{ value: 2, label: 'new this month' }} />
      <StatCard title="Total Revenue" value="₹28.4L" icon={DollarSign} color="emerald" trend={{ value: 15, label: 'vs last month' }} />
      <StatCard title="Active Admins" value={18} icon={Shield} color="purple" />
      <StatCard title="Global Orders" value={1840} icon={TrendingUp} color="amber" trend={{ value: 9, label: 'this week' }} />
    </div>

    <div className="grid lg:grid-cols-2 gap-5">
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Global Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt} />
            <Area type="monotone" dataKey="revenue" stroke="#a855f7" fill="url(#g)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Orders by Franchise</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={franchiseData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt} />
            <Bar dataKey="orders" fill="#0ea5e9" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-white">Franchise Monitoring</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900/50">
            <tr>
              <th className="table-th">Franchise</th>
              <th className="table-th">Admin</th>
              <th className="table-th">Status</th>
              <th className="table-th">Revenue</th>
              <th className="table-th">Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {FRANCHISES.map((f, i) => (
              <tr key={i} className="hover:bg-white/2 transition-colors">
                <td className="table-td font-medium text-white">{f.name}</td>
                <td className="table-td text-slate-400">{f.admin}</td>
                <td className="table-td">
                  <span className={f.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}>{f.status}</span>
                </td>
                <td className="table-td font-semibold text-emerald-400">{f.revenue}</td>
                <td className="table-td">{f.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Sub pages
export const SuperAdminAnalyticsPage: React.FC = () => (
  <div className="space-y-5">
    <div>
      <h1 className="text-xl font-bold text-white">Global Analytics</h1>
      <p className="text-slate-400 text-sm mt-0.5">Network-wide performance metrics</p>
    </div>
    <div className="card p-6 text-center">
      <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
      <p className="text-slate-400 font-medium">Full analytics dashboard</p>
      <p className="text-xs text-slate-600 mt-1">Backend Integration Pending</p>
    </div>
  </div>
);

export const SuperAdminFranchisesPage: React.FC = () => (
  <div className="space-y-5">
    <h1 className="text-xl font-bold text-white">Franchise Management</h1>
    <div className="card p-6 text-center">
      <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
      <p className="text-slate-400 font-medium">Franchise management panel</p>
      <p className="text-xs text-slate-600 mt-1">Backend Integration Pending</p>
    </div>
  </div>
);

export const SuperAdminAdminsPage: React.FC = () => (
  <div className="space-y-5">
    <h1 className="text-xl font-bold text-white">Admin Management</h1>
    <div className="card p-6 text-center">
      <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
      <p className="text-slate-400 font-medium">Admin management panel</p>
      <p className="text-xs text-slate-600 mt-1">Backend Integration Pending</p>
    </div>
  </div>
);

export const SuperAdminRevenuePage: React.FC = () => (
  <div className="space-y-5">
    <h1 className="text-xl font-bold text-white">Revenue Overview</h1>
    <div className="card p-6 text-center">
      <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
      <p className="text-slate-400 font-medium">Revenue analytics panel</p>
      <p className="text-xs text-slate-600 mt-1">Backend Integration Pending</p>
    </div>
  </div>
);

export const SuperAdminReportsPage: React.FC = () => (
  <div className="space-y-5">
    <h1 className="text-xl font-bold text-white">Global Reports</h1>
    <div className="card p-6 text-center">
      <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
      <p className="text-slate-400 font-medium">Global reports panel</p>
      <p className="text-xs text-slate-600 mt-1">Backend Integration Pending</p>
    </div>
  </div>
);

export default SuperAdminDashboard;
