import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import UserDashboard from './pages/user/UserDashboard';
import MyOrdersPage from './pages/user/MyOrdersPage';
import PlaceOrderPage from './pages/user/PlaceOrderPage';
import UserAnalyticsPage from './pages/user/UserAnalyticsPage';
import NotificationsPage from './pages/user/NotificationsPage';
import DailySalesPage from './pages/user/DailySalesPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminKitchensPage from './pages/admin/AdminKitchensPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';

import KitchenDashboard from './pages/kitchen/KitchenDashboard';
import { KitchenDispatchPage, KitchenApprovalsPage } from './pages/kitchen/KitchenSubPages';

import SuperAdminDashboard, {
  SuperAdminAnalyticsPage,
  SuperAdminFranchisesPage,
  SuperAdminAdminsPage,
  SuperAdminRevenuePage,
  SuperAdminReportsPage,
} from './pages/superadmin/SuperAdminDashboard';

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Sora, sans-serif',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['USER']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<UserDashboard />} />
          <Route path="orders" element={<MyOrdersPage />} />
          <Route path="order" element={<PlaceOrderPage />} />
          <Route path="analytics" element={<UserAnalyticsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="/dashboard/sales" element={<DailySalesPage />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="kitchens" element={<AdminKitchensPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
        </Route>

        <Route path="/kitchen" element={<ProtectedRoute allowedRoles={['KITCHEN']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<KitchenDashboard />} />
          <Route path="orders" element={<KitchenDashboard />} />
          <Route path="dispatch" element={<KitchenDispatchPage />} />
          <Route path="approvals" element={<KitchenApprovalsPage />} />
        </Route>

        <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="analytics" element={<SuperAdminAnalyticsPage />} />
          <Route path="franchises" element={<SuperAdminFranchisesPage />} />
          <Route path="admins" element={<SuperAdminAdminsPage />} />
          <Route path="revenue" element={<SuperAdminRevenuePage />} />
          <Route path="reports" element={<SuperAdminReportsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
