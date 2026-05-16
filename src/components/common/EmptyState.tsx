import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-slate-500" />
    </div>
    <h3 className="text-slate-300 font-semibold text-lg mb-2">{title}</h3>
    {description && <p className="text-slate-500 text-sm max-w-xs mb-6">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
