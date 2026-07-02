export interface PosSettings {
  id?: number;
  outletName?: string;
  address?: string;
  gstNumber?: string;
  contactNumber?: string;
  gstEnabled?: boolean;
  gstPercentage?: number;
  invoicePrefix?: string;
  invoiceFooter?: string;
  receiptTemplate?: string;
  paymentMethodsEnabled?: string;
  receiptPrinterConfig?: string;
  kitchenPrinterConfig?: string;
  setupCompleted?: boolean;
  setupCompletedAt?: string;
}

export interface RestaurantDetailsPayload {
  outletName: string;
  address: string;
  gstNumber?: string;
  contactNumber: string;
}

export interface BillingSettingsPayload {
  gstEnabled: boolean;
  gstPercentage: number;
  invoicePrefix: string;
  invoiceFooter?: string;
  receiptTemplate: string;
}

export interface RestaurantTablePayload {
  tableName: string;
  capacity: number;
}

export interface RestaurantTable {
  id: number;
  tableName: string;
  capacity: number;
  status: string;
  currentPosOrderId?: number;
}

 export interface FranchiseProduct {
  id: number;
  materialId?: number;
  name: string;
  category: string;
  brand?: string;
  sellingPrice: number;
  isAvailable: boolean;
  unitsPerPacket?: number;
  piecesPerPlate?: number;
  stockPieces?: number;
  lowStockThreshold?: number;
}

export interface UpdateFranchiseProductPayload {
  sellingPrice?: number;
  isAvailable?: boolean;
  piecesPerPlate?: number;
  lowStockThreshold?: number;
 

}
 export interface CreateFranchiseProductPayload {
  name: string;
  category?: string;
  sellingPrice: number;
  piecesPerPlate?: number;
  stockPieces?: number;
  lowStockThreshold?: number;
}
 // Billing cart line item — built from a real FranchiseProduct, never mock data.
// materialId is optional — franchise-created products (no admin Material link) won't have one.
export interface CartItem {
  productId: number;
  materialId?: number;
  name: string;
  category: string;
  sellingPrice: number;
  quantity: number;
}

// ─── BILLING: Customer Selection ───────────────────────────────────
export type CustomerType = 'WALK_IN' | 'EXISTING' | 'NEW';

export interface CustomerSuggestion {
  customerName: string;
  customerPhone: string;
}

export interface BillingCustomer {
  customerType: CustomerType;
  customerName: string;
  customerPhone: string;
}
export type OrderType = 'DINE_IN' | 'TAKE_AWAY' | 'DELIVERY';
// ─── BILLING: Payment Method ───────────────────────────────────────
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';

// ─── BILLING: Checkout / Payment ────────────────────────────────────
export interface PosCheckoutItem {
  productId: number;
  quantity: number;
}

export interface PosCheckoutPayload {
  items: PosCheckoutItem[];
  customerType: CustomerType;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  discountPercent: number;
  referenceNumber?: string;
  notes?: string;
}

export interface PosOrderItemResult {
  productId: number;
  name: string;
  quantity: number;
  priceAtSale: number;
  lineTotal: number;
}

export interface PosOrderResponse {
  id: number;
  invoiceNumber: string;
  orderType: OrderType;
  customerType: CustomerType;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  billDateTime: string;
  items: PosOrderItemResult[];
}