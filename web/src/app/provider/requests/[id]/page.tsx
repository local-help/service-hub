'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PlayCircle, 
  Send, 
  AlertCircle,
  FileText,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { apiRequest } from '../../../../api/client';
import { ProviderAssignment } from '../../../../types';

export default function ProviderAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<ProviderAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Quotation form modal
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteDescription, setQuoteDescription] = useState('');

  // Notes
  const [actionNotes, setActionNotes] = useState('');

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<ProviderAssignment>(`/provider/requests/${assignmentId}`);
      setAssignment(res);
      setError(null);
    } catch (err: any) {
      setError(err.error || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) fetchAssignment();
  }, [assignmentId]);

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      await apiRequest(`/provider/requests/${assignmentId}/accept`, {
        method: 'POST',
        body: JSON.stringify({ notes: actionNotes }),
      });
      setActionNotes('');
      await fetchAssignment();
    } catch (err: any) {
      alert(err.error || 'Failed to accept assignment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Rejection reason is required');
      return;
    }

    try {
      setActionLoading(true);
      await apiRequest(`/provider/requests/${assignmentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason, notes: actionNotes }),
      });
      setShowRejectModal(false);
      setRejectReason('');
      setActionNotes('');
      await fetchAssignment();
    } catch (err: any) {
      alert(err.error || 'Failed to reject assignment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartService = async () => {
    try {
      setActionLoading(true);
      await apiRequest(`/provider/requests/${assignmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress', notes: actionNotes || 'Service started on site' }),
      });
      setActionNotes('');
      await fetchAssignment();
    } catch (err: any) {
      alert(err.error || 'Failed to update progress');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteService = async () => {
    try {
      setActionLoading(true);
      await apiRequest(`/provider/requests/${assignmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed', notes: actionNotes || 'Job completed successfully' }),
      });
      setActionNotes('');
      await fetchAssignment();
    } catch (err: any) {
      alert(err.error || 'Failed to complete job');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(quoteAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid positive quotation amount');
      return;
    }

    try {
      setActionLoading(true);
      await apiRequest(`/provider/requests/${assignmentId}/quotations`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amountNum,
          description: quoteDescription,
        }),
      });
      setShowQuoteModal(false);
      setQuoteAmount('');
      setQuoteDescription('');
      await fetchAssignment();
    } catch (err: any) {
      alert(err.error || 'Failed to submit quotation');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
        <div className="h-48 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5" />
          <span>Error loading assignment</span>
        </div>
        <p className="text-sm mt-1">{error}</p>
        <Link
          href="/provider/requests"
          className="mt-4 inline-block px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
        >
          Back to Requests
        </Link>
      </div>
    );
  }

  const req = assignment.service_request;
  if (!req) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top back navigation */}
      <div>
        <Link
          href="/provider/requests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#176B65] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assigned Requests
        </Link>
      </div>

      {/* Main Request Header Card */}
      <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-800">
                {req.reference_number}
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#176B65] border border-teal-200">
                {assignment.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#242D2B] mt-2">
              {req.service_name}
            </h1>
            {req.service_variant_name && (
              <p className="text-sm font-medium text-[#176B65]">
                Package: {req.service_variant_name}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Assigned on</span>
            <span className="text-xs font-semibold text-slate-700">
              {new Date(assignment.assigned_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        </div>

        {/* Action Toolbar depending on state */}
        <div className="p-4 bg-[#F7F5EF]/80 rounded-xl border border-[#E7E2D8] flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            <strong>Current Stage:</strong>{' '}
            {assignment.status === 'assigned' && 'Awaiting your acceptance or rejection'}
            {assignment.status === 'accepted' && 'Accepted. Ready to send quotation or start execution'}
            {assignment.status === 'in_progress' && 'Job currently in-progress on-site'}
            {assignment.status === 'completed' && 'Service marked completed'}
            {assignment.status === 'rejected' && 'Assignment was rejected'}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {assignment.status === 'assigned' && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                >
                  Reject Assignment
                </button>
                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#176B65] text-white hover:bg-[#12534E] transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {actionLoading ? 'Accepting...' : 'Accept Assignment'}
                </button>
              </>
            )}

            {assignment.status === 'accepted' && (
              <>
                {!req.active_quotation && req.pricing_type === 'quotation' && (
                  <button
                    onClick={() => setShowQuoteModal(true)}
                    disabled={actionLoading}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Quotation
                  </button>
                )}
                <button
                  onClick={handleStartService}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  Start Service
                </button>
              </>
            )}

            {assignment.status === 'in_progress' && (
              <button
                onClick={handleCompleteService}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Complete Service
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer & Location */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 space-y-4">
          <h3 className="font-bold text-sm text-[#242D2B] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#176B65]" />
            Customer Information
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">Name</span>
              <strong className="text-slate-800 text-sm">{req.customer_name}</strong>
            </div>

            {req.customer_phone && (
              <div>
                <span className="text-slate-400 block">Phone</span>
                <a
                  href={`tel:${req.customer_phone}`}
                  className="text-[#176B65] font-semibold flex items-center gap-1 hover:underline text-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {req.customer_phone}
                </a>
              </div>
            )}

            <div>
              <span className="text-slate-400 block">Service Location</span>
              <div className="flex items-start gap-1.5 mt-1 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{req.address?.formatted || req.address?.city || 'Prayagraj'}</span>
              </div>
            </div>

            {req.preferred_at && (
              <div>
                <span className="text-slate-400 block">Preferred Service Slot</span>
                <div className="flex items-center gap-1.5 mt-1 text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{new Date(req.preferred_at).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scope of Work & Pricing */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-[#E7E2D8] p-5 space-y-4">
          <h3 className="font-bold text-sm text-[#242D2B] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#176B65]" />
            Job Details & Quotation Status
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Customer Description / Instructions</span>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                {req.description || 'No special instructions provided by customer.'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-slate-400 block">Category</span>
                <span className="font-semibold text-slate-800">{req.service_category}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-slate-400 block">Pricing Model</span>
                <span className="font-semibold text-slate-800 uppercase">{req.pricing_type.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Quotation card */}
            {req.active_quotation ? (
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900">Submitted Quotation</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white text-teal-800 border border-teal-200">
                    Status: {req.active_quotation.status}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-[#176B65]">
                  ₹{req.active_quotation.amount}
                </div>
                {req.active_quotation.description && (
                  <p className="text-teal-800 text-xs">{req.active_quotation.description}</p>
                )}
                {req.active_quotation.valid_until && (
                  <span className="text-[11px] text-teal-700 block">
                    Valid until: {new Date(req.active_quotation.valid_until).toLocaleDateString('en-IN')}
                  </span>
                )}
              </div>
            ) : req.pricing_type === 'fixed_price' && req.fixed_price ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-slate-500 font-medium">Direct Booking Base Price</span>
                <div className="text-2xl font-extrabold text-[#242D2B]">
                  ₹{req.fixed_price}
                </div>
              </div>
            ) : null}

            {assignment.internal_notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-600 block mb-0.5">Admin / Routing Notes:</strong>
                <p className="text-slate-700">{assignment.internal_notes}</p>
              </div>
            )}

            {assignment.rejection_reason && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-700">
                <strong>Rejection Reason:</strong> {assignment.rejection_reason}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Reject Service Assignment
            </h3>
            <p className="text-xs text-slate-500">
              Please specify the reason for declining this job. Super Admins will be notified to re-route the customer to another qualified provider in Prayagraj.
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for rejection *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Staff unavailable today, location out of current coverage, equipment under maintenance..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Declining...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Quotation Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Submit Quotation for {req.reference_number}
            </h3>
            <p className="text-xs text-slate-500">
              Provide an estimated price and description for the customer to review and approve.
            </p>

            <form onSubmit={handleSubmitQuotation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Total Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="e.g. 1250"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scope / Cost Breakdown
                </label>
                <textarea
                  rows={3}
                  value={quoteDescription}
                  onChange={(e) => setQuoteDescription(e.target.value)}
                  placeholder="e.g. Includes materials, technician charges, and 30-day service warranty."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#176B65] text-white hover:bg-[#12534E] disabled:opacity-50"
                >
                  {actionLoading ? 'Sending...' : 'Send Quotation to Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
