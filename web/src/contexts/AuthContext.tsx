'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { apiRequest } from '../api/client';

export type ViewMode = 'customer' | 'admin' | 'provider';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isProvider: boolean;
  providerId: number | null;
  providerName: string | null;
  providerRole: string | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (payload: {
    id_token?: string;
    email?: string;
    name?: string;
    avatar_url?: string;
    google_uid?: string;
  }) => Promise<User>;
  sendOtp: (phone: string) => Promise<{ cooldown: number }>;
  verifyOtp: (phone: string, otp: string) => Promise<User>;
  register: (data: { name?: string; email?: string; phone?: string; password?: string }) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
  updateProfile: (data: { name?: string; email?: string; phone?: string; avatar_url?: string | null }) => Promise<User>;
  changePassword: (data: { current_password?: string; new_password: string }) => Promise<{ message: string }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewModeState] = useState<ViewMode>('customer');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('localhelp_view_mode') as ViewMode;
      if (savedMode) setViewModeState(savedMode);
    }
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('localhelp_view_mode', mode);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('localhelp_access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest<{ user: User }>('/auth/me')
      .then((data) => {
        setUser(data.user);
        if (data.user.role === 'admin' || data.user.role === 'super_admin') {
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
            setViewMode('admin');
          }
        } else if (data.user.role === 'provider') {
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/provider')) {
            setViewMode('provider');
          }
        }
      })
      .catch(() => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('localhelp_access_token');
          localStorage.removeItem('localhelp_refresh_token');
        }
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<User> => {
    const data = await apiRequest<{ user: User; access_token: string; refresh_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('localhelp_access_token', data.access_token);
      localStorage.setItem('localhelp_refresh_token', data.refresh_token);
    }
    setUser(data.user);

    if (data.user.role === 'admin' || data.user.role === 'super_admin') {
      setViewMode('admin');
    } else if (data.user.role === 'provider') {
      setViewMode('provider');
    }

    return data.user;
  };

  const loginWithGoogle = async (payload: {
    id_token?: string;
    email?: string;
    name?: string;
    avatar_url?: string;
    google_uid?: string;
  }): Promise<User> => {
    const data = await apiRequest<{
      user: User;
      access_token: string;
      refresh_token: string;
      is_new_user?: boolean;
    }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('localhelp_access_token', data.access_token);
      localStorage.setItem('localhelp_refresh_token', data.refresh_token);
    }
    setUser(data.user);

    if (data.user.role === 'admin' || data.user.role === 'super_admin') {
      setViewMode('admin');
    } else if (data.user.role === 'provider') {
      setViewMode('provider');
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

    if (typeof window !== 'undefined') {
      localStorage.setItem('localhelp_access_token', data.access_token);
      localStorage.setItem('localhelp_refresh_token', data.refresh_token);
    }
    setUser(data.user);

    if (data.user.role === 'admin' || data.user.role === 'super_admin') {
      setViewMode('admin');
    } else if (data.user.role === 'provider') {
      setViewMode('provider');
    }

    return data.user;
  };

  const register = async (formData: { name?: string; email?: string; phone?: string; password?: string }): Promise<User> => {
    const data = await apiRequest<{ user: User; access_token: string; refresh_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('localhelp_access_token', data.access_token);
      localStorage.setItem('localhelp_refresh_token', data.refresh_token);
    }
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('localhelp_refresh_token') : null;
      await apiRequest('/auth/logout', {
        method: 'DELETE',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('localhelp_access_token');
        localStorage.removeItem('localhelp_refresh_token');
        localStorage.removeItem('localhelp_view_mode');
        setUser(null);
        setViewModeState('customer');
        window.location.href = '/';
      }
    }
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  const updateProfile = async (formData: { name?: string; email?: string; phone?: string; avatar_url?: string | null }): Promise<User> => {
    const data = await apiRequest<{ user: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(formData),
    });
    setUser(data.user);
    return data.user;
  };

  const changePassword = async (data: { current_password?: string; new_password: string }): Promise<{ message: string }> => {
    return await apiRequest<{ message: string }>('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isProvider = user?.role === 'provider';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isSuperAdmin,
        isProvider,
        providerId: user?.provider_id || null,
        providerName: user?.provider_name || null,
        providerRole: user?.provider_role || null,
        viewMode,
        setViewMode,
        loginWithEmail,
        loginWithGoogle,
        sendOtp,
        verifyOtp,
        register,
        logout,
        updateUser,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
