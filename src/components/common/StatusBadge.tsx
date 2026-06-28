 import React from 'react';
import { OrderStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus | string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Order statuses
  REQUESTED:        { label: 'Requested',       className: 'badge-warning' },
  ACCEPTED:         { label: 'Accepted',         className: 'badge-info' },
  ASSIGNED:         { label: 'Assigned',         className: 'badge-info' },
  PREPARING:        { label: 'Preparing',        className: 'badge-purple' },
  READY:            { label: 'Ready',            className: 'badge-success' },
  APPROVAL_PENDING: { label: 'Admin Approved ✓', className: 'badge-success' },
  DISPATCHED:       { label: 'Dispatched',       className: 'badge-info' },
  DELIVERED:        { label: 'Delivered',        className: 'badge-success' },
  COMPLETED:        { label: 'Completed',        className: 'badge-success' },
  REJECTED:         { label: 'Rejected',         className: 'badge-danger' },
  CANCELLED:        { label: 'Cancelled',        className: 'badge-danger' },
  // User/Kitchen statuses
  PENDING:          { label: 'Pending',          className: 'badge-warning' },
  ACTIVE:           { label: 'Active',           className: 'badge-success' },
  INACTIVE:         { label: 'Inactive',         className: 'badge-neutral' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || { label: status, className: 'badge-neutral' };
  return <span className={config.className}>{config.label}</span>;
};

export default StatusBadge;