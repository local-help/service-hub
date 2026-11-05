'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { ServiceRequest } from '../../types';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { CustomerSupportButtons } from '../../components/ui/SupportButtons';

export default function RequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/requests');
      return;
    }

    apiRequest<{ service_requests: ServiceRequest[] } | ServiceRequest[]>('/service_requests')
      .then((data) => {
        const reqs = Array.isArray(data) ? data : (data as any).service_requests || [];
        setRequests(reqs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, router]);

  const getStatusBadge = (status: string) => {
    const format = status.replace(/_/g, ' ');
    switch (status) {
      case 'pending_review':
        return <span className="bg-amber-50 text-amber-700 text-[11px] font-medium px-2 py-0.5 rounded-md">Pending Review</span>;
      case 'contacting_provider':
        return <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md">Matching Provider</span>;
      case 'quotation_sent':
        return <span className="bg-blue-50 text-blue-700 text-[11px] font-medium px-2 py-0.5 rounded-md">Quote Ready</span>;
      case 'quotation_approved':
      case 'booking_confirmed':
        return <span className="bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2 py-0.5 rounded-md">Confirmed</span>;
      case 'in_progress':
        return <span className="bg-blue-50 text-blue-700 text-[11px] font-medium px-2 py-0.5 rounded-md">In Progress</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-md">Completed</span>;
      case 'cancelled':
        return <span className="bg-rose-50 text-rose-700 text-[11px] font-medium px-2 py-0.5 rounded-md">Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-md capitalize">{format}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            My Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track status, quotes, and coordination updates
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition self-start sm:self-center"
        >
          <span>New Request</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => <div key={n} className="h-24 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="border border-slate-200 rounded-xl p-12 text-center max-w-sm mx-auto space-y-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 mx-auto">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No requests yet</h3>
          <p className="text-xs text-slate-400">
            Submit a request to book doorstep services in Prayagraj.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg"
          >
            Explore Services
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-medium text-slate-600">
                    {req.reference_number}
                  </span>
                  {getStatusBadge(req.status)}
                  <span className="text-xs text-slate-400">
                    {new Date(req.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900">
                  {req.service_name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                  {req.description}
                </p>

                {req.has_quotation && req.quotation_status === 'pending' && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                    <span>Quote: ₹{req.quotation_amount}</span>
                    <span>•</span>
                    <span className="font-medium">Action Required</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <CustomerSupportButtons
                  referenceNumber={req.reference_number}
                  serviceName={req.service_name}
                />
                <Link
                  href={`/requests/${req.id}`}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition flex items-center gap-1"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
