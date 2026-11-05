'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const defaultName = email.split('@')[0] || 'Customer';
      await register({ email, password, name: defaultName });
      router.push('/');
    } catch (err: any) {
      setError(err.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Create an account</h1>
          <p className="text-xs text-slate-500">Sign up with your email to coordinate local services</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="border border-slate-200 rounded-xl p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="At least 8 characters"
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

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500 transition text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-teal-700 transition cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'View password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition cursor-pointer shadow-xs mt-2"
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center pt-1">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400 absolute">
              or continue with
            </span>
          </div>

          {/* Google One-Click Registration */}
          <GoogleSignInButton
            mode="signup"
            onError={(err) => setError(err)}
          />
        </div>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-700 font-medium hover:text-teal-800 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
