'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  ArrowRight, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { Booking } from '../../types';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { CustomerSupportButtons } from '../../components/ui/SupportButtons';

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login?redirect=/bookings');
      return;
    }

    apiRequest<{ bookings: Booking[] } | Booking[]>('/bookings')
      .then((data) => {
        const bks = Array.isArray(data) ? data : (data as any).bookings || [];
        setBookings(bks);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md">Reviewing Scope</span>;
      case 'contacting_provider':
        return <span className="bg-sky-50 text-sky-700 text-[11px] font-medium px-2 py-0.5 rounded-md">Specialist Assigned</span>;
      case 'confirmed':
        return <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">Confirmed</span>;
      case 'rescheduled':
        return <span className="bg-amber-50 text-amber-700 text-[11px] font-medium px-2 py-0.5 rounded-md">Rescheduled</span>;
      case 'in_progress':
        return <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold px-2 py-0.5 rounded-md">On-Site / Active</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-md">Completed</span>;
      case 'cancelled':
        return <span className="bg-rose-50 text-rose-700 text-[11px] font-medium px-2 py-0.5 rounded-md">Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-md capitalize">{status.replace(/_/g, ' ')}</span>;
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'active') {
      return ['pending_review', 'contacting_provider', 'confirmed', 'in_progress', 'rescheduled'].includes(b.status);
    }
    if (activeTab === 'completed') {
      return ['completed', 'cancelled'].includes(b.status);
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            My Bookings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your scheduled visits, specialist arrivals, and transparent fixed-price invoices in Prayagraj
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition self-start sm:self-center shadow-xs"
        >
          <span>Book New Service</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { key: 'all', label: `All (${bookings.length})` },
          { 
            key: 'active', 
            label: `Active & Scheduled (${bookings.filter(b => ['pending_review', 'contacting_provider', 'confirmed', 'in_progress', 'rescheduled'].includes(b.status)).length})` 
          },
          { 
            key: 'completed', 
            label: `Completed & History (${bookings.filter(b => ['completed', 'cancelled'].includes(b.status)).length})` 
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 text-xs rounded-lg transition font-medium cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading || authLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => <div key={n} className="h-28 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="border border-slate-200 rounded-xl p-12 text-center max-w-sm mx-auto space-y-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 mx-auto">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            {activeTab === 'all' ? 'No bookings found' : `No bookings in this filter`}
          </h3>
          <p className="text-xs text-slate-400">
            Explore our doorstep services in Prayagraj and book a verified technician.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-teal-700 text-white text-xs font-medium rounded-lg hover:bg-teal-800 transition shadow-xs"
          >
            Explore Services
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-xs"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-medium text-slate-600">
                    {b.reference_number}
                  </span>
                  {getStatusBadge(b.status)}
                  {b.scheduled_at ? (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        {new Date(b.scheduled_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </span>
                  ) : b.preferred_at ? (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        Preferred: {new Date(b.preferred_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                  ) : null}
                </div>

                <h3 className="text-sm font-semibold text-slate-900">
                  {b.service_name || 'Doorstep Service'}
                </h3>

                {b.description && (
                  <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                    {b.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs pt-0.5">
                  <span className="text-slate-500">
                    Fixed Rate: <strong className="text-slate-900">₹{b.payment_amount || b.total_paid || 499}</strong>
                  </span>
                  <span className={b.fully_paid ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-medium'}>
                    {b.fully_paid ? 'Fully Paid' : 'Pay at Doorstep'}
                  </span>
                  {b.provider_name && (
                    <span className="text-slate-400 border-l border-slate-200 pl-3">
                      Specialist: <strong className="text-slate-700">{b.provider_name}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                <CustomerSupportButtons
                  referenceNumber={b.reference_number}
                  serviceName={b.service_name}
                />
                <Link
                  href={`/bookings/${b.id}`}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-xs"
                >
                  <span>Manage Booking</span>
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
