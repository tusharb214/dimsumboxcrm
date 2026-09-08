 
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api/services';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (storedToken && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      // const { token: t, user: u } = (res.data as any).data;
      const { token: t, user: u } = (res.data as any).data ?? res.data;
      localStorage.setItem('auth_token', t);
      localStorage.setItem('auth_user', JSON.stringify(u));
      setToken(t);
      setUser(u);
      toast.success(`Welcome back, ${u.name}!`);
    } catch (err: any) {
  console.error('LOGIN ERROR:', err);
  console.error('LOGIN STATUS:', err?.response?.status);
  console.error('LOGIN DATA:', err?.response?.data);
  console.error('LOGIN MESSAGE:', err?.message);

  toast.error(err?.response?.data?.message || 'Login failed');
  throw err;
}
 finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role?: UserRole) => {
    setIsLoading(true);
    try {
      const res = await authApi.register({ name, email, password, role });
      // const { token: t, user: u } = (res.data as any).data;
      const { token: t, user: u } = (res.data as any).data ?? res.data;
      localStorage.setItem('auth_token', t);
      localStorage.setItem('auth_user', JSON.stringify(u));
      setToken(t);
      setUser(u);
      toast.success('Account created successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      login, register, logout,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
