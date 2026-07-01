 import React from 'react';
import { FranchiseProduct } from '../../../types/pos';

interface ProductGridProps {
  products: FranchiseProduct[];
  loading: boolean;
  onSelectProduct: (product: FranchiseProduct) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, loading, onSelectProduct }) => {
  if (loading) {
    return <p className="text-slate-400">Loading products...</p>;
  }

  if (products.length === 0) {
    return <p className="text-slate-400">No products available. Import products from POS setup.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => onSelectProduct(product)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectProduct(product);
          }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-sky-500 active:scale-[0.97] transition-all select-none"
        >
          <p className="text-white font-medium truncate">{product.name}</p>
          <p className="text-slate-500 text-xs mt-1">{product.category}</p>
          <p className="text-sky-400 font-semibold mt-2">₹{product.sellingPrice.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
};