 import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { posBillingApi, posSetupApi } from '../../../api/posServices';
import { CartItem, FranchiseProduct } from '../../../types/pos';
import { CategoryTabs } from './CategoryTabs';
import { ProductGrid } from './ProductGrid';
import { CartPanel } from './CartPanel';
import { CustomerSelector } from './CustomerSelector';
// import { BillingCustomer } from '../../../types/pos';
//  import { BillingCustomer, OrderType, PaymentMethod } from '../../../types/pos';
import { BillingCustomer, OrderType, PaymentMethod, PosOrderResponse } from '../../../types/pos';
import { OrderTypeSelector } from './OrderTypeSelector';
import { PaymentMethodSelector } from './PaymentMethodSelector';

// Billing Screen — Product Categories + Product Grid + Cart, all backed by real DB data.
// Search, payment, and order placement land in later features.
export const BillingScreen: React.FC = () => {
  const [products, setProducts] = useState<FranchiseProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [gstEnabled, setGstEnabled] = useState<boolean>(false);
  const [gstPercentage, setGstPercentage] = useState<number>(0);
  // Customer selection state
  const [customer, setCustomer] = useState<BillingCustomer>({
    customerType: 'WALK_IN',
    customerName: '',
    customerPhone: '',
  });
  // Checkout stage state — controls Cart vs Order-Type screen
//  const [stage, setStage] = useState<'CART' | 'CHECKOUT'>('CART');
const [stage, setStage] =
  useState<'CART' | 'CHECKOUT' | 'RECEIPT'>('CART');
const [orderType, setOrderType] = useState<OrderType | null>(null);
const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
const [processingPayment, setProcessingPayment] = useState(false);
const [completedOrder, setCompletedOrder] = useState<PosOrderResponse | null>(null);

const handleProceedToCheckout = () => {
  if (cartItems.length === 0) {
    toast.error('Cart is empty');
    return;
  }
  setStage('CHECKOUT');
};

const handleBackToCart = () => {
  setStage('CART');
};

const handleSelectOrderType = (type: OrderType) => {
  setOrderType(type);
};

const handleSelectPaymentMethod = (method: PaymentMethod) => {
  setPaymentMethod(method);
};

 // Validates payment, calls checkout API — saves order/items/payment, auto-updates
// Daily Sales + Dashboard + Notifications on the backend.
const handleCompletePayment = async () => {
  if (cartItems.length === 0) {
    toast.error('Cart is empty');
    return;
  }
  if (!orderType) {
    toast.error('Please select an order type');
    return;
  }
  if (!paymentMethod) {
    toast.error('Please select a payment method');
    return;
  }
  if (customer.customerType !== 'WALK_IN' && !customer.customerPhone.trim()) {
    toast.error('Please enter customer phone number');
    return;
  }

  try {
    setProcessingPayment(true);
    const payload = {
      items: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      customerType: customer.customerType,
      customerName: customer.customerName,
      customerPhone: customer.customerPhone,
      orderType,
      paymentMethod,
      discountPercent,
    };
    const res = await posBillingApi.checkout(payload as any);
    const order: PosOrderResponse = res.data?.data;
    setCompletedOrder(order);
    toast.success(`Payment received — Invoice ${order.invoiceNumber} generated`);
    setStage('RECEIPT');
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Payment failed. Please try again.');
  } finally {
    setProcessingPayment(false);
  }
};

const handleNewOrder = () => {
  setCartItems([]);
  setDiscountPercent(0);
  setCustomer({ customerType: 'WALK_IN', customerName: '', customerPhone: '' });
  setOrderType(null);
  setPaymentMethod(null);
  setCompletedOrder(null);
  setStage('CART');
};
  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, settingsRes] = await Promise.all([
        posBillingApi.getProducts(),
        posBillingApi.getCategories(),
        posSetupApi.getSettings(),
      ]);
      setProducts(productsRes.data?.data || []);
      setCategories(categoriesRes.data?.data || []);
      const settings = settingsRes.data?.data;
      setGstEnabled(!!settings?.gstEnabled);
      setGstPercentage(settings?.gstPercentage || 0);
    } catch (err) {
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const visibleProducts =
    activeCategory === 'ALL'
      ? products
      : products.filter((p) => p.category === activeCategory);

  // ─── Cart handlers ────────────────────────────────────────────────
  const handleAddToCart = (product: FranchiseProduct) => {
    if (!product.isAvailable) {
      toast.error(`${product.name} is currently unavailable`);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          materialId: product.materialId,
          name: product.name,
          category: product.category,
          sellingPrice: product.sellingPrice,
          quantity: 1,
        },
      ];
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleIncrement = (productId: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecrement = (productId: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // ─── Cart totals ──────────────────────────────────────────────────
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0),
    [cartItems]
  );

  const discountAmount = useMemo(
    () => (subtotal * discountPercent) / 100,
    [subtotal, discountPercent]
  );

  const taxableAmount = subtotal - discountAmount;

  const taxAmount = useMemo(
    () => (gstEnabled ? (taxableAmount * gstPercentage) / 100 : 0),
    [gstEnabled, gstPercentage, taxableAmount]
  );

  const grandTotal = taxableAmount + taxAmount;

 
 
     return (
    <div className="min-h-screen bg-[#fff5f0] p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-black mb-4">Billing</h1>

      {stage === 'CART' && (
        <>
          <CustomerSelector customer={customer} onChange={setCustomer} />

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <CategoryTabs
                categories={categories}
                activeCategory={activeCategory}
                onSelect={setActiveCategory}
              />

              <ProductGrid
                products={visibleProducts}
                loading={loading}
                onSelectProduct={handleAddToCart}
              />
            </div>

            <div className="w-full lg:w-96 shrink-0">
              <CartPanel
                items={cartItems}
                discountPercent={discountPercent}
                gstEnabled={gstEnabled}
                gstPercentage={gstPercentage}
                subtotal={subtotal}
                discountAmount={discountAmount}
                taxAmount={taxAmount}
                grandTotal={grandTotal}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onRemove={handleRemoveFromCart}
                onDiscountChange={setDiscountPercent}
                onProceed={handleProceedToCheckout}
              />
            </div>
          </div>
        </>
      )}

       {stage === 'CHECKOUT' && (
  <>
    <OrderTypeSelector
      orderType={orderType}
      onSelect={handleSelectOrderType}
      onBack={handleBackToCart}
    />

    <PaymentMethodSelector
      paymentMethod={paymentMethod}
      onSelect={handleSelectPaymentMethod}
    />
   <button
      onClick={handleCompletePayment}
      disabled={cartItems.length === 0 || !orderType || !paymentMethod || processingPayment}
      className={`w-full mt-6 py-4 rounded-lg font-semibold text-base transition-colors ${
        cartItems.length === 0 || !orderType || !paymentMethod || processingPayment
          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
          : 'bg-emerald-500 text-white hover:bg-emerald-600'
      }`}
    >
      {processingPayment ? 'Processing...' : 'Complete Payment'}
    </button>
  </>
)}

{stage === 'RECEIPT' && completedOrder && (
  <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 max-w-md mx-auto text-center shadow-sm">
    <h2 className="text-emerald-600 text-lg font-semibold mb-2">Payment Successful</h2>
    <p className="text-slate-500 text-sm mb-4">Invoice Generated</p>

    <div className="bg-slate-50 rounded-lg p-4 text-left text-sm text-slate-600 space-y-1 mb-4">
      <div className="flex justify-between"><span>Invoice No.</span><span className="text-black">{completedOrder.invoiceNumber}</span></div>
      <div className="flex justify-between"><span>Order Type</span><span className="text-black">{completedOrder.orderType}</span></div>
      <div className="flex justify-between"><span>Payment Method</span><span className="text-black">{completedOrder.paymentMethod}</span></div>
      <div className="flex justify-between"><span>Date & Time</span><span className="text-black">{new Date(completedOrder.billDateTime).toLocaleString()}</span></div>
      <div className="flex justify-between font-semibold pt-2 border-t border-slate-200"><span>Grand Total</span><span className="text-emerald-600">₹{completedOrder.totalAmount.toFixed(2)}</span></div>
    </div>

    <button
      onClick={handleNewOrder}
      className="w-full py-3 rounded-lg font-semibold bg-[#E3422C] text-white hover:bg-[#c93a24] transition-colors"
    >
      New Order
    </button>
  </div>
)}
    </div>
  );
};