import React, { useEffect, useRef, useState } from 'react';
import { User, UserCheck, UserPlus, Search } from 'lucide-react';
import { posBillingApi } from '../../../api/posServices';
import { BillingCustomer, CustomerSuggestion, CustomerType } from '../../../types/pos';

interface CustomerSelectorProps {
  customer: BillingCustomer;
  onChange: (customer: BillingCustomer) => void;
}

const TYPE_OPTIONS: { value: CustomerType; label: string; icon: React.ReactNode }[] = [
  { value: 'WALK_IN', label: 'Walk-in', icon: <User className="w-3.5 h-3.5" /> },
  { value: 'EXISTING', label: 'Existing', icon: <UserCheck className="w-3.5 h-3.5" /> },
  { value: 'NEW', label: 'New', icon: <UserPlus className="w-3.5 h-3.5" /> },
];

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({ customer, onChange }) => {
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (customer.customerType !== 'EXISTING' || customer.customerPhone.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await posBillingApi.searchCustomers(customer.customerPhone.trim());
        setSuggestions(res.data?.data || []);
      } catch {
        setSuggestions([]);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.customerPhone, customer.customerType]);

  const handleTypeChange = (type: CustomerType) => {
    onChange({
      customerType: type,
      customerName: type === 'WALK_IN' ? '' : customer.customerName,
      customerPhone: type === 'WALK_IN' ? '' : customer.customerPhone,
    });
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (s: CustomerSuggestion) => {
    onChange({ ...customer, customerName: s.customerName || '', customerPhone: s.customerPhone });
    setShowSuggestions(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleTypeChange(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              customer.customerType === opt.value
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      {customer.customerType !== 'WALK_IN' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              placeholder="Phone number"
              value={customer.customerPhone}
              onChange={(e) => {
                onChange({ ...customer, customerPhone: e.target.value });
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />

            {customer.customerType === 'EXISTING' && showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((s) => (
                  <button
                    key={s.customerPhone}
                    onMouseDown={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <span className="font-medium">{s.customerName || 'Unnamed'}</span>
                    <span className="text-slate-500 ml-2">{s.customerPhone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Customer name"
            value={customer.customerName}
            onChange={(e) => onChange({ ...customer, customerName: e.target.value })}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
          />
        </div>
      )}
    </div>
  );
};