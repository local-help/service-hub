'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  TrendingUp, 
  Layers, 
  Calendar, 
  MapPin, 
  Phone,
  ShieldCheck,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { ProviderAssignment } from '../../types';

interface DashboardData {
  provider: {
    id: number;
    name: string;
    contact_person?: string;
    contact_phone?: string;
    contact_email?: string;
    verification_status: string;
    operational_status: string;
    city: string;
    eligible_for_assignment: boolean;
  };
  user: {
    id: number;
    name: string;
    role: string;
  };
  stats: {
    pending_assignments_count: number;
    active_requests_count: number;
    completed_count: number;
    rejected_count: number;
    services_count: number;
  };
  availability?: {
    is_available: boolean;
    currently_available: boolean;
    operating_days: string[];
    working_hours_start: string;
    working_hours_end: string;
  };
  recent_assignments: ProviderAssignment[];
}

export default function ProviderDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<DashboardData>('/provider/dashboard');
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.error || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleQuickAccept = async (assignmentId: number) => {
    try {
      setActionLoadingId(assignmentId);
      await apiRequest(`/provider/requests/${assignmentId}/accept`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Accepted from dashboard' }),
      });
      await fetchDashboard();
    } catch (err: any) {
      alert(err.error || 'Could not accept assignment');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5" />
          <span>Error loading provider dashboard</span>
        </div>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { provider, stats, availability, recent_assignments } = data;

  return (
    <div className="space-y-8">
      {/* Provider Status Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E7E2D8] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#176B65]/10 border border-[#176B65]/20 flex items-center justify-center text-[#176B65] shrink-0 font-bold text-lg">
              {provider.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#242D2B]">{provider.name}</h2>
                {provider.verification_status === 'verified' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Provider
                  </span>
                )}
                {provider.verification_status === 'pending' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Under Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Primary contact: <strong className="text-slate-700">{provider.contact_person || 'N/A'}</strong> ({provider.contact_phone}) • Prayagraj (Allahabad)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${availability?.currently_available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span className="font-medium text-slate-700">
                {availability?.currently_available ? 'Accepting Orders' : 'Offline / Unavailable'}
              </span>
            </div>
            <Link
              href="/provider/availability"
              className="text-xs text-[#176B65] font-semibold hover:underline"
            >
              Configure Hours →
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Requests */}
        <Link
          href="/provider/requests?status=assigned"
          className="group p-5 bg-white rounded-2xl border border-[#E7E2D8] hover:border-[#176B65] hover:shadow-md transition relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Needs Review
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#242D2B]">
              {stats.pending_assignments_count}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              New assigned requests waiting for response
            </p>
          </div>
          {stats.pending_assignments_count > 0 && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-amber-500 rounded-bl-lg"></span>
          )}
        </Link>

        {/* In Progress */}
        <Link
          href="/provider/requests?status=in_progress,accepted"
          className="group p-5 bg-white rounded-2xl border border-[#E7E2D8] hover:border-[#176B65] hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Active In-Service
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#242D2B]">
              {stats.active_requests_count}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Accepted or active customer jobs
            </p>
          </div>
        </Link>

        {/* Completed Jobs */}
        <Link
          href="/provider/requests?status=completed"
          className="group p-5 bg-white rounded-2xl border border-[#E7E2D8] hover:border-[#176B65] hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Completed
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#242D2B]">
              {stats.completed_count}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Successfully fulfilled service requests
            </p>
          </div>
        </Link>

        {/* Active Services */}
        <Link
          href="/provider/services"
          className="group p-5 bg-white rounded-2xl border border-[#E7E2D8] hover:border-[#176B65] hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Catalogue Services
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#176B65] flex items-center justify-center group-hover:scale-110 transition">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#242D2B]">
              {stats.services_count}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authorised services you are configured to offer
            </p>
          </div>
        </Link>
      </div>

      {/* Actionable Urgent Requests Queue */}
      {stats.pending_assignments_count > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Incoming Assignments Requiring Immediate Acceptance</span>
            </div>
            <Link
              href="/provider/requests?status=assigned"
              className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1"
            >
              View all ({stats.pending_assignments_count})
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recent_assignments
              .filter((a) => a.status === 'assigned')
              .map((assignment) => {
                const req = assignment.service_request;
                if (!req) return null;
                return (
                  <div
                    key={assignment.id}
                    className="p-4 bg-white rounded-xl border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {req.reference_number}
                        </span>
                        <h4 className="font-semibold text-sm text-[#242D2B]">{req.service_name}</h4>
                        {req.service_variant_name && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-[#176B65] font-medium">
                            {req.service_variant_name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                        {req.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                        <span>👤 {req.customer_name}</span>
                        <span>📍 {req.address?.city || 'Prayagraj'}</span>
                        {req.preferred_at && (
                          <span>🕒 Preferred: {new Date(req.preferred_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/provider/requests/${assignment.id}`}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                      >
                        Inspect Details
                      </Link>
                      <button
                        onClick={() => handleQuickAccept(assignment.id)}
                        disabled={actionLoadingId === assignment.id}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#176B65] text-white hover:bg-[#12534E] transition disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {actionLoadingId === assignment.id ? 'Accepting...' : 'Accept Assignment'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Recent Assignments Table */}
      <div className="bg-white rounded-2xl border border-[#E7E2D8] overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#E7E2D8] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#242D2B]">Recent Assigned Work</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              History of jobs routed to your organisation
            </p>
          </div>
          <Link
            href="/provider/requests"
            className="text-xs font-semibold text-[#176B65] hover:underline flex items-center gap-1"
          >
            All Requests
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent_assignments.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-semibold text-slate-700">No requests assigned yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              When Super Admins route customer bookings matching your services in Prayagraj, they will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E7E2D8]">
            {recent_assignments.map((assignment) => {
              const req = assignment.service_request;
              if (!req) return null;

              const statusColor =
                assignment.status === 'assigned'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : assignment.status === 'accepted'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : assignment.status === 'in_progress'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : assignment.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200';

              return (
                <div
                  key={assignment.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600">
                        {req.reference_number}
                      </span>
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}>
                        {assignment.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        Assigned {new Date(assignment.assigned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm text-[#242D2B]">
                      {req.service_name}
                      {req.service_variant_name && (
                        <span className="text-slate-500 font-normal ml-1">({req.service_variant_name})</span>
                      )}
                    </h4>

                    <p className="text-xs text-slate-500">
                      Customer: <strong>{req.customer_name}</strong> • {req.address?.formatted || req.address?.city || 'Prayagraj'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {req.active_quotation && (
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Quotation</span>
                        <strong className="text-sm text-[#176B65]">₹{req.active_quotation.amount}</strong>
                      </div>
                    )}
                    <Link
                      href={`/provider/requests/${assignment.id}`}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white hover:border-[#176B65] hover:text-[#176B65] transition flex items-center gap-1 shadow-2xs"
                    >
                      Manage
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

