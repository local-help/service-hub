'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, AlertCircle, Wrench } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register({ name, email, phone, password });
      router.push('/');
    } catch (err: any) {
      setError(err.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#F7F5EF]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block group mb-1">
            <img
              src="/local-logo.svg"
              alt="LocalHelp"
              className="h-12 w-auto mx-auto object-contain transition group-hover:opacity-90"
            />
          </Link>
          <h1 className="text-2xl font-black text-[#242D2B] tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-500">Sign up for verified local services coordination</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white border border-[#E7E2D8] rounded-3xl p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#242D2B] block mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-[#E7E2D8] rounded-xl outline-none focus:border-[#25877C] focus:ring-2 focus:ring-[#25877C]/20 transition text-[#242D2B]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#242D2B] block mb-1">Mobile Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-[#E7E2D8] rounded-xl outline-none focus:border-[#25877C] focus:ring-2 focus:ring-[#25877C]/20 transition text-[#242D2B]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#242D2B] block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-[#E7E2D8] rounded-xl outline-none focus:border-[#25877C] focus:ring-2 focus:ring-[#25877C]/20 transition text-[#242D2B]"
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
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-[#E7E2D8] rounded-xl outline-none focus:border-[#25877C] focus:ring-2 focus:ring-[#25877C]/20 transition text-[#242D2B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#176B65] hover:bg-[#135752] disabled:opacity-50 text-[#F7F5EF] font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer mt-2"
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="text-[#176B65] font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
