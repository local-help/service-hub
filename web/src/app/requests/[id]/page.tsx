'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Check, 
  X, 
  FileText, 
  Tag, 
  UserCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ServiceRequest } from '../../../types';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { CustomerSupportButtons } from '../../../components/ui/SupportButtons';

export default function RequestDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = () => {
    if (!id) return;
    setLoading(true);
    apiRequest<{ service_request: ServiceRequest } | ServiceRequest>(`/service_requests/${id}`)
      .then((data) => {
        const req = (data as any).service_request || data;
        if (req.booking?.id) {
          router.replace(`/bookings/${req.booking.id}`);
          return;
        }
        setRequest(req);
      })
      .catch((err) => setError(err.error || 'Failed to load request details'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/login?redirect=/requests/${id}`);
      return;
    }
    fetchRequest();
  }, [id, user, authLoading, router]);

  const handleApproveQuotation = async () => {
    if (!confirm(`Confirm acceptance of quotation amount ₹${request?.quotation?.amount || request?.quotation_amount}? This will confirm your booking appointment.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await apiRequest(`/service_requests/${id}/quotation/approve`, {
        method: 'POST',
      });
      toast.success('Quotation approved! Your booking appointment is confirmed.');
      fetchRequest();
    } catch (err: any) {
      toast.error(err.error || 'Failed to approve quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuotation = async () => {
    if (!confirm('Are you sure you want to decline this quotation? Our central support team will review alternative options.')) {
      return;
    }

    setActionLoading(true);
    try {
      await apiRequest(`/service_requests/${id}/quotation/reject`, {
        method: 'POST',
      });
      toast.info('Quotation declined. Our support team has been notified.');
      fetchRequest();
    } catch (err: any) {
      toast.error(err.error || 'Failed to decline quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    const reason = prompt('Please specify a reason for cancellation:');
    if (!reason) return;

    setActionLoading(true);
    try {
      await apiRequest(`/service_requests/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      toast.info('Service request has been cancelled.');
      fetchRequest();
    } catch (err: any) {
      toast.error(err.error || 'Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
        <div className="h-44 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Request Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Unable to find this service request.'}</p>
        <Link
          href="/bookings"
          className="inline-flex px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  const hasGraduatedBooking = Boolean(request.booking?.id || (request as any).booking_id || request.has_booking);
  const bookingId = request.booking?.id || (request as any).booking_id;
  const quote = request.quotation;
  const isQuotePending = (request.status === 'quotation_sent' || request.quotation_status === 'submitted') && quote;
  const canCancel = ['submitted', 'pending_review', 'contacting_provider', 'quotation_sent'].includes(request.status);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>
        <CustomerSupportButtons
          referenceNumber={request.reference_number}
          serviceName={request.service_name || request.service?.name}
        />
      </div>

      {/* Graduated to Confirmed Booking Banner */}
      {hasGraduatedBooking && bookingId && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950">Appointment Confirmed!</h4>
              <p className="text-[11px] text-emerald-800">
                This request has been accepted and scheduled as a confirmed doorstep booking.
              </p>
            </div>
          </div>
          <Link
            href={`/bookings/${bookingId}`}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1 shadow-xs shrink-0"
          >
            <span>View Confirmed Booking</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Request Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                {request.reference_number}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                Scope & Quote Review
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-2">
              {request.service_name || request.service?.name || 'Custom Doorstep Service'}
            </h1>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Submitted On</span>
            <span className="text-xs font-medium text-slate-700">
              {new Date(request.created_at).toLocaleDateString('en-IN', {
                dateStyle: 'medium',
              })}
            </span>
          </div>
        </div>

        {/* Status Tracker Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Prayagraj Operations Review</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {request.status === 'pending_review' && 'Our operations coordinators are reviewing your required repair scope to provide a guaranteed tariff.'}
            {request.status === 'contacting_provider' && 'We are matching a verified, top-rated technician near your location.'}
            {request.status === 'quotation_sent' && 'A customized estimate has been prepared for your approval below.'}
            {request.status === 'customer_approved' && 'Quotation approved! Generating confirmed booking schedule.'}
            {request.status === 'cancelled' && 'This request was cancelled.'}
          </p>
        </div>

        {/* Request Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          {request.preferred_at && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block">Preferred Timing</span>
                <span className="text-slate-500">
                  {new Date(request.preferred_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>
          )}

          {request.address && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block">Doorstep Address</span>
                <span className="text-slate-500 line-clamp-2">
                  {request.address.address_line}, {request.address.city} - {request.address.postal_code}
                </span>
              </div>
            </div>
          )}

          {request.provider_name && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
              <UserCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block">Assigned Specialist</span>
                <span className="text-slate-600">{request.provider_name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Problem Description */}
        {request.description && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Your Requirements / Notes
            </span>
            <p className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
              {request.description}
            </p>
          </div>
        )}
      </div>

      {/* Quotation Review Card (If Quote Sent) */}
      {isQuotePending && (
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border-2 border-amber-300 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Quotation Ready for Approval</h3>
                <p className="text-[11px] text-slate-500">Official tariff quotation provided by our specialist team</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block uppercase font-bold">Total Quoted</span>
              <span className="text-2xl font-black text-slate-900">
                ₹{Number(quote.amount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {quote.description && (
            <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block">Scope of Work Included:</span>
              <p className="text-slate-600 leading-relaxed">{quote.description}</p>
            </div>
          )}

          {quote.valid_until && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Valid until {new Date(quote.valid_until).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleApproveQuotation}
              disabled={actionLoading}
              className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Approve Quotation & Book Appointment</span>
            </button>
            <button
              onClick={handleRejectQuotation}
              disabled={actionLoading}
              className="w-full sm:w-auto py-2.5 px-4 border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:bg-slate-100 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4 inline mr-1" />
              <span>Decline Quote</span>
            </button>
          </div>
        </div>
      )}

      {/* Cancel Request Footer Option */}
      {canCancel && !hasGraduatedBooking && (
        <div className="text-center pt-4">
          <button
            onClick={handleCancelRequest}
            disabled={actionLoading}
            className="text-xs text-rose-600 hover:text-rose-800 underline font-medium cursor-pointer"
          >
            Cancel this Service Request
          </button>
        </div>
      )}
    </div>
  );
}
