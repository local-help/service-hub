'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, ArrowRight, Clock } from 'lucide-react';
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
        return <span className="bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2 py-0.5 rounded-md">Confirmed</span>;
      case 'rescheduled':
        return <span className="bg-amber-50 text-amber-700 text-[11px] font-medium px-2 py-0.5 rounded-md">Rescheduled</span>;
      case 'in_progress':
        return <span className="bg-blue-50 text-blue-700 text-[11px] font-medium px-2 py-0.5 rounded-md">On-Site</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-md">Completed</span>;
      case 'cancelled':
        return <span className="bg-rose-50 text-rose-700 text-[11px] font-medium px-2 py-0.5 rounded-md">Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-md capitalize">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          My Bookings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Confirmed doorstep services, schedules, and payment receipts
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => <div key={n} className="h-24 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="border border-slate-200 rounded-xl p-12 text-center max-w-sm mx-auto space-y-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 mx-auto">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No confirmed bookings</h3>
          <p className="text-xs text-slate-400">
            Submit a service request or approve a quotation to schedule.
          </p>
          <Link
            href="/requests"
            className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg"
          >
            Check Requests
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-medium text-slate-600">
                    {b.reference_number}
                  </span>
                  {getStatusBadge(b.status)}
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(b.scheduled_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}</span>
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900">
                  {b.service_name}
                </h3>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">
                    Payable: <strong className="text-slate-900">₹{b.payment_amount}</strong>
                  </span>
                  <span className={b.fully_paid ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                    {b.fully_paid ? 'Paid' : `Pending: ₹${(b.payment_amount || 0) - (b.total_paid || 0)}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <CustomerSupportButtons
                  referenceNumber={b.reference_number}
                  serviceName={b.service_name}
                />
                <Link
                  href={`/bookings/${b.id}`}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition flex items-center gap-1"
                >
                  <span>Manage</span>
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
