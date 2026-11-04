import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { apiRequest } from '../api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
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

  const refreshProfile = async () => {
    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch {
      await AsyncStorage.removeItem('localhelp_access_token');
      await AsyncStorage.removeItem('localhelp_refresh_token');
      setUser(null);
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
      body: JSON.stringify({ login, password }),
    });

    await AsyncStorage.setItem('localhelp_access_token', data.access_token);
    await AsyncStorage.setItem('localhelp_refresh_token', data.refresh_token);
    setUser(data.user);
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
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
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

