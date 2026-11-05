'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  Star, 
  CheckCircle2
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 capitalize">
                {booking.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                #{booking.id}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mt-1">
              {booking.service_request?.service_name || 'Doorstep Service'}
            </h1>
          </div>

          <CustomerSupportButtons
            referenceNumber={booking.service_request?.reference_number}
            serviceName={booking.service_request?.service_name}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-4">
          {/* Schedule Banner */}
          <div className="border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
                Technician Schedule
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
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition cursor-pointer"
              >
                {actionLoading ? 'Updating…' : 'Confirm Reschedule'}
              </button>
            </form>
          )}

          {/* Service details */}
          <div className="border border-slate-200 rounded-xl p-5 space-y-2">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Service Request Details</h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {booking.service_request?.description}
            </p>
            <div className="pt-2 text-xs text-slate-400">
              Reference: <span className="font-mono text-slate-600">{booking.service_request?.reference_number}</span>
            </div>
          </div>

          {/* Feedback */}
          {booking.status === 'completed' && (
            <div className="border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rating & Feedback</h3>
              {feedbackSubmitted ? (
                <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700">{feedback || 'No written feedback provided.'}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Feedback on service quality…"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none text-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Payment */}
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-xl p-5 space-y-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block">
              Payment
            </span>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total:</span>
                <span className="font-semibold text-slate-900">₹{booking.payment_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid:</span>
                <span className="font-semibold text-emerald-600">₹{booking.total_paid}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-100">
                <span className="text-slate-500">Balance:</span>
                <span className="font-semibold text-slate-900">
                  ₹{Math.max(0, (booking.payment_amount || 0) - booking.total_paid)}
                </span>
              </div>
            </div>

            {booking.fully_paid ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Fully Paid</span>
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={handleInitiatePayment}
                  disabled={actionLoading}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay Online</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  Cash or UPI to technician on arrival also accepted.
                </p>
              </div>
            )}
          </div>

          {['confirmed', 'rescheduled'].includes(booking.status) && (
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
