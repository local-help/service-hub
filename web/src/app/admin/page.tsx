'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Inbox, 
  Clock, 
  Send, 
  CheckCircle, 
  Calendar, 
  CreditCard, 
  Users, 
  Wrench, 
  ArrowRight,
  TrendingUp,
  AlertCircle
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
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <div key={n} className="h-28 bg-slate-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const m = data?.metrics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
            Central Coordination Desk
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Operational Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/requests?status=pending_review"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            Review Pending ({m?.pending_review || 0})
          </Link>
          <Link
            href="/admin/requests"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            All Requests
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Review */}
        <Link
          href="/admin/requests?status=pending_review"
          className="bg-white border border-slate-200/80 hover:border-amber-400 rounded-2xl p-5 shadow-xs transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Pending Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{m?.pending_review || 0}</p>
          <span className="text-[11px] text-amber-600 font-medium">Needs provider coordination →</span>
        </Link>

        {/* Contacting Provider */}
        <Link
          href="/admin/requests?status=contacting_provider"
          className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-2xl p-5 shadow-xs transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Awaiting Provider Quote</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{m?.contacting_provider || 0}</p>
          <span className="text-[11px] text-blue-600 font-medium">Create quotation after reply →</span>
        </Link>

        {/* Quotations Sent */}
        <Link
          href="/admin/requests?status=quotation_sent"
          className="bg-white border border-slate-200/80 hover:border-indigo-400 rounded-2xl p-5 shadow-xs transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Quotes Awaiting Customer</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{m?.quotation_sent || 0}</p>
          <span className="text-[11px] text-indigo-600 font-medium">Awaiting customer approval →</span>
        </Link>

        {/* Confirmed Bookings */}
        <Link
          href="/admin/bookings?status=confirmed"
          className="bg-white border border-slate-200/80 hover:border-emerald-400 rounded-2xl p-5 shadow-xs transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Confirmed Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{m?.confirmed_bookings || 0}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Scheduled for delivery →</span>
        </Link>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-bold block mb-1">Total Revenue</span>
          <p className="text-2xl font-black">₹{m?.total_revenue?.toLocaleString('en-IN') || 0}</p>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3 h-3" /> Online & offline collected
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5">
          <span className="text-xs text-slate-500 font-bold block mb-1">Total Requests</span>
          <p className="text-2xl font-black text-slate-900">{m?.total_requests || 0}</p>
          <span className="text-[11px] text-slate-400">All-time volume</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5">
          <span className="text-xs text-slate-500 font-bold block mb-1">Active Specialists</span>
          <p className="text-2xl font-black text-slate-900">{m?.active_providers || 0}</p>
          <span className="text-[11px] text-slate-400">In directory</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5">
          <span className="text-xs text-slate-500 font-bold block mb-1">Registered Customers</span>
          <p className="text-2xl font-black text-slate-900">{m?.total_customers || 0}</p>
          <span className="text-[11px] text-slate-400">Prayagraj clients</span>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Recent Service Requests</h3>
          <Link href="/admin/requests" className="text-xs font-bold text-blue-600 hover:underline">
            View All Requests →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-y border-slate-200/60">
              <tr>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recent_requests?.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    {req.reference_number}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div>{req.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{req.customer_phone}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {req.service_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                      {req.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(req.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/admin/requests/${req.id}`}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-block"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

