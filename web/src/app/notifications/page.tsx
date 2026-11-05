'use client';

import React, { useState } from 'react';
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
  ArrowLeft,
  Check,
  Clock,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { AppNotification } from '../../types';

function formatFullTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'booking_confirmed':
      return <CalendarCheck className="w-5 h-5 text-emerald-600" />;
    case 'provider_assigned':
      return <UserCheck className="w-5 h-5 text-teal-600" />;
    case 'job_assigned':
      return <Briefcase className="w-5 h-5 text-teal-600" />;
    case 'booking_in_progress':
      return <Wrench className="w-5 h-5 text-blue-600" />;
    case 'booking_completed':
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    case 'quotation_received':
    case 'quotation_approved':
    case 'quote_approved':
      return <Receipt className="w-5 h-5 text-amber-600" />;
    case 'booking_cancelled':
    case 'job_cancelled':
    case 'quote_rejected':
      return <XCircle className="w-5 h-5 text-rose-600" />;
    case 'welcome':
      return <Sparkles className="w-5 h-5 text-teal-600" />;
    default:
      return <Bell className="w-5 h-5 text-slate-500" />;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const filteredNotifications =
    activeTab === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  const handleAction = (notification: AppNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    const meta = notification.metadata || {};
    if (meta.action_url) {
      router.push(meta.action_url);
    } else if (
      notification.notification_type.startsWith('job_') ||
      notification.notification_type.startsWith('quote_')
    ) {
      router.push('/provider/requests');
    } else if (notification.notification_type.startsWith('booking_')) {
      router.push('/bookings');
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-slate-500">
        Loading notifications…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Bell className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Sign in to view notifications</h2>
        <p className="text-xs text-slate-500 mb-6">
          Access your doorstep bookings, service updates, and provider alerts.
        </p>
        <Link
          href="/login?redirect=/notifications"
          className="inline-flex px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg shadow-xs transition"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-700 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to home</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time updates on your bookings, quotes, and provider status.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer self-start sm:self-auto"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mt-6 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeTab === 'all'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'unread'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'unread' ? 'bg-white text-teal-800' : 'bg-teal-700 text-white'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      {filteredNotifications.length === 0 ? (
        <div className="p-12 border border-slate-200 rounded-2xl text-center bg-slate-50/50 mt-4">
          <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'unread'
              ? 'You have reviewed all your latest alerts. Great job staying up to date!'
              : 'When you create a booking or when jobs are assigned, you will see notifications here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {filteredNotifications.map((notification) => {
            const meta = notification.metadata || {};
            const hasAction =
              Boolean(meta.action_url) ||
              notification.notification_type.startsWith('booking_') ||
              notification.notification_type.startsWith('job_') ||
              notification.notification_type.startsWith('quote_');

            return (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border transition ${
                  !notification.is_read
                    ? 'bg-teal-50/40 border-teal-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    {getNotificationIcon(notification.notification_type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm ${
                            !notification.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
                          }`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatFullTime(notification.created_at)}
                      </span>
                    </div>

                    {notification.body && (
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {notification.body}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {meta.reference_number && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          Ref: {meta.reference_number}
                        </span>
                      )}
                      {meta.amount && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Amount: ₹{Number(meta.amount).toFixed(0)}
                        </span>
                      )}

                      <div className="ml-auto flex items-center gap-2">
                        {!notification.is_read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          >
                            Mark as read
                          </button>
                        )}
                        {hasAction && (
                          <button
                            type="button"
                            onClick={() => handleAction(notification)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
