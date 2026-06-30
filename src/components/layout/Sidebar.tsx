import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Users, ChefHat, Package,
  BarChart3, Bell, Settings, LogOut, X, Boxes, Tags,
  Truck, ClipboardList, Globe, Shield, ChevronRight, TrendingUp,
} from 'lucide-react';
import { UserRole } from '../../types';
import { notificationApi } from '../../api/services';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems: Record<UserRole, { label: string; icon: React.ElementType; path: string; }[]> = {
  USER: [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Place Order',   icon: ShoppingBag,     path: '/dashboard/order' },
    { label: 'My Orders',     icon: ClipboardList,   path: '/dashboard/orders' },
    { label: 'Daily Sales',   icon: TrendingUp,      path: '/dashboard/sales' },
    { label: 'Analytics',     icon: BarChart3,       path: '/dashboard/analytics' },
    { label: 'Notifications', icon: Bell,            path: '/dashboard/notifications' },
  ],
  // ADMIN: [
  //   { label: 'Dashboard',     icon: LayoutDashboard, path: '/admin' },
  //   { label: 'Orders',        icon: ClipboardList,   path: '/admin/orders' },
  //   { label: 'Kitchens',      icon: ChefHat,         path: '/admin/kitchens' },
  //   { label: 'Users',         icon: Users,           path: '/admin/users' },
  //   { label: 'Products',      icon: Package,         path: '/admin/products' },
  //   { label: 'Categories',    icon: Tags,            path: '/admin/categories' },
  //   { label: 'Reports',       icon: BarChart3,       path: '/admin/reports' },
  //   { label: 'Notifications', icon: Bell,            path: '/admin/notifications' },
  //   {label: 'Settings',      icon: Settings,        path: '/admin/settings' },
  // ],
   ADMIN: [
     { label: 'Dashboard',    icon: LayoutDashboard, path: '/admin' },
    { label: 'Orders',       icon: ClipboardList,   path: '/admin/orders' },
     { label: 'Kitchens',     icon: ChefHat,         path: '/admin/kitchens' },
     { label: 'Users',        icon: Users,           path: '/admin/users' },
     { label: 'Products',     icon: Package,         path: '/admin/products' },  
   { label: 'Categories',   icon: Tags,            path: '/admin/categories' },
     { label: 'Reports',      icon: BarChart3,       path: '/admin/reports' },
  { label: 'Notifications',icon: Bell,            path: '/admin/notifications' },
   ],
  KITCHEN: [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/kitchen' },
    { label: 'Orders',        icon: ClipboardList,   path: '/kitchen/orders' },
    { label: 'Dispatch',      icon: Truck,           path: '/kitchen/dispatch' },
    { label: 'Approvals',     icon: Shield,          path: '/kitchen/approvals' },
  ],
  SUPER_ADMIN: [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/superadmin' },
    { label: 'Analytics',     icon: BarChart3,       path: '/superadmin/analytics' },
    { label: 'Franchises',    icon: Globe,           path: '/superadmin/franchises' },
    { label: 'Admin Mgmt',    icon: Shield,          path: '/superadmin/admins' },
    { label: 'Revenue',       icon: Boxes,           path: '/superadmin/revenue' },
    { label: 'Reports',       icon: ClipboardList,   path: '/superadmin/reports' },
  ],
};

const roleLabel: Record<UserRole, string> = {
  USER: 'Franchise User',
  ADMIN: 'Administrator',
  KITCHEN: 'Kitchen Staff',
  SUPER_ADMIN: 'Super Admin',
};

const roleBadgeClass: Record<UserRole, string> = {
  USER: 'badge-info',
  ADMIN: 'badge-success',
  KITCHEN: 'badge-warning',
  SUPER_ADMIN: 'badge-purple',
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'USER';
  const items = navItems[role] || [];
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread count every 60 seconds — only for ADMIN
  useEffect(() => {
    if (role !== 'ADMIN') return;

    const fetchUnread = async () => {
      try {
        const r = await notificationApi.getUnreadCount();
        setUnreadCount(r.data?.data ?? 0);
      } catch {
        // silent fail
      }
    };

    fetchUnread();
    // const interval = setInterval(fetchUnread, 60000);
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-slate-950 border-r border-slate-800/60
        flex flex-col z-50 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <Boxes className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight">FranchiseCRM</p>
              <p className="text-xs text-slate-500">Management Suite</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <span className={`text-xs ${roleBadgeClass[role]}`}>{roleLabel[role]}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((item) => {
            const isNotification = item.label === 'Notifications';
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard' || item.path === '/admin' || item.path === '/kitchen' || item.path === '/superadmin'}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link-active' : 'sidebar-link'
                }
              >
                {/* Bell icon with unread dot */}
                <span className="relative flex-shrink-0">
                  <item.icon className="w-4 h-4" />
                  {isNotification && role === 'ADMIN' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-sky-500 rounded-full" />
                  )}
                </span>
                {item.label}
                {/* Count badge next to label */}
                {isNotification && role === 'ADMIN' && unreadCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom actions */}
         <div className="px-3 py-4 border-t border-slate-800/60 space-y-1">
          {role === 'ADMIN' && (
            <button
              onClick={() => { navigate('/admin/settings'); onClose(); }}
              className="sidebar-link w-full"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          )}
          <button onClick={handleLogout} className="sidebar-link w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;