'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  LogOut, 
  ShieldCheck, 
  MapPin,
  Briefcase,
  Store,
  ArrowUpRight,
  Bell,
  Calendar,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth, ViewMode } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { NotificationBell } from '../notifications/NotificationBell';

export const Navbar: React.FC = () => {
  const { user, loading: authLoading, isAdmin, isProvider, viewMode, setViewMode, logout } = useAuth();
  const { location, setIsModalOpen } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  // Close profile dropdown on navigation
  useEffect(() => {
    setProfileMenuOpen(false);
  }, [pathname]);

  const showAdminView = Boolean(user && isAdmin && (viewMode === 'admin' || pathname?.startsWith('/admin')));
  const showProviderView = Boolean(user && isProvider && viewMode === 'provider' && !pathname?.startsWith('/admin'));

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

  const linkClass = (path: string) =>
    `px-3 py-1.5 rounded-md text-sm transition ${
      isActive(path) ? 'text-teal-700 font-semibold' : 'text-slate-600 hover:text-teal-700'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${showAdminView || showProviderView ? 'max-w-7xl' : 'max-w-5xl'}`}>
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={showAdminView ? '/admin' : (showProviderView ? '/provider' : '/')}
              className="flex items-center gap-2 group"
            >
              <img
                src="/local-logo.svg"
                alt="LocalHelp"
                className="h-8 w-auto max-w-[130px] object-contain"
              />
            </Link>

            {showAdminView && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Admin
              </span>
            )}
            {showProviderView && (
              <span className="hidden sm:inline text-[10px] font-medium tracking-wide uppercase text-slate-400 border border-slate-200 px-2 py-0.5 rounded">
                Provider
              </span>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {pathname?.startsWith('/admin') ? null : showAdminView ? (
              <>
                <Link href="/admin" className={linkClass('/admin')}>Overview</Link>
                <Link href="/admin/requests" className={linkClass('/admin/requests')}>Requests</Link>
                <Link href="/admin/bookings" className={linkClass('/admin/bookings')}>Bookings</Link>
                <Link href="/admin/providers" className={linkClass('/admin/providers')}>Providers</Link>
                <Link href="/admin/customers" className={linkClass('/admin/customers')}>Customers</Link>
                <Link href="/admin/catalogue" className={linkClass('/admin/catalogue')}>Catalogue</Link>
                <Link href="/admin/settings" className={linkClass('/admin/settings')}>Settings</Link>
              </>
            ) : showProviderView ? (
              <>
                <Link href="/provider" className={linkClass('/provider')}>Dashboard</Link>
                <Link href="/provider/requests" className={linkClass('/provider/requests')}>Jobs</Link>
                <Link href="/provider/services" className={linkClass('/provider/services')}>Services</Link>
                <Link href="/provider/availability" className={linkClass('/provider/availability')}>Availability</Link>
                <Link href="/provider/profile" className={linkClass('/provider/profile')}>Profile</Link>
              </>
            ) : null}
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Location pill (customer only) */}
            {!showAdminView && !showProviderView && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-teal-700 hover:bg-teal-50/50 rounded-md transition"
              >
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>{location.locality || 'Prayagraj'}</span>
              </button>
            )}

            {/* View switcher */}
            {isAdmin && (
              viewMode === 'admin' || pathname?.startsWith('/admin') ? (
                <button
                  onClick={() => handleModeSwitch('customer')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5 text-slate-500" />
                  <span>Customer View</span>
                </button>
              ) : (
                <button
                  onClick={() => handleModeSwitch('admin')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Admin</span>
                </button>
              )
            )}

            {isProvider && !isAdmin && (
              viewMode === 'provider' ? (
                <button
                  onClick={() => handleModeSwitch('customer')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Customer View</span>
                </button>
              ) : (
                <button
                  onClick={() => handleModeSwitch('provider')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Provider</span>
                </button>
              )
            )}

            {authLoading ? (
              <div className="flex items-center gap-2 pl-2">
                <div className="w-20 h-7 bg-slate-100 animate-pulse rounded-lg" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
                <NotificationBell />

                {/* Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition cursor-pointer text-slate-700 hover:text-teal-800 ${
                      profileMenuOpen ? 'bg-teal-50/70 text-teal-800 ring-1 ring-teal-200' : 'hover:bg-teal-50/50'
                    }`}
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="true"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-6 h-6 rounded-full object-cover border border-teal-200"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold flex items-center justify-center">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                    <span className="text-sm font-medium max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        profileMenuOpen ? 'rotate-180 text-teal-700' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-50 text-slate-800 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                      {/* User Header */}
                      <div className="px-3.5 py-2.5 bg-slate-50/60">
                        <div className="flex items-center gap-2.5">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="w-9 h-9 rounded-full object-cover border border-teal-200 shrink-0"
                            />
                          ) : (
                            <span className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center justify-center shrink-0">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.phone || user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Navigation Links */}
                      <div className="py-1">
                        <Link
                          href="/bookings"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition group ${
                            isActive('/bookings')
                              ? 'bg-teal-50 text-teal-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <Calendar className={`w-4 h-4 ${isActive('/bookings') ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                          <div className="flex-1">
                            <span>Bookings</span>
                          </div>
                        </Link>

                        <Link
                          href="/addresses"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition group ${
                            isActive('/addresses')
                              ? 'bg-teal-50 text-teal-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <MapPin className={`w-4 h-4 ${isActive('/addresses') ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                          <div className="flex-1">
                            <span>Addresses</span>
                          </div>
                        </Link>

                        <Link
                          href="/profile"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition group ${
                            isActive('/profile')
                              ? 'bg-teal-50 text-teal-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <User className={`w-4 h-4 ${isActive('/profile') ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                          <div className="flex-1">
                            <span>Profile</span>
                          </div>
                        </Link>
                      </div>

                      {/* Role switcher inside dropdown */}
                      {(isAdmin || isProvider) && (
                        <div className="py-1">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setProfileMenuOpen(false);
                                handleModeSwitch(viewMode === 'admin' ? 'customer' : 'admin');
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer text-left"
                            >
                              <ShieldCheck className="w-4 h-4 text-slate-400" />
                              <span>{viewMode === 'admin' ? 'Customer View' : 'Admin Operations'}</span>
                            </button>
                          )}
                          {isProvider && !isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setProfileMenuOpen(false);
                                handleModeSwitch(viewMode === 'provider' ? 'customer' : 'provider');
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer text-left"
                            >
                              <Briefcase className="w-4 h-4 text-slate-400" />
                              <span>{viewMode === 'provider' ? 'Customer View' : 'Provider Portal'}</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Sign Out */}
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-teal-700 transition"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {!showAdminView && !showProviderView && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[80px]">{location.locality || 'Prayagraj'}</span>
              </button>
            )}

            {(isAdmin || isProvider) && (
              <button
                onClick={() => {
                  if (viewMode === 'customer') {
                    handleModeSwitch(isProvider ? 'provider' : 'admin');
                  } else {
                    handleModeSwitch('customer');
                  }
                }}
                className="p-1.5 text-xs text-slate-500"
              >
                {viewMode === 'customer' ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <Store className="w-4 h-4" />
                )}
              </button>
            )}
            {user && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-500 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-5 space-y-3">
          {user && (
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="pb-3 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 -mx-1 px-2 py-1.5 rounded-lg transition"
            >
              <div className="flex items-center gap-2.5">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.phone || user.email}</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">Edit Profile</span>
            </Link>
          )}

          {/* Mobile view mode switcher */}
          {(isAdmin || isProvider) && (
            <div className="flex gap-1 p-0.5 bg-slate-50 rounded-lg border border-slate-100">
              <button
                onClick={() => { handleModeSwitch('customer'); setMobileMenuOpen(false); }}
                className={`flex-1 py-1.5 text-xs rounded-md text-center cursor-pointer ${
                  viewMode === 'customer' ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500'
                }`}
              >
                Customer
              </button>
              {isAdmin && (
                <button
                  onClick={() => { handleModeSwitch('admin'); setMobileMenuOpen(false); }}
                  className={`flex-1 py-1.5 text-xs rounded-md text-center cursor-pointer ${
                    viewMode === 'admin' ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500'
                  }`}
                >
                  Admin
                </button>
              )}
              {isProvider && !isAdmin && (
                <button
                  onClick={() => { handleModeSwitch('provider'); setMobileMenuOpen(false); }}
                  className={`flex-1 py-1.5 text-xs rounded-md text-center cursor-pointer ${
                    viewMode === 'provider' ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500'
                  }`}
                >
                  Provider
                </button>
              )}
            </div>
          )}

          <div className="space-y-0.5">
            {showAdminView ? (
              <>
                {[
                  { href: '/admin', label: 'Dashboard' },
                  { href: '/admin/requests', label: 'Requests' },
                  { href: '/admin/bookings', label: 'Bookings' },
                  { href: '/admin/providers', label: 'Providers' },
                  { href: '/admin/catalogue', label: 'Catalogue' },
                ].map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-50"
                  >{l.label}</Link>
                ))}
              </>
            ) : showProviderView ? (
              <>
                {[
                  { href: '/provider', label: 'Dashboard' },
                  { href: '/provider/requests', label: 'Jobs' },
                  { href: '/provider/services', label: 'Services' },
                  { href: '/provider/availability', label: 'Availability' },
                  { href: '/provider/profile', label: 'Profile' },
                ].map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-50"
                  >{l.label}</Link>
                ))}
              </>
            ) : (
              <>
                <Link href="/" onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-50"
                >Home</Link>
                {user && (
                  <>
                    <Link
                      href="/bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-50"
                    >
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Bookings</span>
                    </Link>
                    <Link
                      href="/addresses"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-50"
                    >
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>Addresses</span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-50 font-medium"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Profile</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {authLoading ? (
            <div className="pt-3 border-t border-slate-100 flex justify-center py-2">
              <div className="w-24 h-6 bg-slate-100 animate-pulse rounded" />
            </div>
          ) : user ? (
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-50 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg"
              >Log in</Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2 text-sm text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition"
              >Sign up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
