export type UserRole = 'USER' | 'ADMIN' | 'KITCHEN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// export type OrderStatus = 
//   | 'PENDING'
//   | 'ASSIGNED'
//   | 'PREPARING'
//   | 'READY'
//   | 'DISPATCHED'
//   | 'DELIVERED'
//   | 'CANCELLED';
export type OrderStatus = 
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'ASSIGNED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'REJECTED';

 export interface OrderItem {
  id?: number;
  materialId: number;
  materialName: string;
  category?: string;
  brand?: string;
  quantity: number;
  priceAtOrder?: number;
  price?: number;
  lineTotal?: number;
}

export interface Order {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  kitchenId?: string;
  kitchenName?: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  orderNotes?: string;
  screenshotPath?: string;
  createdAt: string;
  updatedAt?: string;
}

// export interface CreateOrderPayload {
//   items: { productId: string; quantity: number }[];
// }
export interface CreateOrderPayload {
  orderNotes?: string; 
  items: {
    materialId: number;  
    quantity: number;
  }[];
}

export interface Kitchen {
  id: string;
  name: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE';
  assignedOrders?: number;
  createdAt: string;
}

export interface CreateKitchenPayload {
  name: string;
  location: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  image?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}
