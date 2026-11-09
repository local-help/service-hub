import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { apiRequest } from '../api/client';

export type ViewMode = 'customer' | 'admin';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isProvider: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  loginWithPassword: (login: string, password: string) => Promise<User>;
  sendOtp: (phone: string) => Promise<{ cooldown: number }>;
  verifyOtp: (phone: string, otp: string) => Promise<User>;
  register: (formData: { name: string; email?: string; phone: string; password?: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewModeState] = useState<ViewMode>('customer');

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'super_admin'));
  const isSuperAdmin = Boolean(user && user.role === 'super_admin');
  const isProvider = Boolean(user && user.role === 'provider');

  const setViewMode = async (mode: ViewMode) => {
    setViewModeState(mode);
    await AsyncStorage.setItem('localhelp_view_mode', mode);
  };

  const refreshProfile = async () => {
    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      setUser(data.user);
      const isAdm = data.user.role === 'admin' || data.user.role === 'super_admin';
      const savedMode = await AsyncStorage.getItem('localhelp_view_mode');
      if (savedMode === 'admin' || savedMode === 'customer') {
        setViewModeState(savedMode);
      } else if (isAdm) {
        setViewModeState('admin');
      }
    } catch {
      await AsyncStorage.removeItem('localhelp_access_token');
      await AsyncStorage.removeItem('localhelp_refresh_token');
      setUser(null);
      setViewModeState('customer');
    }
  };

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('localhelp_access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      await refreshProfile();
      setLoading(false);
    })();
  }, []);

  const loginWithPassword = async (login: string, password: string): Promise<User> => {
    const data = await apiRequest<{ user: User; access_token: string; refresh_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: login, login, password }),
    });

    await AsyncStorage.setItem('localhelp_access_token', data.access_token);
    await AsyncStorage.setItem('localhelp_refresh_token', data.refresh_token);
    setUser(data.user);
    const isAdm = data.user.role === 'admin' || data.user.role === 'super_admin';
    if (isAdm) {
      setViewModeState('admin');
      await AsyncStorage.setItem('localhelp_view_mode', 'admin');
    }
    return data.user;
  };

  const sendOtp = async (phone: string): Promise<{ cooldown: number }> => {
    return await apiRequest<{ message: string; cooldown: number }>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  };

  const verifyOtp = async (phone: string, otp: string): Promise<User> => {
    const data = await apiRequest<{ user: User; access_token: string; refresh_token: string }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });

    await AsyncStorage.setItem('localhelp_access_token', data.access_token);
    await AsyncStorage.setItem('localhelp_refresh_token', data.refresh_token);
    setUser(data.user);
    const isAdm = data.user.role === 'admin' || data.user.role === 'super_admin';
    if (isAdm) {
      setViewModeState('admin');
      await AsyncStorage.setItem('localhelp_view_mode', 'admin');
    }
    return data.user;
  };

  const register = async (formData: { name: string; email?: string; phone: string; password?: string }): Promise<User> => {
    const data = await apiRequest<{ user: User; access_token: string; refresh_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    await AsyncStorage.setItem('localhelp_access_token', data.access_token);
    await AsyncStorage.setItem('localhelp_refresh_token', data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('localhelp_refresh_token');
      await apiRequest('/auth/logout', {
        method: 'DELETE',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
    } finally {
      await AsyncStorage.removeItem('localhelp_access_token');
      await AsyncStorage.removeItem('localhelp_refresh_token');
      await AsyncStorage.removeItem('localhelp_view_mode');
      setUser(null);
      setViewModeState('customer');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isSuperAdmin,
        isProvider,
        viewMode: isAdmin ? viewMode : 'customer',
        setViewMode,
        loginWithPassword,
        sendOtp,
        verifyOtp,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

