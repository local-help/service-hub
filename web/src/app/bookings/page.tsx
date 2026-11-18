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
  Sparkles,
  Receipt,
  UserCheck
} from 'lucide-react';
import { Booking, ServiceRequest } from '../../types';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { CustomerSupportButtons } from '../../components/ui/SupportButtons';

export type UnifiedOrderItem =
  | {
      kind: 'booking';
      id: string;
      rawId: number;
      data: Booking;
      serviceName: string;
      referenceNumber: string;
      status: string;
      createdAt: string;
      scheduledAt?: string | null;
      amount?: number | null;
      fullyPaid?: boolean;
      providerName?: string | null;
      address?: string | null;
    }
  | {
      kind: 'request';
      id: string;
      rawId: number;
      data: ServiceRequest;
      serviceName: string;
      referenceNumber: string;
      status: string;
      createdAt: string;
      preferredAt?: string | null;
      quotationAmount?: number | null;
      hasQuotation: boolean;
      quotationStatus?: string | null;
      providerName?: string | null;
      address?: string | null;
    };

type FilterTab = 'all' | 'active' | 'in_review' | 'completed';

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<UnifiedOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchOrders = async () => {
    try {
      const [bookingsRes, requestsRes] = await Promise.all([
        apiRequest<{ bookings: Booking[] } | Booking[]>('/bookings').catch(() => []),
        apiRequest<{ service_requests: ServiceRequest[] } | ServiceRequest[]>('/service_requests').catch(() => [])
      ]);

      const bks: Booking[] = Array.isArray(bookingsRes) 
        ? bookingsRes 
        : (bookingsRes as any)?.bookings || [];

      const reqs: ServiceRequest[] = Array.isArray(requestsRes)
        ? requestsRes
        : (requestsRes as any)?.service_requests || [];

      // Collect request IDs that already have an associated confirmed booking
      const bookedRequestIds = new Set<number>();
      bks.forEach((b) => {
        if (b.service_request_id) bookedRequestIds.add(b.service_request_id);
        if (b.service_request?.id) bookedRequestIds.add(b.service_request.id);
      });

      const items: UnifiedOrderItem[] = [];

      // 1. Add all bookings
      bks.forEach((b) => {
        items.push({
          kind: 'booking',
          id: `booking_${b.id}`,
          rawId: b.id,
          data: b,
          serviceName: b.service_name || b.service?.name || 'Doorstep Service',
          referenceNumber: b.reference_number || `BK-${b.id}`,
          status: b.status,
          createdAt: b.created_at,
          scheduledAt: b.scheduled_at || b.preferred_at,
          amount: b.total_paid !== undefined && b.total_paid !== null 
            ? b.total_paid 
            : (b.total_amount ? Number(b.total_amount) : (b.payment_amount ? Number(b.payment_amount) : 499)),
          fullyPaid: b.fully_paid,
          providerName: b.provider_name || b.provider?.name,
          address: b.address?.city || b.address?.address_line
        });
      });

      // 2. Add requests that have NOT yet graduated to a booking
      reqs.forEach((r) => {
        if (bookedRequestIds.has(r.id) || (r as any).booking_id || r.has_booking || r.booking) {
          // Already shown in bookings list!
          return;
        }

        const quoteAmt = r.quotation_amount || r.quotation?.amount;

        items.push({
          kind: 'request',
          id: `request_${r.id}`,
          rawId: r.id,
          data: r,
          serviceName: r.service_name || r.service?.name || 'Custom Service Request',
          referenceNumber: r.reference_number || `LH-${r.id}`,
          status: r.status,
          createdAt: r.created_at,
          preferredAt: r.preferred_at,
          quotationAmount: quoteAmt ? Number(quoteAmt) : null,
          hasQuotation: Boolean(r.has_quotation || r.quotation),
          quotationStatus: r.quotation_status || r.quotation?.status,
          providerName: r.provider_name || r.provider?.name,
          address: r.address?.city || r.address?.address_line
        });
      });

      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setOrders(items);
    } catch (err) {
      console.error('Failed to load orders', err);
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

    fetchOrders();
  }, [user, authLoading, router]);

  const getStatusBadge = (item: UnifiedOrderItem) => {
    if (item.kind === 'booking') {
      switch (item.status) {
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
              {item.status.replace(/_/g, ' ')}
            </span>
          );
      }
    }

    // Request Badges
    if (item.status === 'quotation_sent' || (item.hasQuotation && item.quotationStatus === 'submitted')) {
      return (
        <span className="bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
          <Sparkles className="w-3 h-3 text-amber-600" />
          <span>Quote Ready: ₹{item.quotationAmount?.toLocaleString('en-IN')} • Review</span>
        </span>
      );
    }
    if (item.status === 'contacting_provider') {
      return (
        <span className="bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
          <UserCheck className="w-3 h-3 text-sky-600" />
          <span>Specialist Assigned</span>
        </span>
      );
    }
    if (item.status === 'pending_review' || item.status === 'submitted') {
      return (
        <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Scope in Review</span>
        </span>
      );
    }
    if (item.status === 'customer_approved') {
      return (
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-md">
          Quote Approved
        </span>
      );
    }
    if (item.status === 'cancelled' || item.status === 'customer_rejected') {
      return (
        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-medium px-2 py-0.5 rounded-md">
          Cancelled
        </span>
      );
    }

    return (
      <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-md capitalize">
        {item.status.replace(/_/g, ' ')}
      </span>
    );
  };

  const filteredOrders = orders.filter((item) => {
    if (activeTab === 'active') {
      if (item.kind === 'booking') {
        return ['confirmed', 'in_progress', 'rescheduled', 'pending_review', 'contacting_provider'].includes(item.status);
      }
      return ['submitted', 'pending_review', 'contacting_provider', 'quotation_sent', 'customer_approved'].includes(item.status);
    }
    if (activeTab === 'in_review') {
      if (item.kind === 'request') {
        return ['submitted', 'pending_review', 'contacting_provider', 'quotation_sent', 'customer_approved'].includes(item.status);
      }
      return ['pending_review', 'contacting_provider', 'quotation_sent'].includes(item.status);
    }
    if (activeTab === 'completed') {
      return ['completed', 'cancelled', 'customer_rejected'].includes(item.status);
    }
    return true;
  });

  const activeCount = orders.filter((item) => {
    if (item.kind === 'booking') {
      return ['confirmed', 'in_progress', 'rescheduled', 'pending_review', 'contacting_provider'].includes(item.status);
    }
    return ['submitted', 'pending_review', 'contacting_provider', 'quotation_sent', 'customer_approved'].includes(item.status);
  }).length;

  const inReviewCount = orders.filter((item) => {
    if (item.kind === 'request') {
      return ['submitted', 'pending_review', 'contacting_provider', 'quotation_sent', 'customer_approved'].includes(item.status);
    }
    return ['pending_review', 'contacting_provider', 'quotation_sent'].includes(item.status);
  }).length;

  const completedCount = orders.filter((item) => 
    ['completed', 'cancelled', 'customer_rejected'].includes(item.status)
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            My Bookings & Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track confirmed appointments, live quotes, technician arrivals, and transparent invoices in Prayagraj
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
          { key: 'all', label: `All Orders (${orders.length})` },
          { key: 'active', label: `Active & Scheduled (${activeCount})` },
          { key: 'in_review', label: `In Review & Quotes (${inReviewCount})` },
          { key: 'completed', label: `Completed & History (${completedCount})` },
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

      {/* Orders List */}
      {loading || authLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="border border-slate-200 rounded-2xl p-12 text-center max-w-sm mx-auto space-y-3 bg-white shadow-xs">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mx-auto">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            {activeTab === 'all' ? 'No orders found' : `No orders in this filter`}
          </h3>
          <p className="text-xs text-slate-400">
            Explore our doorstep services in Prayagraj and book a verified technician.
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
          {filteredOrders.map((item) => {
            const isBooking = item.kind === 'booking';
            const timing = isBooking ? item.scheduledAt : item.preferredAt;
            const hasQuoteReady = !isBooking && (item.status === 'quotation_sent' || item.hasQuotation);

            return (
              <div
                key={item.id}
                className={`border rounded-2xl p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-xs ${
                  hasQuoteReady ? 'border-amber-300 hover:border-amber-400 ring-1 ring-amber-200' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {item.referenceNumber}
                    </span>

                    {getStatusBadge(item)}

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
                    {item.serviceName}
                  </h3>

                  {/* Price and Details row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
                    {isBooking ? (
                      <>
                        <span className="text-slate-600">
                          Fixed Rate: <strong className="text-slate-900 font-bold">₹{item.amount?.toLocaleString('en-IN')}</strong>
                        </span>
                        <span className={item.fullyPaid ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-medium'}>
                          {item.fullyPaid ? 'Fully Paid' : 'Pay at Doorstep'}
                        </span>
                      </>
                    ) : item.quotationAmount ? (
                      <span className="text-amber-800 font-medium">
                        Quoted Tariff: <strong className="text-slate-900 font-bold">₹{item.quotationAmount.toLocaleString('en-IN')}</strong>
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">
                        Custom Estimate Pending
                      </span>
                    )}

                    {item.providerName && (
                      <span className="text-slate-500 border-l border-slate-200 pl-3 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>Specialist: <strong className="text-slate-800">{item.providerName}</strong></span>
                      </span>
                    )}

                    {item.address && (
                      <span className="text-slate-400 border-l border-slate-200 pl-3 truncate max-w-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.address}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <CustomerSupportButtons
                    referenceNumber={item.referenceNumber}
                    serviceName={item.serviceName}
                  />

                  {isBooking ? (
                    <Link
                      href={`/bookings/${item.rawId}`}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-xs"
                    >
                      <span>Manage Booking</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : hasQuoteReady ? (
                    <Link
                      href={`/requests/${item.rawId}`}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Review Quotation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href={`/requests/${item.rawId}`}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
