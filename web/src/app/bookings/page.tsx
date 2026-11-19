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
  CheckCircle2,
  Sparkles,
  Receipt,
  UserCheck
} from 'lucide-react';
import { Booking } from '../../types';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { CustomerSupportButtons } from '../../components/ui/SupportButtons';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchBookings = async () => {
    try {
      const bookingsRes = await apiRequest<{ bookings: Booking[] } | Booking[]>('/bookings');
      const bks: Booking[] = Array.isArray(bookingsRes) 
        ? bookingsRes 
        : (bookingsRes as any)?.bookings || [];

      // Sort newest first
      bks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setBookings(bks);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login?redirect=/bookings');
      return;
    }

    fetchBookings();
  }, [user, authLoading, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_assignment':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Matching Specialist</span>
          </span>
        );
      case 'specialist_assigned':
        return (
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-indigo-600" />
            <span>Specialist Assigned</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Confirmed Appointment</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Specialist On-Site</span>
          </span>
        );
      case 'rescheduled':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium px-2 py-0.5 rounded-md">
            Rescheduled
          </span>
        );
      case 'completed':
        return (
          <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-medium px-2 py-0.5 rounded-md">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-md capitalize">
            {status.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'active') {
      return ['pending_assignment', 'specialist_assigned', 'confirmed', 'in_progress', 'rescheduled'].includes(b.status);
    }
    if (activeTab === 'completed') {
      return b.status === 'completed';
    }
    if (activeTab === 'cancelled') {
      return b.status === 'cancelled';
    }
    return true;
  });

  const activeCount = bookings.filter((b) => 
    ['pending_assignment', 'specialist_assigned', 'confirmed', 'in_progress', 'rescheduled'].includes(b.status)
  ).length;

  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            My Bookings & Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track confirmed technician appointments, arrival schedules, and guaranteed fixed-price receipts in Prayagraj
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
          { key: 'all', label: `All Bookings (${bookings.length})` },
          { key: 'active', label: `Active & Scheduled (${activeCount})` },
          { key: 'completed', label: `Completed (${completedCount})` },
          { key: 'cancelled', label: `Cancelled (${cancelledCount})` },
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
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="border border-slate-200 rounded-2xl p-12 text-center max-w-sm mx-auto space-y-3 bg-white shadow-xs">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mx-auto">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            {activeTab === 'all' ? 'No bookings found' : `No bookings in this filter`}
          </h3>
          <p className="text-xs text-slate-400">
            Explore our doorstep services in Prayagraj and book a verified technician at fixed guaranteed rates.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 transition shadow-xs"
          >
            Explore Services
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => {
            const timing = b.scheduled_at || b.preferred_at;
            const effectivePrice = b.total_amount ? Number(b.total_amount) : (b.payment_amount ? Number(b.payment_amount) : 499);

            return (
              <div
                key={b.id}
                className="border border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {b.reference_number || `BK-${b.id}`}
                    </span>

                    {getStatusBadge(b.status)}

                    {timing && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(timing).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                    {b.service_name || b.service?.name || 'Doorstep Service'}
                  </h3>

                  {/* Price and Details row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
                    <span className="text-slate-600">
                      Guaranteed Rate: <strong className="text-slate-900 font-bold">₹{effectivePrice.toLocaleString('en-IN')}</strong>
                    </span>
                    <span className={b.fully_paid ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-medium'}>
                      {b.fully_paid ? '● Fully Settled' : '○ Pay at Doorstep'}
                    </span>

                    {(b.provider_name || b.provider?.name) && (
                      <span className="text-slate-500 border-l border-slate-200 pl-3 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>Specialist: <strong className="text-slate-800">{b.provider_name || b.provider?.name}</strong></span>
                      </span>
                    )}

                    {b.address && (
                      <span className="text-slate-400 border-l border-slate-200 pl-3 truncate max-w-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{b.address.city || b.address.address_line}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <CustomerSupportButtons
                    referenceNumber={b.reference_number || `BK-${b.id}`}
                    serviceName={b.service_name || b.service?.name || 'Service'}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
