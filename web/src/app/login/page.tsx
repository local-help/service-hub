'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Phone, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const { user, loading: authLoading, loginWithEmail, sendOtp, verifyOtp } = useAuth();

  const [tab, setTab] = useState<'otp' | 'password'>('otp');
  
  // OTP state
  const [phone, setPhone] = useState('+919876543210');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTargetUrl = (targetUser?: any) => {
    if (redirectParam && redirectParam.startsWith('/')) {
      return redirectParam;
    }
    const role = targetUser?.role || user?.role;
    if (role === 'admin' || role === 'super_admin') return '/admin';
    if (role === 'provider') return '/provider';
    return '/';
  };

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(getTargetUrl(user));
    }
  }, [user, authLoading, redirectParam, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await sendOtp(phone);
      setOtpSent(true);
      setCooldown(res.cooldown || 60);
    } catch (err: any) {
      setError(err.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await verifyOtp(phone, otp);
      router.push(getTargetUrl(loggedUser));
    } catch (err: any) {
      setError(err.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await loginWithEmail(email, password);
      router.push(getTargetUrl(loggedUser));
    } catch (err: any) {
      setError(err.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-white">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="inline-block mb-3">
            <img
              src="/local-logo.svg"
              alt="LocalHelp"
              className="h-8 w-auto mx-auto object-contain"
            />
          </Link>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Sign in to LocalHelp</h1>
          <p className="text-xs text-slate-500">Manage and coordinate your local services</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="border border-slate-200 rounded-xl p-6 space-y-5">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-0.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setTab('otp')}
              className={`py-1.5 rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'otp' ? 'bg-white text-teal-800 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('password')}
              className={`py-1.5 rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'password' ? 'bg-white text-teal-800 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
          </div>

          {/* Tab 1: OTP Login */}
          {tab === 'otp' && (
            <div className="space-y-4">
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+919876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={otpSent}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500 transition text-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {!otpSent && (
                  <button
                    type="submit"
                    disabled={loading || !phone}
                    className="w-full py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition cursor-pointer shadow-xs"
                  >
                    {loading ? 'Sending OTP…' : 'Send OTP'}
                  </button>
                )}
              </form>

              {otpSent && (
                <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700">Enter 6-digit OTP</label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp('');
                        }}
                        className="text-[11px] text-teal-700 hover:underline"
                      >
                        Change Phone
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 text-sm text-center tracking-widest font-mono border border-slate-200 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500 transition text-slate-900"
                    />
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                      <span>Dev bypass: <strong>123456</strong></span>
                      {cooldown > 0 && <span>Resend in {cooldown}s</span>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 4}
                    className="w-full py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition cursor-pointer shadow-xs"
                  >
                    {loading ? 'Verifying…' : 'Verify & Sign in'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Tab 2: Password Login */}
          {tab === 'password' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500 transition text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500 transition text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-teal-700 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'View password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition cursor-pointer shadow-xs"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}

          {/* Quick Demo Credentials */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              One-Click Demo Credentials
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setTab('password');
                  setEmail('admin@localhelp.in');
                  setPassword('Admin@123456');
                }}
                className="px-2 py-1.5 border border-slate-200 hover:border-teal-700 hover:bg-teal-50 text-slate-700 hover:text-teal-900 rounded-lg text-center font-medium transition cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('password');
                  setEmail('apex_provider@localhelp.in');
                  setPassword('Provider@123456');
                }}
                className="px-2 py-1.5 border border-slate-200 hover:border-teal-700 hover:bg-teal-50 text-slate-700 hover:text-teal-900 rounded-lg text-center font-medium transition cursor-pointer"
              >
                Provider
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('password');
                  setEmail('customer@example.com');
                  setPassword('Customer@123456');
                }}
                className="px-2 py-1.5 border border-slate-200 hover:border-teal-700 hover:bg-teal-50 text-slate-700 hover:text-teal-900 rounded-lg text-center font-medium transition cursor-pointer"
              >
                Customer
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center pt-1">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400 absolute">
              or continue with
            </span>
          </div>

          {/* Google Sign In */}
          <GoogleSignInButton
            mode="continue"
            onSuccess={(loggedUser) => router.push(getTargetUrl(loggedUser))}
            onError={(err) => setError(err)}
          />
        </div>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link
            href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
            className="text-teal-700 font-medium hover:text-teal-800 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-white">
          <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
