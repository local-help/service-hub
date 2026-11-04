'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Layers, 
  Clock, 
  Building2, 
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isProvider, isAdmin, setViewMode } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=' + encodeURIComponent(pathname));
    } else if (!loading && user && !isProvider && !isAdmin) {
      router.push('/');
    } else if (!loading && user && (isProvider || isAdmin)) {
      setViewMode('provider');
    }
  }, [user, loading, isProvider, isAdmin, router, pathname, setViewMode]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#176B65] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading Provider Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user || (!isProvider && !isAdmin)) {
    return null;
  }

  const navItems = [
    { href: '/provider', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/provider/requests', label: 'Assigned Requests', icon: ClipboardList },
    { href: '/provider/services', label: 'My Services & Pricing', icon: Layers },
    { href: '/provider/availability', label: 'Availability & Hours', icon: Clock },
    { href: '/provider/profile', label: 'Organization Profile', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5EF]/60">
      {/* Top Provider Brand Header */}
      <div className="bg-[#176B65] text-[#F7F5EF] border-b border-[#0E4B46] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#25877C] text-[#F7F5EF]">
                  Provider Portal
                </span>
                <span className="text-xs text-[#E7E2D8]/80">Operating in Prayagraj</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                {user.provider_name || 'Service Provider Hub'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#0E4B46]/70 px-3 py-1.5 rounded-xl border border-[#25877C]/40 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-white font-medium">Logged in as {user.name}</span>
                <span className="text-[#E7E2D8]/70">({user.provider_role || 'Operator'})</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-2 mt-5 overflow-x-auto no-scrollbar border-t border-[#25877C]/40 pt-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                    active
                      ? 'bg-white text-[#176B65] shadow-xs font-semibold'
                      : 'text-[#E7E2D8] hover:bg-[#25877C]/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

