'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText,
  Calendar,
  Check,
  X
} from 'lucide-react';
import { ServiceRequest, Quotation } from '../../../types';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';
import { CustomerSupportButtons } from '../../../components/ui/SupportButtons';

export default function RequestDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const router = useRouter();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = () => {
    if (!id) return;
    setLoading(true);
    apiRequest<ServiceRequest>(`/service_requests/${id}`)
      .then(setRequest)
      .catch((err) => setError(err.error || 'Failed to load request'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=/requests/${id}`);
      return;
    }
    fetchRequest();
  }, [id, user]);

  const handleApproveQuotation = async () => {
    if (!confirm('Approve this quotation and confirm booking?')) return;
    setActionLoading(true);
    try {
      await apiRequest(`/service_requests/${id}/quotation/approve`, { method: 'POST' });
      fetchRequest();
    } catch (err: any) {
      alert(err.error || 'Failed to approve quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuotation = async () => {
    if (!confirm('Are you sure you want to reject this quotation?')) return;
    setActionLoading(true);
    try {
      await apiRequest(`/service_requests/${id}/quotation/reject`, { method: 'POST' });
      fetchRequest();
    } catch (err: any) {
      alert(err.error || 'Failed to reject quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    const reason = prompt('Please enter cancellation reason:');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await apiRequest(`/service_requests/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      fetchRequest();
    } catch (err: any) {
      alert(err.error || 'Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-slate-900">Request Not Found</h2>
        <Link href="/requests" className="inline-block mt-4 text-sm text-blue-600 font-semibold hover:underline">
          Back to all requests
        </Link>
      </div>
    );
  }

  const quotation = request.quotation;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          href="/requests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Requests</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-black text-blue-600 tracking-wider font-mono">
                {request.reference_number}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                {request.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {request.service?.name}
            </h1>
          </div>

          {/* Quick Support Actions */}
          <CustomerSupportButtons
            referenceNumber={request.reference_number}
            serviceName={request.service?.name}
          />
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details & Quotation */}
        <div className="md:col-span-2 space-y-6">
          {/* QUOTATION CARD (Critical V1 Feature) */}
          {quotation && (
            <div className={`rounded-3xl p-6 sm:p-8 border-2 shadow-sm transition ${
              quotation.status === 'pending'
                ? 'bg-gradient-to-br from-indigo-50/60 to-blue-50/60 border-indigo-300'
                : quotation.status === 'approved'
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Official LocalHelp Quotation</span>
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  quotation.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                  quotation.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                  'bg-indigo-100 text-indigo-800 animate-pulse'
                }`}>
                  {quotation.status}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-black text-slate-900">₹{quotation.amount}</span>
                <span className="text-xs text-slate-500 font-medium">all-inclusive</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4 whitespace-pre-line">
                {quotation.description || 'Includes technician visit, spare parts diagnostic, and complete installation.'}
              </p>

              <div className="text-xs text-slate-500 mb-6 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Valid until: <strong>{new Date(quotation.valid_until).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</strong></span>
              </div>

              {/* Action buttons for pending quotation */}
              {quotation.status === 'pending' && (
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-indigo-200/60">
                  <button
                    onClick={handleApproveQuotation}
                    disabled={actionLoading}
                    className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Quotation & Book</span>
                  </button>
                  <button
                    onClick={handleRejectQuotation}
                    disabled={actionLoading}
                    className="w-full sm:flex-initial py-3 px-4 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Request Overview */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Requirement Details</h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {request.description}
            </p>

            {request.preferred_at && (
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Preferred Schedule: <strong>{new Date(request.preferred_at).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Address & Actions */}
        <div className="space-y-6">
          {/* Address card */}
          {request.address && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Service Address
              </span>
              <p className="text-xs font-bold text-slate-900">{request.address.label || 'Home'}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{request.address.full_address}</p>
            </div>
          )}

          {/* Booking Shortcut if Confirmed */}
          {request.booking && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                Confirmed Booking
              </span>
              <p className="text-xs text-emerald-900 font-medium">
                Technician scheduled for: <br />
                <strong>{new Date(request.booking.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
              </p>
              <Link
                href={`/bookings/${request.booking.id}`}
                className="inline-block w-full text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
              >
                Manage Booking
              </Link>
            </div>
          )}

          {/* Cancellation Option */}
          {!['completed', 'cancelled'].includes(request.status) && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs text-center">
              <button
                onClick={handleCancelRequest}
                disabled={actionLoading}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Cancel Service Request
              </button>
            </div>
          )}
        </div>
      </div>

      <CustomerSupportButtons
        variant="banner"
        referenceNumber={request.reference_number}
        serviceName={request.service?.name}
      />
    </div>
  );
}

