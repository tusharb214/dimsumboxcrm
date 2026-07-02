import apiClient from './client';
import {
  RestaurantDetailsPayload,
  BillingSettingsPayload,
  RestaurantTablePayload,
} from '../types/pos';

// ─── POS SETUP WIZARD ───────────────────────────────────────────────
export const posSetupApi = {
  getSettings: () =>
    apiClient.get('/pos/settings'),

  saveRestaurantDetails: (data: RestaurantDetailsPayload) =>
    apiClient.post('/pos/setup/restaurant-details', data),

  updateBillingSettings: (data: BillingSettingsPayload) =>
    apiClient.put('/pos/setup/billing-settings', data),

  updatePaymentMethods: (methods: string[]) =>
    apiClient.put('/pos/setup/payment-methods', { methods }),

  updatePrinterConfig: (receiptPrinterConfig: string, kitchenPrinterConfig: string) =>
    apiClient.put('/pos/setup/printers', { receiptPrinterConfig, kitchenPrinterConfig }),

  createTables: (tables: RestaurantTablePayload[]) =>
    apiClient.post('/pos/setup/tables', tables),

  importProducts: () =>
    apiClient.post('/pos/setup/import-products'),

  completeSetup: () =>
    apiClient.post('/pos/setup/complete'),
  getAllProducts: () =>
    apiClient.get('/pos/products'),

  updateProduct: (id: number, data: import('../types/pos').UpdateFranchiseProductPayload) =>
    apiClient.put(`/pos/products/${id}`, data),
  addCustomProduct: (data: import('../types/pos').CreateFranchiseProductPayload) =>
    apiClient.post('/pos/products', data),

  deleteProduct: (id: number) =>
    apiClient.delete(`/pos/products/${id}`),
};

 export const posBillingApi = {
  getProducts: () =>
    apiClient.get('/pos/billing/products'),

  getCategories: () =>
    apiClient.get('/pos/billing/categories'),

  searchCustomers: (query: string) =>
    apiClient.get('/pos/billing/customers', { params: { query } }),
   checkout: (payload: import('../types/pos').PosCheckoutPayload) =>
    apiClient.post('/pos/billing/checkout', payload),
   getOrderHistory: () =>
    apiClient.get('/pos/billing/orders'),
};