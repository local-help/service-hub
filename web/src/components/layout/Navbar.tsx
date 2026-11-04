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
  Phone,
  Briefcase,
  Layers,
  Clock,
  Building2,
  ClipboardList,
  Store,
  ArrowUpRight
} from 'lucide-react';
import { useAuth, ViewMode } from '../../contexts/AuthContext';
import { useSupport } from '../../contexts/SupportContext';
import { useLocation } from '../../contexts/LocationContext';

export const Navbar: React.FC = () => {
  const { user, isAdmin, isProvider, viewMode, setViewMode, logout } = useAuth();
  const { supportInfo, getCallUrl } = useSupport();
  const { location, setIsModalOpen } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleModeSwitch = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'admin') {
      router.push('/admin');
    } else if (mode === 'provider') {
      router.push('/provider');
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-[#8BE3D9] transition cursor-pointer text-xs"
            title="Click to detect or change exact doorstep location"
          >
            <MapPin className="w-3.5 h-3.5 text-[#25877C]" />
            <span>
              Location: <strong>{location.locality || location.city || 'Prayagraj'}</strong>
              {location.postal_code ? ` (${location.postal_code})` : ''}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#176B65] text-white font-medium ml-1">
              Change / GPS
            </span>
          </button>
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
          {/* Logo & Scope Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={viewMode === 'admin' ? '/admin' : (viewMode === 'provider' ? '/provider' : '/')}
              className="flex items-center gap-2.5 group"
            >
              <img
                src="/local-logo.svg"
                alt="LocalHelp — Happy to Help"
                className="h-10 w-auto max-w-[140px] sm:max-w-[160px] object-contain transition group-hover:opacity-90"
              />
            </Link>

            {viewMode === 'admin' && (
              <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#242D2B] text-[#8BE3D9] border border-[#384441]">
                <ShieldCheck className="w-3 h-3 text-[#25877C]" />
                Admin
              </span>
            )}
            {viewMode === 'provider' && (
              <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#176B65] text-white">
                <Briefcase className="w-3 h-3 text-[#8BE3D9]" />
                Provider
              </span>
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
                    isActive('/admin') ? 'text-[#176B65] bg-teal-50 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Overview
                </Link>
                <Link
                  href="/admin/requests"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/requests') ? 'text-[#176B65] bg-teal-50 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Requests
                </Link>
                <Link
                  href="/admin/bookings"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/bookings') ? 'text-[#176B65] bg-teal-50 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Bookings
                </Link>
                <Link
                  href="/admin/providers"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/providers') ? 'text-[#176B65] bg-teal-50 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Providers
                </Link>
                <Link
                  href="/admin/customers"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/customers') ? 'text-[#176B65] bg-teal-50 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Customers
                </Link>
                <Link
                  href="/admin/catalogue"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/catalogue') ? 'text-[#176B65] bg-teal-50 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Catalogue
                </Link>
                <Link
                  href="/admin/settings"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/settings') ? 'text-[#176B65] bg-teal-50 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Settings
                </Link>
              </>
            ) : viewMode === 'provider' ? (
              // Provider Links
              <>
                <Link
                  href="/provider"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/provider') ? 'text-[#176B65] bg-teal-50 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/provider/requests"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/provider/requests') ? 'text-[#176B65] bg-teal-50 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Assigned Jobs
                </Link>
                <Link
                  href="/provider/services"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/provider/services') ? 'text-[#176B65] bg-teal-50 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Services & Pricing
                </Link>
                <Link
                  href="/provider/availability"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/provider/availability') ? 'text-[#176B65] bg-teal-50 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Availability
                </Link>
                <Link
                  href="/provider/profile"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/provider/profile') ? 'text-[#176B65] bg-teal-50 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Profile
                </Link>
              </>
            ) : (
              // Customer Links
              <>
                {user && (
                  <>
                    <Link
                      href="/requests"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/requests') ? 'text-teal-700 bg-teal-50 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4 text-slate-500" />
                      <span>My Requests</span>
                    </Link>
                    <Link
                      href="/bookings"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/bookings') ? 'text-teal-700 bg-teal-50 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>Bookings</span>
                    </Link>
                    <Link
                      href="/addresses"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/addresses') ? 'text-teal-700 bg-teal-50 font-semibold' : 'text-slate-700 hover:bg-slate-100'
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

          {/* User actions & Mode Switcher */}
          <div className="hidden md:flex items-center gap-3">
            {/* View Mode Switcher Button for Admins */}
            {isAdmin && (
              viewMode === 'admin' ? (
                <button
                  onClick={() => handleModeSwitch('customer')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-[#E7E2D8] hover:border-[#176B65] hover:text-[#176B65] hover:bg-[#F7F5EF] transition shadow-2xs group cursor-pointer"
                  title="Switch to customer storefront"
                >
                  <Store className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#176B65]" />
                  <span>Customer View</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#176B65] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => handleModeSwitch('admin')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#176B65] hover:bg-[#12534E] shadow-xs hover:shadow transition cursor-pointer"
                  title="Open Admin Dashboard"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8BE3D9]" />
                  <span>Admin Dashboard</span>
                </button>
              )
            )}

            {/* View Mode Switcher Button for Providers */}
            {isProvider && !isAdmin && (
              viewMode === 'provider' ? (
                <button
                  onClick={() => handleModeSwitch('customer')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-[#E7E2D8] hover:border-[#176B65] hover:text-[#176B65] hover:bg-[#F7F5EF] transition shadow-2xs group cursor-pointer"
                  title="Switch to customer storefront"
                >
                  <Store className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#176B65]" />
                  <span>Customer View</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#176B65] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => handleModeSwitch('provider')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#176B65] hover:bg-[#12534E] shadow-xs hover:shadow transition cursor-pointer"
                  title="Open Provider Portal"
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#8BE3D9]" />
                  <span>Provider Portal</span>
                </button>
              )
            )}

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                  <span className="text-[10px] font-semibold text-slate-500 capitalize">{user.role.replace('_', ' ')}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#176B65] hover:bg-[#12534E] rounded-xl shadow-xs hover:shadow transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {(isAdmin || isProvider) && (
              <button
                onClick={() => {
                  if (viewMode === 'customer') {
                    handleModeSwitch(isProvider ? 'provider' : 'admin');
                  } else {
                    handleModeSwitch('customer');
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-[#E7E2D8] bg-[#F7F5EF] text-[#176B65]"
              >
                {viewMode === 'customer' ? (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    <span>Admin</span>
                  </>
                ) : (
                  <>
                    <Store className="w-3 h-3" />
                    <span>Store</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-[#176B65] uppercase">
                {user.role}
              </span>
            </div>
          )}

          {/* Mobile View Mode Switcher */}
          {(isAdmin || isProvider) && (
            <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => {
                  handleModeSwitch('customer');
                  setMobileMenuOpen(false);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === 'customer'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                Customer
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    handleModeSwitch('admin');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    viewMode === 'admin'
                      ? 'bg-[#176B65] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </button>
              )}

              {isProvider && !isAdmin && (
                <button
                  onClick={() => {
                    handleModeSwitch('provider');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    viewMode === 'provider'
                      ? 'bg-[#176B65] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Provider
                </button>
              )}
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
                Bookings
              </Link>
              <Link
                href="/admin/providers"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Providers
              </Link>
              <Link
                href="/admin/catalogue"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Catalogue Management
              </Link>
            </div>
          ) : viewMode === 'provider' ? (
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 px-2 py-1">Provider Portal</p>
              <Link
                href="/provider"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <Link
                href="/provider/requests"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Assigned Requests
              </Link>
              <Link
                href="/provider/services"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                My Services & Pricing
              </Link>
              <Link
                href="/provider/availability"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Availability & Schedule
              </Link>
              <Link
                href="/provider/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Organisation Profile
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
                </>
              )}
            </div>
          )}

          {user ? (
            <div className="pt-3 border-t border-slate-200">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 text-sm font-semibold rounded-xl hover:bg-rose-100 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                Log In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2 text-sm font-semibold text-white bg-[#176B65] rounded-xl"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
