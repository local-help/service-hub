'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  CalendarCheck,
  Briefcase,
  UserCheck,
  Wrench,
  XCircle,
  Receipt,
  Sparkles,
  ChevronRight,
  Check,
  Clock,
  Loader2
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { AppNotification } from '../../types';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'booking_confirmed':
      return <CalendarCheck className="w-4 h-4 text-emerald-600" />;
    case 'provider_assigned':
      return <UserCheck className="w-4 h-4 text-teal-600" />;
    case 'job_assigned':
      return <Briefcase className="w-4 h-4 text-teal-600" />;
    case 'booking_in_progress':
      return <Wrench className="w-4 h-4 text-blue-600" />;
    case 'booking_completed':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'quotation_received':
    case 'quotation_approved':
    case 'quote_approved':
      return <Receipt className="w-4 h-4 text-amber-600" />;
    case 'booking_cancelled':
    case 'job_cancelled':
    case 'quote_rejected':
      return <XCircle className="w-4 h-4 text-rose-600" />;
    case 'welcome':
      return <Sparkles className="w-4 h-4 text-teal-600" />;
    default:
      return <Bell className="w-4 h-4 text-slate-500" />;
  }
}

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleItemClick = (notification: AppNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

    // Resolve target route
    const meta = notification.metadata || {};
    if (meta.action_url) {
      router.push(meta.action_url);
    } else if (notification.notification_type.startsWith('job_') || notification.notification_type.startsWith('quote_')) {
      router.push('/provider/requests');
    } else if (notification.notification_type.startsWith('booking_')) {
      router.push('/bookings');
    } else {
      router.push('/notifications');
    }
  };

  const recentList = notifications.slice(0, 6);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
        aria-label="View notifications"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-teal-700 rounded-full border border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-medium bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-teal-700" />
                <span className="text-xs">Loading updates…</span>
              </div>
            ) : recentList.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-700">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You'll be notified about your doorstep bookings and jobs here.
                </p>
              </div>
            ) : (
              recentList.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleItemClick(notification)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer group ${
                    !notification.is_read ? 'bg-teal-50/30' : 'bg-white'
                  }`}
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                    {getNotificationIcon(notification.notification_type)}
                  </div>

                  {/* Text details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <p
                        className={`text-xs truncate ${
                          !notification.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(notification.created_at)}
                      </span>
                    </div>

                    {notification.body && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {notification.body}
                      </p>
                    )}
                  </div>

                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 transition"
            >
              <span>View all notifications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
