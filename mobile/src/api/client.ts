import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ENV_URL = process.env.EXPO_PUBLIC_API_URL;
const DEFAULT_PORT = '4000';
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export let API_BASE = ENV_URL || `http://${DEFAULT_HOST}:${DEFAULT_PORT}/api/v1`;

export const setApiBase = (url: string) => {
  API_BASE = url;
};

export interface ApiError {
  error: string;
  detail?: string;
  status?: number;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await AsyncStorage.getItem('localhelp_access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !path.includes('/auth/')) {
    const refreshToken = await AsyncStorage.getItem('localhelp_refresh_token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          await AsyncStorage.setItem('localhelp_access_token', data.access_token);
          await AsyncStorage.setItem('localhelp_refresh_token', data.refresh_token);

          headers['Authorization'] = `Bearer ${data.access_token}`;
          const retryRes = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers,
          });
          if (retryRes.ok) return await retryRes.json();
        }
      } catch (err) {
        await AsyncStorage.removeItem('localhelp_access_token');
        await AsyncStorage.removeItem('localhelp_refresh_token');
      }
    }
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText || 'An error occurred' };
    }
    const error: ApiError = {
      error: errorData.error || errorData.message || 'Request failed',
      detail: errorData.detail,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}

