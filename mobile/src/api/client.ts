import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Automatically detect developer Mac's Wi-Fi IP from the active Metro bundler connection
  const hostUri = Constants.expoConfig?.hostUri;
  const metroHost = hostUri ? hostUri.split(':')[0] : null;

  if (metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1') {
    return `http://${metroHost}:3000/api/v1`;
  }

  const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${defaultHost}:3000/api/v1`;
};

export let API_BASE = getBaseUrl();

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
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

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

export async function uploadImage(
  uri: string,
  name?: string
): Promise<{ file_url: string; file_name: string; url?: string }> {
  const token = await AsyncStorage.getItem('localhelp_access_token');
  const formData = new FormData();
  const filename = name || uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image/jpeg`;

  formData.append('file', {
    uri,
    name: filename,
    type,
  } as any);

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errMessage = 'Photo upload failed';
    try {
      const err = await response.json();
      errMessage = err.error || errMessage;
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  return response.json();
}
