import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'sky' | 'emerald' | 'amber' | 'purple' | 'rose';
  pending?: boolean;
}

 const colorMap = {
  sky:     { bg: 'bg-sky-500/10',     icon: 'text-sky-400',    border: 'border-slate-700' },
  emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-slate-700' },
  amber:   { bg: 'bg-amber-500/10',   icon: 'text-amber-400',  border: 'border-slate-700' },
  purple:  { bg: 'bg-purple-500/10',  icon: 'text-purple-400', border: 'border-slate-700' },
  rose:    { bg: 'bg-rose-500/10',    icon: 'text-rose-400',   border: 'border-slate-700' },
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color = 'sky', pending }) => {
  const colors = colorMap[color];
  return (
    // <div className="stat-card relative overflow-hidden group hover:border-slate-700 transition-all duration-200">
    <div className="stat-card relative overflow-hidden group hover:border-slate-700 transition-all duration-200 p-4 rounded-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          {pending ? (
            <div className="skeleton h-7 w-24 rounded-lg mt-2" />
          ) : (
            <p className="text-xl font-bold text-black mt-1">{value}</p>
          )}
        </div>
        {/* <div className={`p-2.5 rounded-xl ${colors.bg} border ${colors.border}`}> */}
        <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${colors.bg} border ${colors.border}`}>
          <Icon className={`w-4 h-4 ${colors.icon}`} />
        </div>
      </div>
      {trend && !pending && (
        <div className="flex items-center gap-1.5 mt-1">
          {trend.value >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-slate-500">{trend.label}</span>
        </div>
      )}
      {pending && (
        <span className="absolute top-2 right-2 text-xs text-slate-600 font-mono">API pending</span>
      )}
    </div>
  );
};

export default StatCard;
