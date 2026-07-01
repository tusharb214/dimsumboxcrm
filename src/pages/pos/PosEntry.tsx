import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { posSetupApi } from '../../api/posServices';
import { BillingScreen } from './billing/BillingScreen';

// Franchise lands here after login. Decides: unfinished wizard -> /dashboard/pos/setup,
// completed setup -> Billing Screen directly. Single source of truth: PosSettings.setupCompleted.
export const PosEntry: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [setupCompleted, setSetupCompleted] = useState(false);

  useEffect(() => {
    posSetupApi
      .getSettings()
      .then((res: any) => setSetupCompleted(!!res.data?.data?.setupCompleted))
      .catch(() => setSetupCompleted(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading POS...</p>
      </div>
    );
  }

  if (!setupCompleted) {
    return <Navigate to="/dashboard/pos/setup" replace />;
  }

  return <BillingScreen />;
};