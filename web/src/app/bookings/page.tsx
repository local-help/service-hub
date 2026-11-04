'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { Booking } from '../../types';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { CustomerSupportButtons } from '../../components/ui/SupportButtons';

export default function BookingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [user, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[11px] font-bold px-2.5 py-1 rounded-full">Confirmed</span>;
      case 'rescheduled':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200/50 text-[11px] font-bold px-2.5 py-1 rounded-full">Rescheduled</span>;
      case 'in_progress':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200/50 text-[11px] font-bold px-2.5 py-1 rounded-full">Technician On-Site</span>;
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
            My Bookings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Confirmed doorstep services, schedules, and payment receipts
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => <div key={n} className="h-28 bg-slate-200 animate-pulse rounded-2xl" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Confirmed Bookings Yet</h3>
          <p className="text-xs text-slate-500">
            Submit a service request or approve a pending quotation to schedule your service.
          </p>
          <Link
            href="/requests"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs"
          >
            Check Requests
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 sm:p-6 shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-sm font-black text-blue-600 tracking-wide font-mono">
                    {b.reference_number}
                  </span>
                  {getStatusBadge(b.status)}
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(b.scheduled_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {b.service_name}
                </h3>

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">
                    Amount: <strong className="text-slate-900">₹{b.payment_amount}</strong>
                  </span>
                  <span className={b.fully_paid ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                    {b.fully_paid ? '✓ Fully Paid' : `Pending Payment (Paid: ₹${b.total_paid})`}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <CustomerSupportButtons
                  referenceNumber={b.reference_number}
                  serviceName={b.service_name}
                />
                <Link
                  href={`/bookings/${b.id}`}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <span>Manage</span>
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

