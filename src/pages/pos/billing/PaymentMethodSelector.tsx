import React from 'react';
import { Banknote, Smartphone, CreditCard } from 'lucide-react';
import { PaymentMethod } from '../../../types/pos';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
  { value: 'CARD', label: 'Card', icon: CreditCard },
];

// Checkout Stage — Step 2: Payment Method selection.
// Invoice generation and save-bill are handled in a later phase (not implemented here).
export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  onSelect,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-6">
      <h2 className="text-white font-semibold text-lg mb-6">Payment Method</h2>

      <div className="grid grid-cols-3 gap-4">
        {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => {
          const isSelected = paymentMethod === value;
          return (
            <button
              key={value}
              onClick={() => onSelect(value)}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 py-8 px-4 transition-colors ${
                isSelected
                  ? 'border-sky-400 bg-sky-500/10 text-sky-400'
                  : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Icon className="w-8 h-8" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};