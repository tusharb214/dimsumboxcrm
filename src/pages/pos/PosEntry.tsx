 import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { posSetupApi } from '../../api/posServices';
import { BillingScreen } from './billing/BillingScreen';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';

const PosEntryContent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    posSetupApi
      .getSettings()
      .then((res: any) => setSetupCompleted(!!res.data?.data?.setupCompleted))
      .catch(() => setSetupCompleted(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff5f0] flex items-center justify-center">
        <p className="text-slate-500">{t('loading.pos')}</p>
      </div>
    );
  }

  if (!setupCompleted) {
    return <Navigate to="/dashboard/pos/setup" replace />;
  }

  return <BillingScreen />;
};

export const PosEntry: React.FC = () => (
  <LanguageProvider>
    <PosEntryContent />
  </LanguageProvider>
);