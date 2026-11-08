'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  Star, 
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  FileText,
  AlertCircle,
  Check,
  X,
  Phone,
  User as UserIcon,
  Briefcase,
  XCircle,
  ArrowRight,
  Tag,
  Download,
  Mail,
  FileCheck,
  Loader2
} from 'lucide-react';
import { Booking } from '../../../types';
import { apiRequest, downloadFile } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';
import { CustomerSupportButtons } from '../../../components/ui/SupportButtons';

export default function BookingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reschedule state
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00');

  // Feedback state
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonCategory, setCancelReasonCategory] = useState('Change in schedule / Need to reschedule');
  const [cancelDetails, setCancelDetails] = useState('');

  // Payment receipt states
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [emailingReceipt, setEmailingReceipt] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const handleDownloadReceipt = async () => {
    setDownloadingReceipt(true);
    setReceiptError(null);
    try {
      await downloadFile(
        `/bookings/${id}/receipt?download=true`,
        `LocalHelp_Receipt_${booking?.reference_number || id}.pdf`
      );
    } catch (err: any) {
      setReceiptError(err.message || 'Failed to download receipt');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const handleEmailReceipt = async () => {
    setEmailingReceipt(true);
    setReceiptError(null);
    setEmailSuccessMsg(null);
    try {
      const res = await apiRequest<{ message: string }>(`/bookings/${id}/receipt/request_email`, {
        method: 'POST',
      });
      setEmailSuccessMsg(res.message || 'Receipt sent to your registered email address.');
      setTimeout(() => setEmailSuccessMsg(null), 6000);
    } catch (err: any) {
      setReceiptError(err.error || err.message || 'Failed to email receipt');
    } finally {
      setEmailingReceipt(false);
    }
  };

  const fetchBooking = () => {
    if (!id) return;
    setLoading(true);
    apiRequest<Booking>(`/bookings/${id}`)
      .then((b) => {
        setBooking(b);
        if (b.rating) {
          setRating(b.rating);
          setFeedback(b.feedback || '');
          setFeedbackSubmitted(true);
        }
      })
      .catch((err) => setError(err.error || 'Failed to load booking'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/login?redirect=/bookings/${id}`);
      return;
    }
    fetchBooking();
  }, [id, user, authLoading, router]);

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    setActionLoading(true);
    try {
      const scheduledAt = new Date(`${newDate}T${newTime}:00`).toISOString();
      await apiRequest(`/bookings/${id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ scheduled_at: scheduledAt }),
      });
      setShowReschedule(false);
      fetchBooking();
    } catch (err: any) {
      alert(err.error || 'Failed to reschedule');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const finalReason = cancelDetails.trim()
      ? `${cancelReasonCategory} - ${cancelDetails.trim()}`
      : cancelReasonCategory;
    try {
      await apiRequest(`/bookings/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: finalReason }),
      });
      setShowCancelModal(false);
      fetchBooking();
    } catch (err: any) {
      alert(err.error || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleInstead = () => {
    setShowCancelModal(false);
    setShowReschedule(true);
  };

  const handleInitiatePayment = async () => {
    setActionLoading(true);
    try {
      const orderData = await apiRequest(`/bookings/${id}/payments/initiate`, {
        method: 'POST',
      });

      await apiRequest(`/bookings/${id}/payments/verify`, {
        method: 'POST',
        body: JSON.stringify({
          gateway_order_id: orderData.gateway_order_id,
          gateway_reference: `pay_${Date.now()}`,
          signature: 'demo_verified_sig',
        }),
      });

      alert('Payment successful!');
      fetchBooking();
    } catch (err: any) {
      alert(err.error || 'Payment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiRequest(`/bookings/${id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating, feedback }),
      });
      setFeedbackSubmitted(true);
      alert('Thank you for your rating & feedback!');
      fetchBooking();
    } catch (err: any) {
      alert(err.error || 'Failed to submit feedback');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-6 w-32 bg-slate-100 rounded-md" />
        <div className="h-48 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-lg font-semibold text-slate-900">Booking not found</h2>
        <Link href="/bookings" className="inline-block mt-3 text-sm text-slate-600 hover:text-slate-900 underline">
          All bookings
        </Link>
      </div>
    );
  }

  const serviceName = booking.service?.name || booking.service_name || 'Doorstep Service';
  const referenceNumber = booking.reference_number;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div>
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Bookings</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-100 font-semibold uppercase tracking-wider">
                {booking.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {referenceNumber}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mt-1">
              {serviceName}
            </h1>
          </div>

          <CustomerSupportButtons
            referenceNumber={referenceNumber}
            serviceName={serviceName}
          />
        </div>
      </div>

      {/* Cancelled Notice Banner */}
      {booking.status === 'cancelled' && (
        <div className="border border-rose-200 bg-rose-50/60 rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-sm font-semibold text-rose-900">This booking was cancelled</h3>
            {booking.cancellation_reason && (
              <p className="text-xs text-rose-700">
                Reason: <span className="font-medium text-slate-800">{booking.cancellation_reason}</span>
              </p>
            )}
            <p className="text-xs text-slate-500">
              Need assistance or want to schedule a new visit? You can book anytime.
            </p>
            <div className="pt-1.5">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition shadow-xs"
              >
                <span>Book New Service</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details & Fixed Price Guarantee */}
        <div className="md:col-span-2 space-y-4">
          {/* Fixed Price Guarantee Card */}
          <div className="border border-slate-200/80 bg-slate-50/70 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Fixed Price Guarantee</span>
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Admin Fixed Rate
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">₹{booking.total_amount || booking.service?.fixed_price || 0}</span>
              <span className="text-xs text-slate-400">transparent fixed fee</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
              No hidden charges or on-site haggling. The price for this service is pre-determined by LocalHelp administration and includes all standard labor and technician travel in Prayagraj.
            </p>
          </div>

          {/* Schedule Banner */}
          {booking.scheduled_at && (
            <div className="border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white shadow-xs">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
                  Confirmed Schedule
                </span>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>
                    {new Date(booking.scheduled_at).toLocaleString('en-IN', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              {['confirmed', 'rescheduled'].includes(booking.status) && (
                <button
                  onClick={() => setShowReschedule(!showReschedule)}
                  className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  {showReschedule ? 'Close' : 'Reschedule'}
                </button>
              )}
            </div>
          )}

          {/* Reschedule Box */}
          {showReschedule && (
            <form onSubmit={handleReschedule} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-medium text-slate-900">Choose New Schedule</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 outline-none"
                />
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 outline-none"
                >
                  <option value="09:00">Morning (9 AM - 12 PM)</option>
                  <option value="12:00">Afternoon (12 PM - 3 PM)</option>
                  <option value="15:00">Late Afternoon (3 PM - 6 PM)</option>
                  <option value="18:00">Evening (6 PM - 8 PM)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-3 py-1.5 bg-teal-700 text-white text-xs font-medium rounded-lg hover:bg-teal-800 transition cursor-pointer shadow-xs"
              >
                Confirm Reschedule
              </button>
            </form>
          )}

          {/* Requirement Description & Photos */}
          <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-white shadow-xs">
            <div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Requirement Details
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {booking.description || 'No additional notes provided.'}
              </p>
            </div>

            {/* Attached Photos */}
            {booking.request_attachments && booking.request_attachments.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                  Attached Photos ({booking.request_attachments.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {booking.request_attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-slate-200 rounded-lg p-1.5 bg-white hover:border-slate-400 transition block group overflow-hidden shadow-2xs"
                    >
                      <img
                        src={att.file_url}
                        alt={att.file_name || 'Attachment'}
                        className="w-full h-24 object-cover rounded bg-slate-50"
                      />
                      <span className="text-[11px] text-slate-600 truncate block mt-1 group-hover:text-slate-900">
                        {att.file_name || 'View photo'}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment & Centralized Receipt Card */}
          {booking.payment_amount && booking.payment_amount > 0 && (
            <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-white shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Payment & Receipt</span>
                </span>
                <span className={booking.fully_paid ? 'text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1' : 'text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold'}>
                  {booking.fully_paid && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  <span>{booking.fully_paid ? 'Paid in Full' : 'Payment Due'}</span>
                </span>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Service Charges</span>
                  <span className="text-sm font-bold text-slate-900">₹{booking.payment_amount}</span>
                </div>

                {booking.total_paid > 0 && (
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Total Amount Paid</span>
                    <span className="text-emerald-700 font-bold text-sm">₹{booking.total_paid}</span>
                  </div>
                )}

                {booking.fully_paid && (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Payment Method</span>
                      <span className="text-slate-800 font-medium capitalize">
                        {booking.payments?.[0]?.method ? `${booking.payments[0].method} (Gateway Secure)` : 'Online Gateway'}
                      </span>
                    </div>

                    {booking.payments?.[0]?.gateway_reference && (
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Transaction Ref</span>
                        <span className="font-mono text-slate-700 text-[11px]">
                          {booking.payments[0].gateway_reference}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {!booking.fully_paid && (
                <button
                  onClick={handleInitiatePayment}
                  disabled={actionLoading}
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{(booking.payment_amount || 0) - (booking.total_paid || 0)}</span>
                </button>
              )}

              {/* Get Payment Receipt Section */}
              {(booking.fully_paid || (booking.total_paid && booking.total_paid > 0)) && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Get Payment Receipt</h4>
                          <p className="text-[11px] text-slate-500">Official digital receipt for your records</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                        Available
                      </span>
                    </div>

                    {/* Receipt Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadReceipt}
                        disabled={downloadingReceipt}
                        className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                      >
                        {downloadingReceipt ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />
                            <span>Generating PDF...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5 text-teal-700" />
                            <span>Download PDF</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleEmailReceipt}
                        disabled={emailingReceipt}
                        className="w-full py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {emailingReceipt ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Queuing Email...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5 text-white" />
                            <span>Email Receipt</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Feedback Banners */}
                    {emailSuccessMsg && (
                      <div className="p-2.5 rounded-lg bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{emailSuccessMsg}</span>
                      </div>
                    )}

                    {receiptError && (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{receiptError}</span>
                      </div>
                    )}

                    {/* Legal Document Note */}
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Issued electronically by LocalHelp Technologies Pvt Ltd as a payment facilitation acknowledgement. Not a provider GST tax invoice.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rating & Feedback */}
          {booking.status === 'completed' && (
            <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-white shadow-xs">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Service Feedback
              </span>

              {feedbackSubmitted ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                  {feedback && <p className="text-xs text-slate-600 italic">"{feedback}"</p>}
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="How was your experience?"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition shadow-xs"
                  >
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Address, Provider & Actions */}
        <div className="space-y-4">
          {/* Service Address */}
          {booking.address && (
            <div className="border border-slate-200 rounded-xl p-4 space-y-1 bg-white shadow-xs">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Doorstep Service Location
              </span>
              <p className="text-xs font-semibold text-slate-900">{booking.address.label || 'Service Address'}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{booking.address.full_address}</p>
            </div>
          )}

          {/* Assigned Technician / Provider */}
          {booking.provider && (
            <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white shadow-xs">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Assigned Local Partner
              </span>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">{booking.provider.name}</p>
                  <p className="text-[11px] text-slate-400">{booking.provider.service_area || 'Prayagraj Zone'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Improved Cancel Action Card */}
          {!['completed', 'cancelled'].includes(booking.status) && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-2.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Manage Booking
              </span>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
                className="w-full py-2.5 px-3 rounded-lg border border-rose-200 bg-rose-50/40 hover:bg-rose-50 text-rose-700 hover:text-rose-800 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs group"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-500 group-hover:scale-105 transition" />
                <span>Cancel Booking</span>
              </button>
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Free cancellation before visit commences</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Cancel Booking</h3>
                  <p className="text-xs text-slate-500 font-mono">{referenceNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reschedule Alternative Banner */}
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-teal-900">Need a different date or time?</p>
                <p className="text-teal-700 text-[11px] mt-0.5">Reschedule for free instead of cancelling.</p>
              </div>
              <button
                type="button"
                onClick={handleRescheduleInstead}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg shrink-0 transition shadow-xs text-xs cursor-pointer"
              >
                Reschedule
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-800 block mb-2">
                  Please select a reason for cancellation:
                </label>
                <div className="space-y-1.5">
                  {[
                    'Change in schedule / Need to reschedule',
                    'Found alternative service provider',
                    'Booked by mistake / duplicate request',
                    'Price concern / Changed mind',
                    'Personal emergency',
                    'Other reason',
                  ].map((cat) => (
                    <label
                      key={cat}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                        cancelReasonCategory === cat
                          ? 'border-rose-300 bg-rose-50/40 text-slate-900 font-medium'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancel_reason"
                        value={cat}
                        checked={cancelReasonCategory === cat}
                        onChange={(e) => setCancelReasonCategory(e.target.value)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Additional notes or feedback (Optional)
                </label>
                <textarea
                  rows={2}
                  value={cancelDetails}
                  onChange={(e) => setCancelDetails(e.target.value)}
                  placeholder="Share details to help us improve..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-rose-400 text-slate-900 text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                By confirming, this booking will be cancelled and any assigned technician will be released. You can always book a new visit whenever you're ready.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading ? 'Cancelling…' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
