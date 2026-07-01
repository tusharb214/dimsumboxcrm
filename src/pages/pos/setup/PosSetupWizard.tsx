import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { posSetupApi } from '../../../api/posServices';
import { RestaurantDetailsStep } from './steps/RestaurantDetailsStep';
import { BillingSettingsStep } from './steps/BillingSettingsStep';
import { PaymentMethodsStep } from './steps/PaymentMethodsStep';
import { PrinterConfigStep } from './steps/PrinterConfigStep';
import { TableSetupStep } from './steps/TableSetupStep';
import { ImportProductsStep } from './steps/ImportProductsStep';

const STEPS = [
  'Restaurant Details',
  'Billing Settings',
  'Payment Methods',
  'Printer Setup',
  'Table Setup',
  'Import Products',
];

export const PosSetupWizard: React.FC = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const finishSetup = async () => {
    await posSetupApi.completeSetup();
    navigate('/dashboard/pos');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 p-8">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  i <= step ? 'bg-sky-500' : 'bg-slate-800'
                }`}
              />
            </div>
          ))}
        </div>
        <p className="text-slate-400 text-sm mb-1">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className="text-xl font-semibold text-white mb-6">{STEPS[step]}</h2>

        {step === 0 && <RestaurantDetailsStep onNext={goNext} />}
        {step === 1 && <BillingSettingsStep onNext={goNext} onBack={goBack} />}
        {step === 2 && <PaymentMethodsStep onNext={goNext} onBack={goBack} />}
        {step === 3 && <PrinterConfigStep onNext={goNext} onBack={goBack} />}
        {step === 4 && <TableSetupStep onNext={goNext} onBack={goBack} />}
        {step === 5 && <ImportProductsStep onFinish={finishSetup} onBack={goBack} />}
      </div>
    </div>
  );
};