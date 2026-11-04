'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Wrench, 
  Menu, 
  X, 
  LogOut, 
  ShieldCheck, 
  ShoppingBag, 
  Calendar, 
  MapPin, 
  Phone
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSupport } from '../../contexts/SupportContext';

export const Navbar: React.FC = () => {
  const { user, isAdmin, viewMode, setViewMode, logout } = useAuth();
  const { supportInfo, getCallUrl } = useSupport();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleModeSwitch = (mode: 'customer' | 'admin') => {
    setViewMode(mode);
    if (mode === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#FDFCF9]/95 backdrop-blur-md border-b border-[#E7E2D8]">
      {/* Top micro banner for support */}
      <div className="bg-[#242D2B] text-[#E7E2D8] text-xs py-1.5 px-4 hidden md:flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>📍 Operating in <strong>Prayagraj (Allahabad)</strong></span>
          <span className="text-[#6C7B77]">•</span>
          <span>Doorstep local service coordination</span>
        </div>
        <div className="flex items-center gap-4">
          <a href={getCallUrl()} className="flex items-center gap-1.5 hover:text-[#F7F5EF] transition">
            <Phone className="w-3.5 h-3.5 text-[#25877C]" />
            <span>Support Helpline: <strong>{supportInfo.phone}</strong></span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img
                src="/local-logo.svg"
                alt="LocalHelp — Happy to Help"
                className="h-10 w-auto max-w-[140px] sm:max-w-[160px] object-contain transition group-hover:opacity-90"
              />
            </Link>

            {/* Admin Switcher Pill for Admins */}
            {isAdmin && (
              <div className="hidden md:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => handleModeSwitch('customer')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    viewMode === 'customer'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Customer View
                </button>
                <button
                  onClick={() => handleModeSwitch('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                    viewMode === 'admin'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {viewMode === 'admin' ? (
              // Admin Links
              <>
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Overview
                </Link>
                <Link
                  href="/admin/requests"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/requests') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Requests
                </Link>
                <Link
                  href="/admin/bookings"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/bookings') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Bookings
                </Link>
                <Link
                  href="/admin/providers"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/providers') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Providers
                </Link>
                <Link
                  href="/admin/customers"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/customers') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Customers
                </Link>
                <Link
                  href="/admin/settings"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/settings') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Settings
                </Link>
                <Link
                  href="/admin/architecture"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/architecture') ? 'text-teal-700 bg-teal-50 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Architecture
                </Link>
              </>
            ) : (
              // Customer Links
              <>
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Services
                </Link>
                {user && (
                  <>
                    <Link
                      href="/requests"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/requests') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4 text-slate-500" />
                      <span>My Requests</span>
                    </Link>
                    <Link
                      href="/bookings"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/bookings') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>Bookings</span>
                    </Link>
                    <Link
                      href="/addresses"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/addresses') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>Addresses</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* User actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900">{user.name}</span>
                  <span className="text-[11px] text-slate-500 capitalize">{user.role.replace('_', ' ')}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => handleModeSwitch(viewMode === 'admin' ? 'customer' : 'admin')}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-slate-100 text-slate-700"
              >
                {viewMode === 'admin' ? 'Customer' : 'Admin'}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          {user && (
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.phone || user.email}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                {user.role}
              </span>
            </div>
          )}

          {viewMode === 'admin' ? (
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1">Admin Menu</p>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/requests"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Service Requests
              </Link>
              <Link
                href="/admin/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Bookings & Payments
              </Link>
              <Link
                href="/admin/providers"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Provider Directory
              </Link>
              <Link
                href="/admin/customers"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Customers
              </Link>
              <Link
                href="/admin/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Platform Settings
              </Link>
              <Link
                href="/admin/architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-teal-700 hover:bg-teal-50"
              >
                Architecture Review
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Explore Services
              </Link>
              {user && (
                <>
                  <Link
                    href="/requests"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    My Requests
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    My Bookings
                  </Link>
                  <Link
                    href="/addresses"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Saved Addresses
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-200">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
