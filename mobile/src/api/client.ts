import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = (): string => {
  // Try all possible places where Expo stores the Metro packager host
  const hostUri = 
    Constants.expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  let metroHost = hostUri ? hostUri.split(':')[0] : null;

  if (!metroHost) {
    const expUrl = Constants.experienceUrl || (Constants as any).linkingUri;
    if (expUrl && typeof expUrl === 'string') {
      const match = expUrl.match(/^[a-zA-Z]+:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        metroHost = match[1];
      }
    }
  }

  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // If envUrl is explicitly set to a production domain (https:// and not local private IP), prioritize it
  if (
    envUrl &&
    !envUrl.includes('localhost') &&
    !envUrl.includes('127.0.0.1') &&
    !envUrl.includes('192.168.') &&
    !envUrl.includes('172.') &&
    !envUrl.includes('10.')
  ) {
    return envUrl;
  }

  // In local development, the Metro host is the active network address connecting phone to dev machine
  if (metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1') {
    return `http://${metroHost}:3000/api/v1`;
  }

  // Fallback to EXPO_PUBLIC_API_URL from .env if present
  if (envUrl) {
    return envUrl;
  }

  const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${defaultHost}:3000/api/v1`;
};

export let API_BASE = getBaseUrl();
console.log('[LocalHelp API] Active Base URL:', API_BASE);

export const setApiBase = (url: string) => {
  API_BASE = url;
  console.log('[LocalHelp API] Set Base URL:', API_BASE);
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

  // Set 15-second timeout controller so requests don't hang indefinitely
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw {
        error: `Request timed out connecting to ${API_BASE}. Please ensure your device and Mac are on the same network.`,
        status: 408,
      } as ApiError;
    }
    throw {
      error: err?.message || `Failed to connect to ${API_BASE}. Please verify backend is running.`,
      status: 0,
    } as ApiError;
  } finally {
    clearTimeout(timeoutId);
  }

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

  const data = await response.json();
  const rawUrl: string = data.file_url || data.url || '';
  const fullUrl = rawUrl.startsWith('http')
    ? rawUrl
    : `${API_BASE.replace('/api/v1', '')}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

  return {
    ...data,
    file_url: fullUrl,
    url: rawUrl,
  };
}
