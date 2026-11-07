'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Phone, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  FileText,
  X,
  ChevronRight,
  Sparkles,
  Inbox
} from 'lucide-react';
import { ServiceRequest } from '../../../types';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminCommunicationButtons } from '../../../components/ui/SupportButtons';

function AdminRequestsContent() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');

  const fetchRequests = () => {
    setLoading(true);
    let url = `/admin/service_requests?`;
    if (statusFilter && statusFilter !== 'all') url += `status=${statusFilter}&`;
    if (q) url += `q=${encodeURIComponent(q)}&`;

    apiRequest<{ service_requests: ServiceRequest[] } | ServiceRequest[]>(url)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).service_requests || [];
        setRequests(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/login?redirect=/admin/requests');
      return;
    }
    fetchRequests();
  }, [user, isAdmin, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const clearSearch = () => {
    setQ('');
    let url = `/admin/service_requests?`;
    if (statusFilter && statusFilter !== 'all') url += `status=${statusFilter}&`;
    setLoading(true);
    apiRequest<{ service_requests: ServiceRequest[] } | ServiceRequest[]>(url)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).service_requests || [];
        setRequests(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const filterTabs = [
    { id: 'all', label: 'All Inquiries' },
    { id: 'pending_review', label: 'Pending Review' },
    { id: 'contacting_provider', label: 'Specialist Assigned' },
    { id: 'booking_confirmed', label: 'Confirmed' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Coordination Desk • Prayagraj
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Service Requests Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review customer needs, assign eligible specialists, formulate custom estimates, and monitor booking confirmations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            Total: {requests.length} {statusFilter !== 'all' ? `(${statusFilter.replace('_', ' ')})` : ''}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search reference (LH-...), customer name, or phone number..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50/70 border border-slate-200/90 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition"
            />
            {q && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <button
            onClick={() => fetchRequests()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
          >
            Apply Search
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {filterTabs.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Requests Content: Desktop Table & Mobile Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 bg-slate-200/70 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No Service Requests Found</h3>
          <p className="text-xs text-slate-500">
            {q ? `No results matching "${q}". Try clearing search.` : 'No requests currently match this filter criteria.'}
          </p>
          {(q || statusFilter !== 'all') && (
            <button
              onClick={() => { setQ(''); setStatusFilter('all'); }}
              className="mt-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Data Table */}
          <div className="hidden lg:block bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="py-3.5 px-5">Ref Number</th>
                  <th className="py-3.5 px-5">Customer Profile</th>
                  <th className="py-3.5 px-5">Service Requested</th>
                  <th className="py-3.5 px-5">Specialist Assigned</th>
                  <th className="py-3.5 px-5">Workflow State</th>
                  <th className="py-3.5 px-5">Direct Contact</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition group">
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-200/60">
                        {req.reference_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{req.customer_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{req.customer_phone}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{req.service_name}</div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {req.pricing_type?.replace('_', ' ') || 'Service'}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      {req.provider_name ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {req.provider_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Needs Match
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${
                        req.status === 'pending_review'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                          : req.status === 'contacting_provider'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200/70'
                          : req.status === 'booking_confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          req.status === 'pending_review' ? 'bg-amber-500 animate-pulse' :
                          req.status === 'contacting_provider' ? 'bg-sky-500' :
                          req.status === 'booking_confirmed' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`} />
                        {req.status === 'contacting_provider' ? 'Specialist Assigned' : req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <AdminCommunicationButtons
                        customerPhone={req.customer_phone}
                        referenceNumber={req.reference_number}
                      />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                    {req.reference_number}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    req.status === 'pending_review'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : req.status === 'contacting_provider'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {req.status === 'contacting_provider' ? 'Specialist Assigned' : req.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{req.service_name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Customer: <span className="font-semibold text-slate-800">{req.customer_name}</span> ({req.customer_phone})
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Specialist: <span className="font-semibold text-slate-800">{req.provider_name || 'Needs Match'}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <AdminCommunicationButtons
                    customerPhone={req.customer_phone}
                    referenceNumber={req.reference_number}
                  />
                  <Link
                    href={`/admin/requests/${req.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminRequestsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">Loading requests...</div>}>
      <AdminRequestsContent />
    </Suspense>
  );
}
