'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, X, User as UserIcon, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              type?: 'standard' | 'icon';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup' | 'continue';
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
  className?: string;
}

const DEV_ACCOUNTS = [
  {
    name: 'Alex Rivera',
    email: 'alex.rivera@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'Rahul Verma',
    email: 'rahul.verma@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces',
  },
];

export default function GoogleSignInButton({
  mode = 'continue',
  onSuccess,
  onError,
  className = '',
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [gisLoaded, setGisLoaded] = useState(false);

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Handle successful Google token or profile
  const handleAuthPayload = async (payload: {
    id_token?: string;
    email?: string;
    name?: string;
    avatar_url?: string;
    google_uid?: string;
  }) => {
    setLoading(true);
    try {
      const user = await loginWithGoogle(payload);
      setShowDevModal(false);
      if (onSuccess) {
        onSuccess(user);
      } else {
        if (user.role === 'admin' || user.role === 'super_admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      const errorMsg = err?.error || err?.message || 'Google authentication failed';
      if (onError) {
        onError(errorMsg);
      } else {
        alert(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load Google Identity Services SDK if Client ID is configured
  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGisLoaded(true);
    };
    script.onerror = () => {
      console.warn('Failed to load Google Identity Services SDK.');
    };
    document.body.appendChild(script);

    return () => {
      // Keep script for subsequent renders
    };
  }, [clientId]);

  // Initialize GIS and render official button into container if configured
  useEffect(() => {
    if (!clientId || !gisLoaded || !window.google?.accounts?.id || !googleBtnContainerRef.current) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            handleAuthPayload({ id_token: response.credential });
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render standard Google button
      googleBtnContainerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        theme: 'outline',
        size: 'large',
        text: mode === 'signup' ? 'signup_with' : (mode === 'signin' ? 'signin_with' : 'continue_with'),
        shape: 'rectangular',
        width: 334,
      });
    } catch (err) {
      console.error('Error initializing Google Sign-In:', err);
    }
  }, [clientId, gisLoaded, mode]);

  const handleClick = () => {
    if (loading) return;

    // If client ID is present and GIS loaded, trigger prompt
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('Google One Tap prompt failed, falling back:', err);
      }
    }

    // Otherwise open instant Dev Sign-in Modal
    setShowDevModal(true);
  };

  const handleDevAccountSelect = (acc: (typeof DEV_ACCOUNTS)[0]) => {
    handleAuthPayload({
      email: acc.email,
      name: acc.name,
      avatar_url: acc.avatar,
      google_uid: `google_dev_${acc.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const resolvedName = customName.trim() || customEmail.split('@')[0];
    handleAuthPayload({
      email: customEmail.trim(),
      name: resolvedName,
      google_uid: `google_dev_${customEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    });
  };

  const buttonLabel =
    mode === 'signup'
      ? 'Sign up with Google'
      : mode === 'signin'
      ? 'Sign in with Google'
      : 'Continue with Google';

  return (
    <div className={`w-full ${className}`}>
      {/* Official GIS container if client ID is configured */}
      {clientId ? (
        <div className="relative w-full flex justify-center">
          <div ref={googleBtnContainerRef} className="w-full flex justify-center" />
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center rounded-lg">
              <Loader2 className="w-5 h-5 text-teal-700 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        /* Styled Minimalist Google Button */
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 transition cursor-pointer shadow-xs disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-teal-700 animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{loading ? 'Connecting…' : buttonLabel}</span>
        </button>
      )}

      {/* Dev Mode Interactive Google Sign-In Modal */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <h3 className="text-sm font-semibold text-slate-900">Sign in with Google</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDevModal(false)}
                className="text-slate-400 hover:text-slate-600 transition p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg flex items-start gap-2 text-teal-800 text-[11px] leading-relaxed">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
              <span>
                Pick an account below to sign in or register instantly with Google.
              </span>
            </div>

            {/* Quick Account Picks */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block px-0.5">
                Choose an account
              </span>
              {DEV_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDevAccountSelect(acc)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition text-left cursor-pointer group"
                >
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-900 group-hover:text-teal-700 transition truncate">
                      {acc.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{acc.email}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Or custom email entry */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block px-0.5 mb-2">
                Or enter custom Google account
              </span>
              <form onSubmit={handleCustomSubmit} className="space-y-2">
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500 text-slate-900"
                  />
                </div>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="you@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500 text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !customEmail.trim()}
                  className="w-full py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <span>Continue with this account</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

