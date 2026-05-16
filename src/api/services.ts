import apiClient from './client';
// import {
//   LoginPayload,
//   RegisterPayload,
//   AuthResponse,
//   CreateOrderPayload,
//   Order,
//   Kitchen,
//   CreateKitchenPayload,
//   User,
//   CreateUserPayload,
// } from '../types';
import {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  CreateOrderPayload,
  CreateKitchenPayload,
  CreateUserPayload,
} from '../types';

// ─── AUTH ─────────────────────────────────────────────────────────
export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', data),
};


// ─── USER ORDERS ──────────────────────────────────────────────────
export const userApi = {
  getMyOrders: () =>
    apiClient.get('/orders'),

  createOrder: (data: CreateOrderPayload) =>
    apiClient.post('/orders', data),

  confirmDelivery: (orderId: string) =>
    apiClient.put(`/orders/${orderId}/confirm-delivery`),

  getOrderById: (orderId: string) =>
    apiClient.get(`/orders/${orderId}`),
  resubmitOrder: (orderId: string, data: CreateOrderPayload) =>
  apiClient.put(`/orders/${orderId}/resubmit`, data),
};

// ─── MATERIALS (user + admin browse) ──────────────────────────────
export const materialApi = {
  getAllMaterials: () =>
    apiClient.get('/materials'),

  getByCategory: (category: string) =>
    apiClient.get(`/materials/category/${category}`),

  searchByName: (name: string) =>
    apiClient.get(`/materials/search?name=${encodeURIComponent(name)}`),

  getMaterialById: (id: string) =>
    apiClient.get(`/materials/${id}`),
};

// ─── ADMIN ────────────────────────────────────────────────────────
export const adminApi = {
  // Orders
  getAllOrders: () =>
    apiClient.get('/admin/orders'),

  getOrderById: (id: string) =>
    apiClient.get(`/admin/orders/${id}`),

  acceptOrder: (orderId: string) =>
    apiClient.put(`/admin/orders/${orderId}/accept`),

  rejectOrder: (orderId: string) =>
    apiClient.put(`/admin/orders/${orderId}/reject`),

  assignKitchenToOrder: (orderId: string, kitchenId: string) =>
    apiClient.put(`/admin/orders/${orderId}/assign`, { kitchenId }),

  markDelivered: (orderId: string) =>
    apiClient.put(`/admin/orders/${orderId}/deliver`),

  getOrderHistory: (orderId: string) =>
    apiClient.get(`/admin/orders/${orderId}/history`),

  // Materials
  addMaterial: (data: any) =>
    apiClient.post('/admin/materials', data),

  updateMaterial: (id: string, data: any) =>
    apiClient.put(`/admin/materials/${id}`, data),

  deleteMaterial: (id: string) =>
    apiClient.delete(`/admin/materials/${id}`),

  restoreMaterial: (id: string) =>
    apiClient.put(`/admin/materials/${id}/restore`),

  getAllMaterials: () =>
    apiClient.get('/admin/materials'),

  // Users
  createUser: (data: CreateUserPayload) =>
    apiClient.post('/admin/users', data),

  getAllUsers: () =>
    apiClient.get('/admin/users'),

  // Kitchens
  createKitchen: (data: CreateKitchenPayload) =>
    apiClient.post('/admin/kitchens', data),

  getAllKitchens: () =>
    apiClient.get('/admin/kitchens'),
};

// ─── KITCHEN ──────────────────────────────────────────────────────
export const kitchenApi = {
  getAssignedOrders: () =>
    apiClient.get('/kitchen/orders'),

  acceptOrder: (orderId: string) =>
    apiClient.put(`/kitchen/orders/${orderId}/accept`),

  markReady: (orderId: string) =>
    apiClient.put(`/kitchen/orders/${orderId}/ready`),
};

export const dashboardApi = {
  getAdminDashboard: () =>
    apiClient.get('/dashboard/admin'),

  getUserDashboard: () =>
    apiClient.get('/dashboard/user'),

  getKitchenDashboard: () =>
    apiClient.get('/dashboard/kitchen'),
};

export const salesApi = {
  logDailySales: (data: { reportDate: string; totalSales: number; totalOrders: number; itemsSold: string }) =>
    apiClient.post('/sales/daily', data),

  getToday: () =>
    apiClient.get('/sales/today'),

  getWeekly: () =>
    apiClient.get('/sales/weekly'),

  getMonthly: () =>
    apiClient.get('/sales/monthly'),
   getMySales: () =>
    apiClient.get('/sales'),
};
export const pdfApi = {
  downloadOrderPdf: (orderId: string) =>
    apiClient.get(`/pdf/order/${orderId}`, { responseType: 'blob' }),
};
export const orderMediaApi = {
  uploadScreenshot: (orderId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`/orders/${orderId}/screenshot`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
