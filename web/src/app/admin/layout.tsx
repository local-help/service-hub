'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  Briefcase,
  Layers,
  Settings,
  Cpu,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin, isSuperAdmin, setViewMode } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=' + encodeURIComponent(pathname));
    } else if (!loading && user && !isAdmin) {
      router.push('/');
    } else if (!loading && user && isAdmin) {
      setViewMode('admin');
    }
  }, [user, loading, isAdmin, router, pathname, setViewMode]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading Operations Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
    { href: '/admin/payments', label: 'Receipts', icon: Receipt },
    { href: '/admin/providers', label: 'Providers', icon: Briefcase },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/catalogue', label: 'Catalogue', icon: Layers },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/admin/architecture', label: 'Architecture', icon: Cpu },
  ];

  const userInitials = (user.name || user.email || 'Admin')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col">
      {/* Admin Operations Navigation Toolbar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-14 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 gap-4">
            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${active
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Hub Status & Customer link */}
            <div className="hidden lg:flex items-center gap-2.5 shrink-0 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Prayagraj Live
              </span>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition text-[11px] font-medium"
              >
                <span>Customer Site</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

