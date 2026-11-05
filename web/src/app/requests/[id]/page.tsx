'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
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
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-6 w-32 bg-slate-100 rounded-md" />
        <div className="h-48 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-lg font-semibold text-slate-900">Request not found</h2>
        <Link href="/requests" className="inline-block mt-3 text-sm text-slate-600 hover:text-slate-900 underline">
          All requests
        </Link>
      </div>
    );
  }

  const quotation = request.quotation;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          href="/requests"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Requests</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-mono font-medium text-slate-800">
                {request.reference_number}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 capitalize">
                {request.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mt-1">
              {request.service?.name}
            </h1>
          </div>

          <CustomerSupportButtons
            referenceNumber={request.reference_number}
            serviceName={request.service?.name}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Details & Quote */}
        <div className="md:col-span-2 space-y-4">
          {quotation && (
            <div className="border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Quotation</span>
                </span>
                <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {quotation.status}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-slate-900">₹{quotation.amount}</span>
                <span className="text-xs text-slate-400">inclusive</span>
              </div>

              {quotation.description && (
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {quotation.description}
                </p>
              )}

              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Valid until: {new Date(quotation.valid_until).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}</span>
              </div>

              {quotation.status === 'pending' && (
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={handleApproveQuotation}
                    disabled={actionLoading}
                    className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Book</span>
                  </button>
                  <button
                    onClick={handleRejectQuotation}
                    disabled={actionLoading}
                    className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition cursor-pointer"
                  >
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Requirement Details</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {request.description}
            </p>

            {request.preferred_at && (
              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Preferred Schedule: {new Date(request.preferred_at).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}</span>
              </div>
            )}

            {request.request_attachments && request.request_attachments.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                  Attached Photos ({request.request_attachments.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {request.request_attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-slate-200 rounded-lg p-1.5 bg-white hover:border-slate-400 transition block group overflow-hidden"
                    >
                      <img
                        src={att.file_url}
                        alt={att.file_name || 'Attachment'}
                        className="w-full h-24 object-cover rounded bg-slate-50"
                      />
                      <span className="text-[11px] text-slate-600 truncate block mt-1 group-hover:text-slate-900">
                        {att.file_name || 'View Photo'}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Address & Actions */}
        <div className="space-y-4">
          {request.address && (
            <div className="border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Service Address
              </span>
              <p className="text-xs font-medium text-slate-800">{request.address.label || 'Home'}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{request.address.full_address}</p>
            </div>
          )}

          {request.booking && (
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Confirmed Booking
              </span>
              <p className="text-xs text-slate-700">
                Scheduled for {new Date(request.booking.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              <Link
                href={`/bookings/${request.booking.id}`}
                className="inline-block w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition"
              >
                Manage Booking
              </Link>
            </div>
          )}

          {!['completed', 'cancelled'].includes(request.status) && (
            <div className="pt-2 text-center">
              <button
                onClick={handleCancelRequest}
                disabled={actionLoading}
                className="text-xs text-rose-600 hover:text-rose-700 transition cursor-pointer"
              >
                Cancel Service Request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
