import React, { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../api/client';
import { User } from '../types';
import { colors } from '../theme/colors';

WebBrowser.maybeCompleteAuthSession();

interface Props {
  mode?: 'signin' | 'signup' | 'continue';
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
}

export const GoogleSignInButton: React.FC<Props> = ({
  mode = 'continue',
  onSuccess,
  onError,
}) => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string>(
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || ''
  );

  // Discover Google Client ID from backend if unconfigured in local env
  useEffect(() => {
    if (!googleClientId) {
      apiRequest<{ client_id: string; configured: boolean }>('/auth/google/config')
        .then((res) => {
          if (res?.client_id) {
            setGoogleClientId(res.client_id);
          }
        })
        .catch(() => {});
    }
  }, [googleClientId]);

  // Real production Google OAuth request hook
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleClientId || undefined,
    webClientId: googleClientId || undefined,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || googleClientId || undefined,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || googleClientId || undefined,
  });

  // Handle OAuth response redirect
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken || (response.params as any)?.id_token;
      if (idToken) {
        setLoading(true);
        loginWithGoogle({ id_token: idToken })
          .then((user) => {
            if (onSuccess) onSuccess(user);
          })
          .catch((err: any) => {
            const msg = err?.error || err?.message || 'Google authentication failed';
            if (onError) onError(msg);
            else Alert.alert('Google Sign-In Failed', msg);
          })
          .finally(() => setLoading(false));
      }
    } else if (response?.type === 'error') {
      const msg = (response.error as any)?.message || response.error?.description || 'Google sign-in was cancelled or failed';
      if (onError) onError(msg);
      else Alert.alert('Google Sign-In', msg);
    }
  }, [response]);

  const buttonLabel =
    mode === 'signin'
      ? 'Sign in with Google'
      : mode === 'signup'
      ? 'Sign up with Google'
      : 'Continue with Google';

  const handlePress = async () => {
    if (loading) return;

    if (!googleClientId) {
      Alert.alert(
        'Google Client ID Required',
        'Google Client ID is not configured. Please set GOOGLE_CLIENT_ID in service-hub/.env or EXPO_PUBLIC_GOOGLE_CLIENT_ID in service-hub/mobile/.env to enable production Google Sign-In.'
      );
      return;
    }

    if (!request) {
      Alert.alert('Please wait', 'Google Sign-In is initializing...');
      return;
    }

    setLoading(true);
    try {
      await promptAsync();
    } catch (err: any) {
      Alert.alert('Google Sign-In', err?.message || 'Failed to start Google sign-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.googleBtn}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <Path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <Path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <Path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </Svg>
      )}
      <Text style={styles.googleBtnText}>{loading ? 'Connecting...' : buttonLabel}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
});
