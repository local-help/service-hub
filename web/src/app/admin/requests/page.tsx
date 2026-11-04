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
  FileText
} from 'lucide-react';
import { ServiceRequest, RequestStatus } from '../../../types';
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
            Coordination Desk
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Service Requests Management
          </h1>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search reference (LH-...), customer name, or phone..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500"
          />
        </form>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 rounded-xl text-xs font-semibold shrink-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending_review', label: 'Pending Review' },
            { id: 'contacting_provider', label: 'Contacting Provider' },
            { id: 'quotation_sent', label: 'Quote Sent' },
            { id: 'booking_confirmed', label: 'Confirmed' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Content: Desktop Table & Mobile Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => <div key={n} className="h-24 bg-slate-200 animate-pulse rounded-2xl" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Requests Found</h3>
          <p className="text-xs text-slate-500">Try adjusting your status filter or search keywords.</p>
        </div>
      ) : (
        <>
          {/* Desktop Data Table */}
          <div className="hidden lg:block bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Ref #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Provider Assigned</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Direct Contact</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {req.reference_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{req.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{req.customer_phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{req.service_name}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{req.pricing_type.replace('_', ' ')}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {req.provider_name ? (
                        <span className="font-semibold text-slate-800">{req.provider_name}</span>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                          Not Assigned
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <AdminCommunicationButtons
                        customerPhone={req.customer_phone}
                        referenceNumber={req.reference_number}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition inline-block shadow-xs"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-blue-600 font-mono tracking-wide">
                    {req.reference_number}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                    {req.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{req.service_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customer: <strong>{req.customer_name}</strong> ({req.customer_phone})
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Provider: <strong>{req.provider_name || 'None Assigned Yet'}</strong>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <AdminCommunicationButtons
                    customerPhone={req.customer_phone}
                    referenceNumber={req.reference_number}
                  />
                  <Link
                    href={`/admin/requests/${req.id}`}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
                  >
                    Open Details
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
