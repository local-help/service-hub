'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Wrench, 
  Phone, 
  MessageCircle, 
  FileText, 
  CheckCircle, 
  Clock, 
  History,
  Send,
  AlertCircle,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Check,
  Sparkles,
  ChevronRight,
  Save,
  Tag,
  DollarSign,
  Edit2
} from 'lucide-react';
import { ServiceRequest, Provider, Communication } from '../../../../types';
import { apiRequest } from '../../../../api/client';
import { useAuth } from '../../../../contexts/AuthContext';

export default function AdminRequestDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [saveNoteSuccess, setSaveNoteSuccess] = useState(false);

  // Assign provider state
  const [selectedProviderId, setSelectedProviderId] = useState<number | ''>('');
  const [assignNotes, setAssignNotes] = useState('');

  // Fixed Price adjustment state
  const [showPriceEdit, setShowPriceEdit] = useState(false);
  const [customPrice, setCustomPrice] = useState('');

  // Communication logger modal state
  const [showCommModal, setShowCommModal] = useState(false);
  const [commChannel, setCommChannel] = useState<'phone' | 'whatsapp'>('phone');
  const [commDirection, setCommDirection] = useState<'outbound' | 'inbound'>('outbound');
  const [commSummary, setCommSummary] = useState('');
  const [commOutcome, setCommOutcome] = useState('');

  // Admin notes state
  const [adminNotes, setAdminNotes] = useState('');

  const fetchRequest = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      apiRequest<ServiceRequest>(`/admin/service_requests/${id}`),
      apiRequest<any[]>(`/admin/service_requests/${id}/assignment_history`).catch(() => []),
      apiRequest<Provider[]>(`/admin/providers/eligible?city=Prayagraj`).catch(() => []),
    ])
      .then(([reqData, historyData, provData]) => {
        setRequest(reqData);
        setAssignmentHistory(historyData || []);
        setAdminNotes(reqData.admin_notes || '');
        if (reqData.provider_id) setSelectedProviderId(reqData.provider_id);
        const pList = Array.isArray(provData) ? provData : (provData as any).providers || [];
        setProviders(pList);
        const currentAmount = reqData.booking?.total_amount || reqData.service?.fixed_price || 0;
        setCustomPrice(`${currentAmount}`);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/login?redirect=/admin/requests');
      return;
    }
    fetchRequest();
  }, [id, user, isAdmin]);

  const handleAssignProvider = async () => {
    if (!selectedProviderId) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/service_requests/${id}/assign_provider`, {
        method: 'POST',
        body: JSON.stringify({ provider_id: selectedProviderId, notes: assignNotes }),
      });
      setAssignNotes('');
      fetchRequest();
    } catch (err: any) {
      alert(err.error || 'Failed to assign provider');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrice || !request?.booking?.id) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/bookings/${request.booking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ total_amount: parseFloat(customPrice) }),
      });
      setShowPriceEdit(false);
      fetchRequest();
    } catch (err: any) {
      alert(err.error || 'Failed to update booking price');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commSummary) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/service_requests/${id}/communications`, {
        method: 'POST',
        body: JSON.stringify({
          channel: commChannel,
          direction: commDirection,
          summary: commSummary,
          outcome: commOutcome,
        }),
      });
      setShowCommModal(false);
      setCommSummary('');
      setCommOutcome('');
      fetchRequest();
    } catch (err: any) {
      alert(err.error || 'Failed to record communication');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setActionLoading(true);
    try {
      await apiRequest(`/admin/service_requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ admin_notes: adminNotes }),
      });
      setSaveNoteSuccess(true);
      setTimeout(() => setSaveNoteSuccess(false), 3000);
      fetchRequest();
    } catch (err: any) {
      alert(err.error || 'Failed to update notes');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'pending_review':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80"><Clock className="w-3 h-3" /> Pending Review</span>;
      case 'contacting_provider':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200/80"><Wrench className="w-3 h-3" /> Specialist Assigned</span>;
      case 'confirmed':
      case 'booking_confirmed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80"><CheckCircle className="w-3 h-3" /> Confirmed Booking</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200/80"><Wrench className="w-3 h-3" /> In Progress</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200/80"><Check className="w-3 h-3" /> Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200/80"><AlertCircle className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 capitalize">{status.replace(/_/g, ' ')}</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-slate-200 rounded-2xl" />
            <div className="h-48 bg-slate-200 rounded-2xl" />
          </div>
          <div className="h-96 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Request Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          This service inquiry does not exist or may have been removed.
        </p>
        <Link href="/admin/requests" className="inline-block mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition">
          Return to Inquiries
        </Link>
      </div>
    );
  }

  const rawPhone = request.user?.phone || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const intlPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone.replace(/^0+/, '')}`;
  const effectivePrice = request.booking?.total_amount || request.service?.fixed_price || 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <Link
            href="/admin/requests"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Inquiries</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {request.service?.name}
            </h1>
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              {request.reference_number}
            </span>
            {getStatusBadge(request.status)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Submitted on {new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Prayagraj Operations
          </p>
        </div>

        {/* Quick Customer Contact Actions */}
        <div className="flex items-center gap-2">
          {rawPhone && (
            <>
              <a
                href={`tel:${rawPhone}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Client</span>
              </a>
              <a
                href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(`Hello ${request.user?.name || 'Customer'}, regarding your LocalHelp booking ${request.reference_number} for ${request.service?.name}...`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </>
          )}
          <button
            onClick={() => setShowCommModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>Log Call</span>
          </button>
        </div>
      </div>

      {/* 2-Column Balanced Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Details, Specialist Assignment, Fixed Pricing (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Customer & Inquiry Scope */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Customer & Request Details</span>
              </h3>
              <span className="text-[11px] font-medium text-slate-500">
                Client ID #{request.user_id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Customer Name</span>
                <span className="font-semibold text-slate-900">{request.user?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                <span className="font-mono font-semibold text-slate-900">{request.user?.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email Address</span>
                <span className="font-medium text-slate-700 truncate block">{request.user?.email || 'N/A'}</span>
              </div>
            </div>

            {request.address && (
              <div className="text-xs space-y-1">
                <span className="text-slate-400 font-medium block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Service Location
                </span>
                <p className="font-medium text-slate-800 pl-4">
                  {request.address.full_address || `${request.address.address_line}, ${request.address.city} ${request.address.postal_code}`}
                </p>
                {request.address.landmark && (
                  <p className="text-slate-500 text-[11px] pl-4">
                    Landmark: {request.address.landmark}
                  </p>
                )}
              </div>
            )}

            <div className="text-xs space-y-1 pt-3 border-t border-slate-100">
              <span className="text-slate-400 font-medium block">Job Description & Customer Notes</span>
              <p className="text-slate-700 bg-slate-50/60 p-3 rounded-xl border border-slate-200/50 whitespace-pre-line leading-relaxed">
                {request.description || 'No additional notes provided by customer.'}
              </p>
            </div>
          </div>

          {/* Card 2: Fixed Price Determined by Admin */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>Fixed Service Price (Admin Determined)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard fixed price for this service in Prayagraj
                </p>
              </div>

              {request.booking?.id && (
                <button
                  onClick={() => setShowPriceEdit(!showPriceEdit)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{showPriceEdit ? 'Cancel' : 'Adjust Price'}</span>
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3 text-xs">
              <div className="flex items-baseline justify-between border-b border-slate-200/60 pb-3">
                <div>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    ₹{effectivePrice}
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    Standard fixed rate (inclusive of all taxes)
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    Fixed Price Guaranteed
                  </span>
                  {request.booking && (
                    <span className="block text-[11px] text-slate-400 mt-1">
                      Paid: ₹{request.booking.total_paid || 0}
                    </span>
                  )}
                </div>
              </div>

              {showPriceEdit && (
                <form onSubmit={handleUpdatePrice} className="pt-2 flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Update Price for Booking #{request.booking?.id}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      step="1"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white font-bold text-slate-900 focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="mt-5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Save Price
                  </button>
                </form>
              )}

              <p className="text-slate-500 text-[11px] leading-relaxed">
                Prices in LocalHelp are fixed and determined by administration. The assigned specialist performs the job at this agreed rate with no price bargaining.
              </p>
            </div>
          </div>

          {/* Card 3: Provider Assignment (Strict 1-Provider Policy) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-600" />
                  <span>Specialist Assignment</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign 1 verified local technician to service this booking at the fixed rate
                </p>
              </div>
              {request.provider ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {request.provider.name}
                </span>
              ) : (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
                  Unassigned
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(Number(e.target.value) || '')}
                  className="w-full sm:flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white font-medium text-slate-800 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                >
                  <option value="">-- Choose Specialist from Prayagraj Directory --</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone}) — {p.service_area || p.city || 'Prayagraj'} {p.verification_status ? `[${p.verification_status}]` : ''}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAssignProvider}
                  disabled={actionLoading || !selectedProviderId}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition cursor-pointer shrink-0"
                >
                  {request.provider ? 'Reassign Specialist' : 'Assign Specialist'}
                </button>
              </div>

              <input
                type="text"
                placeholder="Routing notes for specialist (e.g. customer prefers 10 AM, specific gate key)"
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            {/* Provider Assignment Audit Trail */}
            {assignmentHistory.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <span className="text-xs font-semibold text-slate-700 block">
                  Assignment Audit Trail ({assignmentHistory.length})
                </span>
                <div className="space-y-2">
                  {assignmentHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-800">{item.provider_name}</strong>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            item.status === 'accepted' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                            item.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            item.status === 'rejected' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        {item.internal_notes && (
                          <p className="text-slate-600 text-[11px] mt-0.5">Notes: {item.internal_notes}</p>
                        )}
                        {item.rejection_reason && (
                          <p className="text-rose-600 text-[11px] mt-0.5">Reason: {item.rejection_reason}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(item.assigned_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Internal Admin Notes & Customer Communication Timeline (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 4: Internal Admin Notes */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <span>Internal Notes</span>
              </h3>
              {saveNoteSuccess && (
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Private coordination notes visible only to the administration team.
            </p>
            <textarea
              rows={4}
              placeholder="e.g. Customer mentioned gate buzzer is broken, call before arriving..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full p-3 text-xs border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
            />
            <button
              onClick={handleSaveNotes}
              disabled={actionLoading}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Notes</span>
            </button>
          </div>

          {/* Card 5: Communication History Timeline */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>Communication Log</span>
              </h3>
              <button
                onClick={() => setShowCommModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>Record Call</span>
              </button>
            </div>

            {request.communications && request.communications.length > 0 ? (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {request.communications.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/70 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 capitalize flex items-center gap-1.5">
                        {c.channel === 'phone' ? (
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>{c.direction} {c.channel}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(c.communicated_at).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{c.summary}</p>
                    {c.outcome && (
                      <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-200/40">
                        Outcome: <strong className="text-slate-800">{c.outcome}</strong>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      Logged by {c.admin_name || 'Admin'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-1">
                <Phone className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No calls or messages logged yet</p>
                <p className="text-[11px] text-slate-400">
                  Click &ldquo;Record Call&rdquo; to log verbal agreements or follow-ups.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Communication Modal */}
      {showCommModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Log Communication Outcome</h3>
              <button
                onClick={() => setShowCommModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Record outcome of your discussion with {request.user?.name || 'Customer'}.
            </p>

            <form onSubmit={handleLogCommunication} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Channel</label>
                  <select
                    value={commChannel}
                    onChange={(e: any) => setCommChannel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white text-xs"
                  >
                    <option value="phone">Phone Call</option>
                    <option value="whatsapp">WhatsApp Message</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Direction</label>
                  <select
                    value={commDirection}
                    onChange={(e: any) => setCommDirection(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white text-xs"
                  >
                    <option value="outbound">Outbound (We initiated)</option>
                    <option value="inbound">Inbound (Client contacted)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Discussion Summary</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Explained technician arrival window and checked customer preferences."
                  value={commSummary}
                  onChange={(e) => setCommSummary(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Outcome / Agreed Next Step</label>
                <input
                  type="text"
                  placeholder="e.g. Confirmed arrival tomorrow at 10 AM; specialist dispatched."
                  value={commOutcome}
                  onChange={(e) => setCommOutcome(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCommModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
