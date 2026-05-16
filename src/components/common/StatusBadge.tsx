import React from 'react';
import { OrderStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus | string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING:    { label: 'Pending',    className: 'badge-warning' },
  ASSIGNED:   { label: 'Assigned',   className: 'badge-info' },
  PREPARING:  { label: 'Preparing',  className: 'badge-purple' },
  READY:      { label: 'Ready',      className: 'badge-success' },
  DISPATCHED: { label: 'Dispatched', className: 'badge-info' },
  DELIVERED:  { label: 'Delivered',  className: 'badge-success' },
  CANCELLED:  { label: 'Cancelled',  className: 'badge-danger' },
  ACTIVE:     { label: 'Active',     className: 'badge-success' },
  INACTIVE:   { label: 'Inactive',   className: 'badge-neutral' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || { label: status, className: 'badge-neutral' };
  return <span className={config.className}>{config.label}</span>;
};

export default StatusBadge;
