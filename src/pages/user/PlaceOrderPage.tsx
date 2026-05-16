import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { userApi, materialApi } from '../../api/services';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Material {
  id: number;
  name: string;
  category: string;
  brand: string;
  costPerItem: number;
  isActive: boolean;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

const PlaceOrderPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    materialApi.getAllMaterials()
      .then(r => setMaterials(r.data.data ?? []))
      .catch(() => toast.error('Failed to load materials'))
      .finally(() => setLoadingMaterials(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(materials.map(m => m.category)))];
  const filtered = categoryFilter === 'All' ? materials : materials.filter(m => m.category === categoryFilter);

  const addToCart = (material: Material) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === material.id);
      if (existing) return prev.map(c => c.id === material.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: material.id, name: material.name, price: material.costPerItem, quantity: 1, category: material.category }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const cartQty = (id: number) => cart.find(c => c.id === id)?.quantity || 0;
  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

   const placeOrder = async () => {
  if (cart.length === 0) return toast.error('Cart is empty');
  setPlacing(true);
  try {
    await userApi.createOrder({
      orderNotes: '',
      // items: cart.map(c => ({
      //   productId: String(c.id), // ✅ FIX HERE
      //   quantity: c.quantity
      // })),
      items: cart.map(c => ({
  materialId: c.id,
  quantity: c.quantity
}))
    });
    toast.success('Order placed successfully!');
    setCart([]);
    navigate('/dashboard/orders');
  } catch {
    toast.error('Failed to place order');
  } finally {
    setPlacing(false);
  }
};

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Place Order</h1>
          <p className="text-slate-400 text-sm mt-0.5">Select materials and quantities</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Materials */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  categoryFilter === cat
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loadingMaterials ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16">
              <ShoppingBag className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm">No materials available</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.map(material => {
                const qty = cartQty(material.id);
                return (
                  <div key={material.id} className="card-hover p-4 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-lg font-bold text-sky-400 flex-shrink-0">
                      {material.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{material.name}</p>
                      <p className="text-xs text-slate-500">{material.category} · {material.brand}</p>
                      <p className="text-sm font-bold text-sky-400 mt-1">₹{material.costPerItem}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {qty === 0 ? (
                        <button onClick={() => addToCart(material)} className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/20 text-sky-400 hover:bg-sky-500/25 transition-all">
                          <Plus className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(material.id, -1)} className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold text-white w-5 text-center">{qty}</span>
                          <button onClick={() => updateQty(material.id, 1)} className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/20 text-sky-400 hover:bg-sky-500/25 flex items-center justify-center transition-all">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="card overflow-hidden h-fit sticky top-24">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
            <ShoppingCart className="w-4 h-4 text-sky-400" />
            <h2 className="font-semibold text-white text-sm">Cart</h2>
            {cart.length > 0 && (
              <span className="ml-auto text-xs bg-sky-500 text-white px-2 py-0.5 rounded-full font-semibold">{cart.length}</span>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <ShoppingBag className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">₹{item.price} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-sm font-semibold text-white">₹{item.price * item.quantity}</span>
                      <button onClick={() => updateQty(item.id, -item.quantity)} className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Total</span>
                  <span className="text-lg font-bold text-white">₹{total}</span>
                </div>
                <button onClick={placeOrder} className="btn-primary w-full justify-center py-3" disabled={placing}>
                  {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShoppingBag className="w-4 h-4" /> Place Order</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceOrderPage;