'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Inbox,
  Calendar,
  Users,
  ArrowRight,
  TrendingUp,
  Activity,
  ChevronRight,
  Wrench,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { ServiceRequest } from '../../types';

interface DashboardData {
  metrics: {
    total_requests: number;
    pending_review: number;
    contacting_provider: number;
    awaiting_quotation: number;
    quotation_sent: number;
    quotation_approved: number;
    confirmed_bookings: number;
    in_progress_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
    total_revenue: number;
    active_providers: number;
    total_customers: number;
  };
  recent_requests: ServiceRequest[];
}

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/admin');
      return;
    }
    if (!isAdmin) {
      router.push('/');
      return;
    }

    apiRequest<DashboardData>('/admin/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, isAdmin, router]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-60 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-16 bg-slate-200 rounded-xl" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const m = data?.metrics;

  const pipelineStages = [
    { label: 'Pending Review', count: m?.pending_review || 0, href: '/admin/requests?status=pending_review', badgeColor: 'bg-amber-100 text-amber-800' },
    { label: 'Specialist Assigned', count: m?.contacting_provider || 0, href: '/admin/requests?status=contacting_provider', badgeColor: 'bg-sky-100 text-sky-800' },
    { label: 'Confirmed', count: m?.confirmed_bookings || 0, href: '/admin/bookings?status=confirmed', badgeColor: 'bg-indigo-100 text-indigo-800' },
    { label: 'In Progress', count: m?.in_progress_bookings || 0, href: '/admin/bookings?status=in_progress', badgeColor: 'bg-blue-100 text-blue-800' },
    { label: 'Completed', count: m?.completed_bookings || 0, href: '/admin/bookings?status=completed', badgeColor: 'bg-emerald-100 text-emerald-800' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Needs Match
          </span>
        );
      case 'contacting_provider':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Specialist Assigned
          </span>
        );
      case 'booking_confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Confirmed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {status.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Sleek Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Operations Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fulfillment, dispatch queue, and platform volume
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(m?.pending_review || 0) > 0 && (
            <Link
              href="/admin/requests?status=pending_review"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Needs Triage ({m?.pending_review})</span>
            </Link>
          )}
          <Link
            href="/admin/requests"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            <span>All Requests</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Triage */}
        <Link
          href="/admin/requests?status=pending_review"
          className="p-4 bg-white rounded-xl border border-slate-200/90 hover:border-amber-400 hover:shadow-xs transition group space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Pending Triage</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Inbox className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {m?.pending_review || 0}
          </div>
          <p className="text-xs text-amber-700 flex items-center gap-1 font-medium">
            {(m?.pending_review || 0) > 0 ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Awaiting specialist match</span>
              </>
            ) : (
              <span className="text-slate-400 font-normal">All requests matched</span>
            )}
          </p>
        </Link>

        {/* Active in Field */}
        <Link
          href="/admin/bookings?status=confirmed,in_progress"
          className="p-4 bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 hover:shadow-xs transition group space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Active in Field</span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {(m?.confirmed_bookings || 0) + (m?.in_progress_bookings || 0)}
          </div>
          <p className="text-xs text-slate-500">
            <strong className="text-slate-700">{m?.in_progress_bookings || 0}</strong> on-site • <strong className="text-slate-700">{m?.confirmed_bookings || 0}</strong> confirmed
          </p>
        </Link>

        {/* Total Collected Revenue */}
        <Link
          href="/admin/bookings?status=completed"
          className="p-4 bg-white rounded-xl border border-slate-200/90 hover:border-emerald-400 hover:shadow-xs transition group space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Revenue Collected</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{(m?.total_revenue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500">
            <strong className="text-slate-700">{m?.completed_bookings || 0}</strong> fulfilled bookings
          </p>
        </Link>

        {/* Network Coverage */}
        <Link
          href="/admin/providers"
          className="p-4 bg-white rounded-xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-xs transition group space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Network Capacity</span>
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {m?.active_providers || 0} <span className="text-xs font-normal text-slate-500">Specialists</span>
          </div>
          <p className="text-xs text-slate-500">
            Across <strong className="text-slate-700">{m?.total_customers || 0}</strong> registered clients
          </p>
        </Link>
      </div>

      {/* Compact Horizontal Pipeline Strip */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 mb-2 border-b border-slate-100 text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            Fulfillment Pipeline Lifecycle
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Click any stage to filter</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {pipelineStages.map((stage) => (
            <Link
              key={stage.label}
              href={stage.href}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50/70 hover:bg-slate-100 border border-slate-200/60 transition group text-xs"
            >
              <span className="font-medium text-slate-600 truncate group-hover:text-slate-900 text-[11px]">
                {stage.label}
              </span>
              <span className={`ml-2 px-1.5 py-0.5 rounded font-bold text-xs ${stage.badgeColor}`}>
                {stage.count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Requests Queue */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Recent Service Inquiries
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Incoming customer requests requiring triage or provider assignment
            </p>
          </div>
          <Link
            href="/admin/requests"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <span>View All ({m?.total_requests || 0})</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200/60">
              <tr>
                <th className="py-3 px-5">Ref #</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Service</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recent_requests?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No recent inquiries found.
                  </td>
                </tr>
              ) : (
                data?.recent_requests?.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3 px-5">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {req.reference_number}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <div className="font-semibold text-slate-900">{req.customer_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{req.customer_phone}</div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="font-medium text-slate-800">{req.service_name}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        {req.pricing_type?.replace('_', ' ') || 'Fixed Price'}
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="py-3 px-5 text-slate-500">
                      {new Date(req.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
