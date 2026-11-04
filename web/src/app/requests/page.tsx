'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, Clock, AlertCircle } from 'lucide-react';
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
    switch (status) {
      case 'pending_review':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200/50 text-[11px] font-bold px-2.5 py-1 rounded-full">Pending Admin Review</span>;
      case 'contacting_provider':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200/50 text-[11px] font-bold px-2.5 py-1 rounded-full">Contacting Specialist</span>;
      case 'quotation_sent':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/50 text-[11px] font-bold px-2.5 py-1 rounded-full animate-pulse">Quotation Ready for Approval</span>;
      case 'quotation_approved':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[11px] font-bold px-2.5 py-1 rounded-full">Quotation Approved</span>;
      case 'booking_confirmed':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[11px] font-bold px-2.5 py-1 rounded-full">Booking Confirmed</span>;
      case 'in_progress':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200/50 text-[11px] font-bold px-2.5 py-1 rounded-full">In Progress</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full">Completed</span>;
      case 'cancelled':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200/50 text-[11px] font-bold px-2.5 py-1 rounded-full">Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Service Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track status, review quotations, and coordinate with customer care
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition self-start sm:self-center"
        >
          <span>Request New Service</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => <div key={n} className="h-28 bg-slate-200 animate-pulse rounded-2xl" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Service Requests Yet</h3>
          <p className="text-xs text-slate-500">
            Browse our verified local services and submit your first doorstep request.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs"
          >
            Explore Services
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 sm:p-6 shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-sm font-black text-blue-600 tracking-wide font-mono">
                    {req.reference_number}
                  </span>
                  {getStatusBadge(req.status)}
                  <span className="text-xs text-slate-400">
                    {new Date(req.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {req.service_name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                  {req.description}
                </p>

                {req.has_quotation && req.quotation_status === 'pending' && (
                  <div className="inline-flex items-center gap-2 p-2 rounded-lg bg-indigo-50 text-indigo-800 text-xs font-medium border border-indigo-200/50">
                    <span>Quotation: <strong>₹{req.quotation_amount}</strong></span>
                    <span>•</span>
                    <span className="text-indigo-600 font-bold">Action Required</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <CustomerSupportButtons
                  referenceNumber={req.reference_number}
                  serviceName={req.service_name}
                />
                <Link
                  href={`/requests/${req.id}`}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomerSupportButtons variant="banner" />
    </div>
  );
}

