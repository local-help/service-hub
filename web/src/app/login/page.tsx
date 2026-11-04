'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Mail, Lock, KeyRound, AlertCircle, Wrench, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, sendOtp, verifyOtp } = useAuth();

  const [tab, setTab] = useState<'otp' | 'password'>('otp');
  
  // OTP state
  const [phone, setPhone] = useState('+919876543210');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const user = await verifyOtp(phone, otp);
      if (user.role === 'admin' || user.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
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
      const user = await loginWithEmail(email, password);
      if (user.role === 'admin' || user.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setTab('password');
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#F7F5EF]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#176B65] to-[#25877C] text-[#F7F5EF] flex items-center justify-center mx-auto shadow-md">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-[#242D2B] tracking-tight">Welcome to LocalHelp</h1>
          <p className="text-xs text-slate-500">Sign in to coordinate and manage your local services</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white border border-[#E7E2D8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Method tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#F7F5EF] border border-[#E7E2D8] rounded-xl text-xs font-bold">
            <button
              onClick={() => setTab('otp')}
              className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'otp' ? 'bg-[#176B65] text-[#F7F5EF] shadow-xs' : 'text-slate-600 hover:text-[#242D2B]'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
            </button>
            <button
              onClick={() => setTab('password')}
              className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'password' ? 'bg-[#176B65] text-[#F7F5EF] shadow-xs' : 'text-slate-600 hover:text-[#242D2B]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
          </div>

          {/* OTP Flow */}
          {tab === 'otp' ? (
            !otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#242D2B] block mb-1">Mobile Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="+919876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-[#E7E2D8] rounded-xl outline-none focus:border-[#25877C] focus:ring-2 focus:ring-[#25877C]/20 transition text-[#242D2B]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">We'll send a 6-digit verification code via SMS.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#176B65] hover:bg-[#135752] disabled:opacity-50 text-[#F7F5EF] font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
                >
                  {loading ? 'Sending Code...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-[#242D2B]">Enter 6-Digit OTP</label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-[#176B65] font-semibold hover:underline"
                    >
                      Change Phone
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-base font-mono tracking-widest border border-[#E7E2D8] rounded-xl outline-none focus:border-[#25877C] transition text-center text-[#242D2B]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 text-center">
                    Sent to {phone}. (In dev/test, use OTP 123456)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="w-full py-3 bg-[#25877C] hover:bg-[#176B65] disabled:opacity-50 text-[#F7F5EF] font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </form>
            )
          ) : (
            /* Email Password Form */
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#242D2B] block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-[#E7E2D8] rounded-xl outline-none focus:border-[#25877C] transition text-[#242D2B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#242D2B] block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-[#E7E2D8] rounded-xl outline-none focus:border-[#25877C] transition text-[#242D2B]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#176B65] hover:bg-[#135752] disabled:opacity-50 text-[#F7F5EF] font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Quick Demo Logins for Testing */}
          <div className="pt-4 border-t border-[#E7E2D8] space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block text-center">
              Quickfill Demo Credentials
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => fillDemo('customer@example.com', 'Customer@123456')}
                className="p-1.5 rounded-lg border border-[#E7E2D8] hover:bg-[#F7F5EF] text-[#242D2B] transition cursor-pointer text-center"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin@localhelp.com', 'Admin@123456')}
                className="p-1.5 rounded-lg border border-[#B0DCD7] hover:bg-[#F0F8F7] text-[#176B65] transition cursor-pointer text-center font-bold"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('superadmin@localhelp.com', 'Admin@123456')}
                className="p-1.5 rounded-lg border border-[#E7E2D8] hover:bg-[#F7F5EF] text-[#242D2B] transition cursor-pointer text-center font-bold"
              >
                Super Admin
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600">
          Don't have an account yet?{' '}
          <Link href="/register" className="text-[#176B65] font-bold hover:underline">
            Create Customer Account
          </Link>
        </p>
      </div>
    </div>
  );
}
