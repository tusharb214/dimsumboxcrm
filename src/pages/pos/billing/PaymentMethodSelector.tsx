 import React from 'react';
import { Banknote, Smartphone, CreditCard } from 'lucide-react';
import { PaymentMethod } from '../../../types/pos';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
  { value: 'CARD', label: 'Card', icon: CreditCard },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  onSelect,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 lg:p-6 mt-4 sm:mt-6">
      <h2 className="text-white font-semibold text-base sm:text-lg mb-4 sm:mb-6">
        Payment Method
      </h2>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => {
          const isSelected = paymentMethod === value;

          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              className={`
                flex flex-col items-center justify-center
                gap-1.5 sm:gap-2
                rounded-lg sm:rounded-xl
                border-2
                py-4 px-2
                sm:py-6 sm:px-3
                lg:py-8 lg:px-4
                transition-colors
                min-h-[90px] sm:min-h-[120px] lg:min-h-[150px]
                ${
                  isSelected
                    ? 'border-sky-400 bg-sky-500/10 text-sky-400'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                }
              `}
            >
              <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />

              <span className="text-xs sm:text-sm font-medium">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};