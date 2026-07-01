import React from 'react';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { CartItem } from '../../../types/pos';

interface CartPanelProps {
  items: CartItem[];
  discountPercent: number;
  gstEnabled: boolean;
  gstPercentage: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  onIncrement: (productId: number) => void;
  onDecrement: (productId: number) => void;
  onRemove: (productId: number) => void;
  onDiscountChange: (value: number) => void;
  // onDiscountChange: (value: number) => void;
  onProceed: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  items,
  discountPercent,
  gstEnabled,
  gstPercentage,
  subtotal,
  discountAmount,
  taxAmount,
  grandTotal,
  onIncrement,
  onDecrement,
  onRemove,
  onDiscountChange,
  onProceed,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-5 h-5 text-sky-400" />
        <h2 className="text-white font-semibold">Cart</h2>
        {items.length > 0 && (
          <span className="ml-auto text-xs text-slate-400">
            {items.reduce((sum, i) => sum + i.quantity, 0)} item(s)
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-slate-500 text-sm flex-1">
          No items yet. Tap a product to add it to the cart.
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-slate-950 border border-slate-800 rounded-lg p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                  <p className="text-slate-500 text-xs">₹{item.sellingPrice.toFixed(2)} each</p>
                </div>
                <button
                  onClick={() => onRemove(item.productId)}
                  className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDecrement(item.productId)}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                    aria-label={`Decrease ${item.name} quantity`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-white text-sm w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onIncrement(item.productId)}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                    aria-label={`Increase ${item.name} quantity`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sky-400 text-sm font-semibold">
                  ₹{(item.sellingPrice * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-800 mt-4 pt-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-300">
          <label htmlFor="cart-discount" className="flex items-center gap-2">
            Discount
            <input
              id="cart-discount"
              type="number"
              min={0}
              max={100}
              value={discountPercent}
              onChange={(e) => {
                const val = Number(e.target.value);
                onDiscountChange(Number.isFinite(val) ? Math.min(Math.max(val, 0), 100) : 0);
              }}
              className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-xs"
            />
            <span className="text-xs text-slate-500">%</span>
          </label>
          <span>-₹{discountAmount.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>Tax{gstEnabled ? ` (GST ${gstPercentage}%)` : ''}</span>
          <span>₹{taxAmount.toFixed(2)}</span>
        </div>

        {/* <div className="flex items-center justify-between text-white font-semibold text-base pt-2 border-t border-slate-800">
          <span>Grand Total</span>
          <span className="text-sky-400">₹{grandTotal.toFixed(2)}</span>
        </div> */}
         <div className="flex items-center justify-between text-white font-semibold text-base pt-2 border-t border-slate-800">
          <span>Grand Total</span>
          <span className="text-sky-400">₹{grandTotal.toFixed(2)}</span>
        </div>

        <button
          onClick={onProceed}
          disabled={items.length === 0}
          className={`w-full mt-3 py-3 rounded-lg font-semibold text-sm transition-colors ${
            items.length === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-sky-500 text-white hover:bg-sky-600'
          }`}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};