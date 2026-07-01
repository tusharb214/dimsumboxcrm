 import React from 'react';
import { Utensils, ShoppingBag, ArrowLeft } from 'lucide-react';
import { OrderType } from '../../../types/pos';

interface OrderTypeSelectorProps {
  orderType: OrderType | null;
  onSelect: (type: OrderType) => void;
  onBack: () => void;
}

const ORDER_TYPES: { value: OrderType; label: string; icon: React.ElementType }[] = [
  { value: 'DINE_IN', label: 'Dine In', icon: Utensils },
  { value: 'TAKE_AWAY', label: 'Take Away', icon: ShoppingBag },
];

// Checkout Stage — Step 1: Order Type selection.
// Payment method selection follows in the same Checkout stage (see PaymentMethodSelector).
// Invoice generation and save-bill are handled in a later phase (not implemented here).
export const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({
  orderType,
  onSelect,
  onBack,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
          aria-label="Back to cart"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>
        <h2 className="text-white font-semibold text-lg ml-2">Order Type</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {ORDER_TYPES.map(({ value, label, icon: Icon }) => {
          const isSelected = orderType === value;
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