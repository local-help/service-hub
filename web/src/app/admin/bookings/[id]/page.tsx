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
  User, 
  Phone, 
  Mail, 
  MessageCircle, 
  FileText, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Wrench, 
  Play, 
  Check, 
  X, 
  XCircle, 
  Tag, 
  Copy, 
  Send, 
  History, 
  ExternalLink,
  ChevronRight,
  UserCheck,
  Building2
} from 'lucide-react';
import { Booking, Provider, Communication } from '../../../../types';
import { apiRequest } from '../../../../api/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';

export default function AdminBookingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Admin notes state
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Specialist assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<number | ''>('');
  const [assignNotes, setAssignNotes] = useState('');

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');

  // Offline payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [offlineAmount, setOfflineAmount] = useState('');
  const [offlineType, setOfflineType] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonCategory, setCancelReasonCategory] = useState('Customer requested cancellation');
  const [cancelDetails, setCancelDetails] = useState('');

  // Communication modal state
  const [showCommModal, setShowCommModal] = useState(false);
  const [commChannel, setCommChannel] = useState<'phone' | 'whatsapp'>('phone');
  const [commDirection, setCommDirection] = useState<'outbound' | 'inbound'>('outbound');
  const [commSummary, setCommSummary] = useState('');
  const [commOutcome, setCommOutcome] = useState('');

  const fetchBooking = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      apiRequest<Booking>(`/admin/bookings/${id}`),
      apiRequest<Provider[]>(`/admin/providers/eligible?city=Prayagraj`).catch(() => []),
    ])
      .then(([bData, provData]) => {
        setBooking(bData);
        setAdminNotes(bData.admin_notes || '');
        if (bData.provider_id) {
          setSelectedProviderId(bData.provider_id);
        }
        const pList = Array.isArray(provData) ? provData : (provData as any).providers || [];
        setProviders(pList);
      })
      .catch((err) => {
        console.error('Failed to load booking detail', err);
        toast.error('Failed to load booking details');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/login?redirect=/admin/bookings');
      return;
    }
    fetchBooking();
  }, [id, user, isAdmin]);

  const copyReference = () => {
    if (!booking?.reference_number) return;
    navigator.clipboard.writeText(booking.reference_number);
    setCopied(true);
    toast.success('Reference number copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to transition this order to "${newStatus.replace(/_/g, ' ')}"?`)) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
      fetchBooking();
    } catch (err: any) {
      toast.error(err.error || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await apiRequest(`/admin/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ admin_notes: adminNotes }),
      });
      toast.success('Admin internal notes saved');
      fetchBooking();
    } catch (err: any) {
      toast.error(err.error || 'Failed to save admin notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAssignSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/bookings/${id}/assign_provider`, {
        method: 'POST',
        body: JSON.stringify({
          provider_id: selectedProviderId,
          notes: assignNotes,
        }),
      });
      toast.success('Specialist assigned successfully');
      setShowAssignModal(false);
      setAssignNotes('');
      fetchBooking();
    } catch (err: any) {
      toast.error(err.error || 'Failed to assign specialist');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate) return;
    setActionLoading(true);
    try {
      const scheduledAt = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();
      await apiRequest(`/admin/bookings/${id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ scheduled_at: scheduledAt }),
      });
      toast.success('Appointment rescheduled successfully');
      setShowRescheduleModal(false);
      fetchBooking();
    } catch (err: any) {
      toast.error(err.error || 'Failed to reschedule appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineAmount) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/payments/record_offline`, {
        method: 'POST',
        body: JSON.stringify({
          booking_id: booking?.id,
          amount: parseFloat(offlineAmount),
          offline_type: offlineType,
          notes: paymentNotes,
        }),
      });
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setOfflineAmount('');
      setPaymentNotes('');
      fetchBooking();
    } catch (err: any) {
      toast.error(err.error || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const fullReason = cancelDetails.trim() 
        ? `${cancelReasonCategory}: ${cancelDetails.trim()}`
        : cancelReasonCategory;

      await apiRequest(`/admin/bookings/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: fullReason }),
      });
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
      fetchBooking();
    } catch (err: any) {
      toast.error(err.error || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commSummary.trim()) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/bookings/${id}/communications`, {
        method: 'POST',
        body: JSON.stringify({
          channel: commChannel,
          direction: commDirection,
          summary: commSummary,
          outcome: commOutcome,
        }),
      });
      toast.success('Customer communication logged');
      setShowCommModal(false);
      setCommSummary('');
      setCommOutcome('');
      fetchBooking();
    } catch (err: any) {
      toast.error(err.error || 'Failed to log communication');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_assignment':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Pending Specialist Match</span>
          </span>
        );
      case 'specialist_assigned':
        return (
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Specialist Assigned</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Confirmed Appointment</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span>Work In Progress</span>
          </span>
        );
      case 'rescheduled':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full">
            Rescheduled
          </span>
        );
      case 'completed':
        return (
          <span className="bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-slate-600" />
            <span>Job Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-full capitalize">
            {status.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-6 w-36 bg-slate-200/80 rounded-md animate-pulse" />
        <div className="h-28 bg-slate-200/80 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-96 bg-slate-200/80 rounded-2xl animate-pulse" />
          <div className="h-96 bg-slate-200/80 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 space-y-3">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-500">The requested booking or order could not be located.</p>
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>
      </div>
    );
  }

  const providerName = booking.provider_name || booking.provider?.name || booking.current_assignment?.provider_name;
  const assignedProvider = providerName ? {
    name: providerName,
    phone: booking.provider?.contact_phone || booking.provider?.phone,
    id: booking.provider_id || booking.provider?.id
  } : null;

  const totalAmount = booking.total_amount || booking.payment_amount || booking.service?.fixed_price || 0;
  const balanceDue = Math.max(0, totalAmount - (booking.total_paid || 0));

  // Determine current lifecycle step for stepper
  const stepIndex = 
    booking.status === 'completed' ? 4 :
    booking.status === 'in_progress' ? 3 :
    booking.status === 'specialist_assigned' || booking.status === 'confirmed' ? 2 :
    booking.status === 'cancelled' ? 0 : 1;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Orders & Bookings</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">
              Order #{booking.reference_number || `BK-${booking.id}`}
            </h1>
            <button
              onClick={copyReference}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Copy Reference Number"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {getStatusBadge(booking.status)}
          </div>
          <span className="text-xs text-slate-400 block mt-0.5">
            Placed on {new Date(booking.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </div>

        {/* Quick Lifecycle Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {(!booking.provider_id && booking.status !== 'completed' && booking.status !== 'cancelled') && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>+ Assign Specialist</span>
            </button>
          )}

          {(booking.status === 'specialist_assigned' || booking.status === 'confirmed') && (
            <button
              onClick={() => handleUpdateStatus('in_progress')}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Work</span>
            </button>
          )}

          {booking.status === 'in_progress' && (
            <button
              onClick={() => handleUpdateStatus('completed')}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Complete Service</span>
            </button>
          )}

          {booking.status !== 'completed' && booking.status !== 'cancelled' && (
            <>
              <button
                onClick={() => {
                  setRescheduleDate(booking.scheduled_at ? new Date(booking.scheduled_at).toISOString().split('T')[0] : '');
                  setShowRescheduleModal(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Reschedule</span>
              </button>

              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Visual Stepper */}
      {booking.status !== 'cancelled' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className={`p-2 rounded-xl transition ${stepIndex >= 1 ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-50 text-slate-400'}`}>
              <div className="font-bold flex items-center justify-center gap-1">
                {stepIndex > 1 ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                <span>1. Order Placed</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Customer Requested</span>
            </div>

            <div className={`p-2 rounded-xl transition ${stepIndex >= 2 ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-50 text-slate-400'}`}>
              <div className="font-bold flex items-center justify-center gap-1">
                {stepIndex > 2 ? <Check className="w-3 h-3 text-emerald-600" /> : (stepIndex === 2 ? <span className="w-2 h-2 rounded-full bg-emerald-500" /> : null)}
                <span>2. Specialist Matched</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Technician Dispatched</span>
            </div>

            <div className={`p-2 rounded-xl transition ${stepIndex >= 3 ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-50 text-slate-400'}`}>
              <div className="font-bold flex items-center justify-center gap-1">
                {stepIndex > 3 ? <Check className="w-3 h-3 text-emerald-600" /> : (stepIndex === 3 ? <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" /> : null)}
                <span>3. In Progress</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">On-Site Servicing</span>
            </div>

            <div className={`p-2 rounded-xl transition ${stepIndex >= 4 ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-50 text-slate-400'}`}>
              <div className="font-bold flex items-center justify-center gap-1">
                {stepIndex === 4 && <Check className="w-3 h-3 text-emerald-600" />}
                <span>4. Completed</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Job Settled</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Scope, Specialist, History & Logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Service & Scope of Work Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Service & Scope of Work</span>
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Fixed Price Admin Guarantee
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              {booking.service?.image_url && (
                <img
                  src={booking.service.image_url}
                  alt={booking.service.name}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-200/80 bg-slate-50 shrink-0"
                />
              )}
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  {booking.service_category || booking.service?.category?.name || 'Home Services'}
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {booking.service_name || booking.service?.name}
                </h3>
                {booking.service_variant && (
                  <div className="inline-block text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    Package: {booking.service_variant.name}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Options / Addons breakdown */}
            {booking.selected_options && Object.keys(booking.selected_options).length > 0 && (
              <div className="p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 block">Package Configuration:</span>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  {booking.selected_options.package_name && (
                    <div><span className="text-slate-400">Package:</span> <span className="font-semibold">{booking.selected_options.package_name}</span></div>
                  )}
                  {booking.selected_options.step_key && (
                    <div><span className="text-slate-400">Tier / Type:</span> <span className="font-semibold">{booking.selected_options.step_key}</span></div>
                  )}
                  {booking.vehicle_type && (
                    <div><span className="text-slate-400">Vehicle / Unit:</span> <span className="font-semibold">{booking.vehicle_type}</span></div>
                  )}
                  {booking.duration_hours && (
                    <div><span className="text-slate-400">Duration:</span> <span className="font-semibold">{booking.duration_hours} hrs</span></div>
                  )}
                </div>
                {booking.selected_options.addons && Array.isArray(booking.selected_options.addons) && booking.selected_options.addons.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 mt-1">
                    <span className="text-slate-400">Selected Addons: </span>
                    <span className="font-medium text-slate-800">{booking.selected_options.addons.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Customer Description */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Customer Notes / Instructions
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed whitespace-pre-line">
                {booking.description || 'No special instructions provided by customer.'}
              </p>
            </div>

            {/* Customer Uploaded Photos */}
            {booking.request_attachments && booking.request_attachments.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Requirement Photos ({booking.request_attachments.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {booking.request_attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-slate-200 rounded-xl p-1.5 bg-white hover:border-slate-400 transition block group overflow-hidden shadow-2xs"
                    >
                      <img
                        src={att.file_url}
                        alt="Requirement attachment"
                        className="w-full h-20 object-cover rounded-lg bg-slate-50"
                      />
                      <span className="text-[10px] text-slate-500 truncate block mt-1">
                        {att.file_name || 'View photo'}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Assigned Specialist Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-slate-400" />
                <span>Assigned Technician & Specialist</span>
              </span>
              {assignedProvider && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Reassign Specialist
                </button>
              )}
            </div>

            {assignedProvider ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50/80 border border-slate-200/70 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {assignedProvider.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{assignedProvider.name}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    {assignedProvider.phone && (
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{assignedProvider.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {assignedProvider.phone && (
                    <a
                      href={`tel:${assignedProvider.phone}`}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                    >
                      Call Provider
                    </a>
                  )}
                  {assignedProvider.id && (
                    <Link
                      href={`/admin/providers/${assignedProvider.id}`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition"
                    >
                      Provider Profile
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">No Specialist Assigned</h4>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                    This order is awaiting a verified field technician in Prayagraj. Dispatch an eligible specialist to commence work.
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Assign Specialist Now</span>
                </button>
              </div>
            )}
          </div>

          {/* Audit Trail / Lifecycle History */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-3 border-b border-slate-100">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>AASM State Transitions & Audit Trail</span>
            </span>

            {booking.status_history && booking.status_history.length > 0 ? (
              <div className="space-y-3">
                {booking.status_history.map((hist) => (
                  <div key={hist.id} className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        {hist.previous_status && (
                          <>
                            <span className="text-slate-400 capitalize">{hist.previous_status.replace(/_/g, ' ')}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </>
                        )}
                        <span className="text-teal-800 font-extrabold capitalize">{hist.new_status.replace(/_/g, ' ')}</span>
                      </div>
                      {hist.notes && (
                        <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                          {hist.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(hist.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 block mt-0.5">
                        {hist.changed_by_name || 'System'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No historical status logs recorded yet.</p>
            )}
          </div>

          {/* Customer Communications Log */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Customer Communications Log</span>
              </span>
              <button
                onClick={() => setShowCommModal(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                + Log Call / WhatsApp
              </button>
            </div>

            {booking.communications && booking.communications.length > 0 ? (
              <div className="space-y-2.5">
                {booking.communications.map((comm) => (
                  <div key={comm.id} className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 capitalize">
                        {comm.channel === 'whatsapp' ? (
                          <span className="text-emerald-700">● WhatsApp</span>
                        ) : (
                          <span className="text-blue-700">● Phone Call</span>
                        )}
                        <span className="text-slate-400 font-normal">({comm.direction})</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(comm.communicated_at || comm.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    {comm.summary && (
                      <p className="text-slate-700 text-xs font-medium">{comm.summary}</p>
                    )}
                    {comm.outcome && (
                      <p className="text-slate-500 text-[11px] italic">Outcome: {comm.outcome}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No customer calls or messages logged yet.</p>
            )}
          </div>

        </div>

        {/* Right Column (1 Col): Customer, Schedule, Financials & Notes */}
        <div className="space-y-6">

          {/* Customer & Address Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-3 border-b border-slate-100">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Customer & Delivery Address</span>
            </span>

            <div className="space-y-2">
              <div className="font-extrabold text-slate-900 text-sm">
                {booking.customer_name || booking.user?.name || 'Customer'}
              </div>

              {(booking.customer_phone || booking.user?.phone) && (
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${booking.customer_phone || booking.user?.phone}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${(booking.customer_phone || booking.user?.phone || '').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            {/* Address */}
            {booking.address ? (
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{booking.address.label || 'Service Address'}</span>
                </span>
                <p className="leading-relaxed">
                  {booking.address.full_address || booking.address.address_line}
                  {booking.address.landmark ? ` (Near ${booking.address.landmark})` : ''}
                </p>
                <p className="text-slate-500 font-medium">
                  {booking.address.city || 'Prayagraj'}, {booking.address.state || 'Uttar Pradesh'} - {booking.address.postal_code}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No delivery address specified.</p>
            )}
          </div>

          {/* Schedule Banner */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Appointment Schedule</span>
            </span>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Confirmed Slot:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }) : 'Not Scheduled'}
                </span>
              </div>

              {booking.preferred_at && (
                <div className="pt-2 border-t border-slate-100 text-slate-500 text-[11px]">
                  Customer Preferred: {new Date(booking.preferred_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Financial Settlement Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Payment & Settlement</span>
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${booking.fully_paid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {booking.fully_paid ? '● Settled' : '○ Balance Due'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-500">Guaranteed Amount:</span>
                <span className="font-extrabold text-slate-900 text-base">₹{totalAmount}</span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-500">Total Paid:</span>
                <span className="font-semibold text-emerald-700">₹{booking.total_paid || 0}</span>
              </div>
              <div className="flex items-baseline justify-between text-xs pt-1 border-t border-slate-100 font-bold">
                <span className="text-slate-700">Balance Remaining:</span>
                <span className={balanceDue > 0 ? 'text-amber-800' : 'text-slate-900'}>₹{balanceDue}</span>
              </div>
            </div>

            {balanceDue > 0 && (
              <button
                onClick={() => {
                  setOfflineAmount(balanceDue.toString());
                  setShowPaymentModal(true);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>+ Record Field Payment</span>
              </button>
            )}

            {/* Past payments list */}
            {booking.payments && booking.payments.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  Receipt History
                </span>
                {booking.payments.map((p) => (
                  <div key={p.id} className="p-2 bg-slate-50 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">₹{p.amount}</span>
                      <span className="text-slate-400 text-[10px] block capitalize">{p.method} • {p.status}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(p.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Internal Admin Notes Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Internal Dispatch Notes</span>
            </span>

            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about customer preference, technician coordination, special tooling required..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-slate-400 transition"
            />

            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <span>{savingNotes ? 'Saving...' : 'Save Internal Notes'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Specialist Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Assign Specialist</h3>
                  <p className="text-[11px] text-slate-500">Dispatch a certified provider in Prayagraj</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSpecialist} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Select Provider Organization / Specialist
                </label>
                <select
                  required
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-indigo-600 transition"
                >
                  <option value="">-- Choose verified provider --</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.service_area ? `(${p.service_area})` : `(${p.city})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Dispatch Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Call customer 30 mins before arrival..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !selectedProviderId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Reschedule Appointment</h3>
                  <p className="text-[11px] text-slate-500">Update scheduled visit time</p>
                </div>
              </div>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReschedule} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Select New Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-amber-600 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Select Arrival Window
                </label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-amber-600 transition"
                >
                  <option value="09:00">Morning (9 AM - 12 PM)</option>
                  <option value="12:00">Afternoon (12 PM - 3 PM)</option>
                  <option value="15:00">Late Afternoon (3 PM - 6 PM)</option>
                  <option value="18:00">Evening (6 PM - 8 PM)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rescheduleDate}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Record Field Settlement</h3>
                  <p className="text-[11px] text-slate-500">Record cash / UPI collected on-site</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Collected Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  value={offlineAmount}
                  onChange={(e) => setOfflineAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Payment Mode
                </label>
                <select
                  value={offlineType}
                  onChange={(e) => setOfflineType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-emerald-600 transition"
                >
                  <option value="cash">Cash Collected at Doorstep</option>
                  <option value="upi">Direct UPI / QR Transfer</option>
                  <option value="card">Card Machine / POS</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Settlement Notes / Transaction Ref (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cash handed to technician Rahul"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-emerald-600 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !offlineAmount}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Cancel Order</h3>
                  <p className="text-[11px] text-slate-500">Record cancellation reason for audit</p>
                </div>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCancelOrder} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Primary Cancellation Reason
                </label>
                <select
                  value={cancelReasonCategory}
                  onChange={(e) => setCancelReasonCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-rose-600 transition"
                >
                  <option value="Customer requested cancellation">Customer requested cancellation</option>
                  <option value="Specialist unavailable / No coverage">Specialist unavailable / No coverage</option>
                  <option value="Customer unresponsive on phone/address">Customer unresponsive on phone/address</option>
                  <option value="Duplicate order placed">Duplicate order placed</option>
                  <option value="Incorrect address outside Prayagraj">Incorrect address outside Prayagraj</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={cancelDetails}
                  onChange={(e) => setCancelDetails(e.target.value)}
                  placeholder="Provide context on why the order was cancelled..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-rose-600 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Communication Modal */}
      {showCommModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Log Customer Communication</h3>
                  <p className="text-[11px] text-slate-500">Record outreach or customer query</p>
                </div>
              </div>
              <button
                onClick={() => setShowCommModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogCommunication} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Channel</label>
                  <select
                    value={commChannel}
                    onChange={(e: any) => setCommChannel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none"
                  >
                    <option value="phone">Phone Call</option>
                    <option value="whatsapp">WhatsApp Chat</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Direction</label>
                  <select
                    value={commDirection}
                    onChange={(e: any) => setCommDirection(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none"
                  >
                    <option value="outbound">Outbound (We contacted customer)</option>
                    <option value="inbound">Inbound (Customer called/messaged)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Discussion Summary</label>
                <textarea
                  required
                  rows={2}
                  value={commSummary}
                  onChange={(e) => setCommSummary(e.target.value)}
                  placeholder="e.g. Confirmed technician arrival slot and gate access..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Outcome / Agreed Next Step</label>
                <input
                  type="text"
                  value={commOutcome}
                  onChange={(e) => setCommOutcome(e.target.value)}
                  placeholder="e.g. Customer will be home at 10 AM"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCommModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !commSummary.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Logging...' : 'Save Communication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
