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
  Briefcase
} from 'lucide-react';
import { Booking } from '../../../types';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';
import { CustomerSupportButtons } from '../../../components/ui/SupportButtons';

export default function BookingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
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
    if (!user) {
      router.push(`/login?redirect=/bookings/${id}`);
      return;
    }
    fetchBooking();
  }, [id, user]);

  const handleApproveQuotation = async () => {
    if (!confirm('Approve this quotation and confirm your booking?')) return;
    setActionLoading(true);
    try {
      await apiRequest(`/bookings/${id}/approve_quotation`, { method: 'POST' });
      fetchBooking();
    } catch (err: any) {
      alert(err.error || 'Failed to approve quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuotation = async () => {
    const reason = prompt('Please provide a reason for declining this quotation:');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await apiRequest(`/bookings/${id}/reject_quotation`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      fetchBooking();
    } catch (err: any) {
      alert(err.error || 'Failed to reject quotation');
    } finally {
      setActionLoading(false);
    }
  };

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

  const handleCancelBooking = async () => {
    const reason = prompt('Please enter reason for cancellation:');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await apiRequest(`/bookings/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      fetchBooking();
    } catch (err: any) {
      alert(err.error || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
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

  if (loading) {
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

  const quotation = booking.quotation;
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details & Quotation */}
        <div className="md:col-span-2 space-y-4">
          {/* Quotation Card (if applicable) */}
          {quotation && (
            <div className="border border-teal-200 bg-teal-50/40 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Itemized Quotation</span>
                </span>
                <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-md bg-white border border-teal-200 text-teal-800">
                  {quotation.status}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">₹{quotation.amount}</span>
                <span className="text-xs text-slate-400">estimated total</span>
              </div>

              {quotation.description && (
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white/80 p-3 rounded-lg border border-teal-100">
                  {quotation.description}
                </p>
              )}

              {quotation.valid_until && (
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-teal-600" />
                  <span>
                    Valid until: {new Date(quotation.valid_until).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {['pending', 'submitted'].includes(quotation.status) && (
                <div className="flex items-center gap-2 pt-3 border-t border-teal-100">
                  <button
                    onClick={handleApproveQuotation}
                    disabled={actionLoading}
                    className="flex-1 py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Confirm</span>
                  </button>
                  <button
                    onClick={handleRejectQuotation}
                    disabled={actionLoading}
                    className="py-2 px-3 border border-slate-200 hover:bg-white text-slate-600 text-xs font-medium rounded-lg transition cursor-pointer"
                  >
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          )}

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

          {/* Payment Card */}
          {booking.payment_amount && booking.payment_amount > 0 && (
            <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-white shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Payment Summary
                </span>
                <span className={booking.fully_paid ? 'text-xs text-emerald-600 font-semibold' : 'text-xs text-amber-600 font-semibold'}>
                  {booking.fully_paid ? 'Paid in Full' : 'Payment Due'}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-2">
                <span className="text-xs text-slate-500">Service Charge</span>
                <span className="text-lg font-bold text-slate-900">₹{booking.payment_amount}</span>
              </div>

              {booking.total_paid > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Amount Paid</span>
                  <span className="text-emerald-600 font-medium">₹{booking.total_paid}</span>
                </div>
              )}

              {!booking.fully_paid && (
                <button
                  onClick={handleInitiatePayment}
                  disabled={actionLoading}
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{(booking.payment_amount || 0) - (booking.total_paid || 0)}</span>
                </button>
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

          {/* Cancel Action */}
          {!['completed', 'cancelled'].includes(booking.status) && (
            <div className="pt-2 text-center">
              <button
                onClick={handleCancelBooking}
                disabled={actionLoading}
                className="text-xs text-rose-600 hover:text-rose-700 transition cursor-pointer"
              >
                Cancel Booking
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
