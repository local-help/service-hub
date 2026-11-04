'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CreditCard, 
  Star, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Booking, Payment } from '../../../types';
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
      // Step 1: Initiate payment order on Rails API
      const orderData = await apiRequest(`/bookings/${id}/payments/initiate`, {
        method: 'POST',
      });

      // Step 2: In production this opens Razorpay modal. For V1 demo/testing, simulate gateway verification
      const verifyData = await apiRequest(`/bookings/${id}/payments/verify`, {
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
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-slate-900">Booking Not Found</h2>
        <Link href="/bookings" className="inline-block mt-4 text-sm text-blue-600 font-semibold hover:underline">
          Back to all bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Bookings</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 uppercase">
                {booking.status}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Booking ID: #{booking.id}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
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
        <div className="md:col-span-2 space-y-6">
          {/* Schedule Banner */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Technician Schedule
              </span>
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Calendar className="w-5 h-5 text-blue-600" />
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
                className="text-xs font-bold text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg cursor-pointer transition"
              >
                {showReschedule ? 'Close' : 'Reschedule'}
              </button>
            )}
          </div>

          {/* Reschedule Box */}
          {showReschedule && (
            <form onSubmit={handleReschedule} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-900">Pick New Date & Time</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="09:00">Morning (9:00 AM - 12:00 PM)</option>
                  <option value="12:00">Afternoon (12:00 PM - 3:00 PM)</option>
                  <option value="15:00">Late Afternoon (3:00 PM - 6:00 PM)</option>
                  <option value="18:00">Evening (6:00 PM - 8:00 PM)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                {actionLoading ? 'Updating...' : 'Confirm Reschedule'}
              </button>
            </form>
          )}

          {/* Service details */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Service Request Details</h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {booking.service_request?.description}
            </p>
            <div className="pt-2 text-xs text-slate-500">
              Reference: <strong className="text-slate-900 font-mono">{booking.service_request?.reference_number}</strong>
            </div>
          </div>

          {/* Customer Feedback Card (Post-Completion) */}
          {booking.status === 'completed' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Service Rating & Feedback</h3>
              {feedbackSubmitted ? (
                <div className="p-4 bg-emerald-50 rounded-xl space-y-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-emerald-900">{feedback || 'No written feedback provided.'}</p>
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
                            className={`w-5 h-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="How was the technician? Did they arrive on time?"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full p-3 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Payments & Actions */}
        <div className="space-y-6">
          {/* Payment Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Payment Summary
            </span>

            <div className="space-y-2 pb-4 border-b border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Payable:</span>
                <span className="font-bold text-slate-900">₹{booking.payment_amount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Paid Amount:</span>
                <span className="font-bold text-emerald-600">₹{booking.total_paid}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-500">Balance:</span>
                <span className="font-bold text-slate-900">
                  ₹{Math.max(0, (booking.payment_amount || 0) - booking.total_paid)}
                </span>
              </div>
            </div>

            {booking.fully_paid ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Service Fully Paid</span>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleInitiatePayment}
                  disabled={actionLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Online (Razorpay)</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  You can also pay cash or UPI directly to technician on arrival.
                </p>
              </div>
            )}
          </div>

          {/* Cancellation button */}
          {['confirmed', 'rescheduled'].includes(booking.status) && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs text-center">
              <button
                onClick={handleCancelBooking}
                disabled={actionLoading}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Cancel Booking
              </button>
            </div>
          )}
        </div>
      </div>

      <CustomerSupportButtons
        variant="banner"
        referenceNumber={booking.service_request?.reference_number}
        serviceName={booking.service_request?.service_name}
      />
    </div>
  );
}

