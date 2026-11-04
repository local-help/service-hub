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
  Plus, 
  CheckCircle, 
  Clock, 
  History,
  Send,
  AlertCircle
} from 'lucide-react';
import { ServiceRequest, Provider, Communication, Quotation } from '../../../../types';
import { apiRequest } from '../../../../api/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { AdminCommunicationButtons } from '../../../../components/ui/SupportButtons';

export default function AdminRequestDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Assign provider state
  const [selectedProviderId, setSelectedProviderId] = useState<number | ''>('');

  // Quotation form state
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteValidDays, setQuoteValidDays] = useState('3');

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
      apiRequest<{ providers: Provider[] } | Provider[]>('/admin/providers?active=true'),
    ])
      .then(([reqData, provData]) => {
        setRequest(reqData);
        setAdminNotes(reqData.admin_notes || '');
        if (reqData.provider_id) setSelectedProviderId(reqData.provider_id);
        const pList = Array.isArray(provData) ? provData : (provData as any).providers || [];
        setProviders(pList);
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
        body: JSON.stringify({ provider_id: selectedProviderId }),
      });
      alert('Provider assigned successfully');
      fetchRequest();
    } catch (err: any) {
      alert(err.error || 'Failed to assign provider');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteAmount) return;
    setActionLoading(true);
    try {
      const validUntil = new Date(Date.now() + parseInt(quoteValidDays) * 86400000).toISOString();
      await apiRequest(`/admin/quotations/${id}`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(quoteAmount),
          description: quoteDescription,
          valid_until: validUntil,
        }),
      });
      setShowQuoteForm(false);
      alert('Quotation created and sent to customer');
      fetchRequest();
    } catch (err: any) {
      alert(err.error || 'Failed to create quotation');
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
      alert('Communication outcome recorded');
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
      alert('Internal notes updated');
      fetchRequest();
    } catch (err: any) {
      alert(err.error || 'Failed to update notes');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-slate-900">Request Not Found</h2>
        <Link href="/admin/requests" className="inline-block mt-4 text-sm text-blue-600 font-semibold hover:underline">
          Back to all requests
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div>
        <Link
          href="/admin/requests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Requests</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-blue-600 font-mono tracking-wider">
                {request.reference_number}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 capitalize">
                {request.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {request.service?.name}
            </h1>
          </div>

          {/* Action to log communication */}
          <div className="flex items-center gap-2">
            <AdminCommunicationButtons
              customerPhone={request.user?.phone || ''}
              referenceNumber={request.reference_number}
              onOpenLogModal={() => setShowCommModal(true)}
            />
          </div>
        </div>
      </div>

      {/* 2-Column Management Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Coordination */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Address Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Customer Information</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Name</span>
                <span className="font-bold text-slate-900">{request.user?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Phone Number</span>
                <span className="font-bold text-slate-900 font-mono">{request.user?.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Email</span>
                <span className="font-medium text-slate-700">{request.user?.email || 'N/A'}</span>
              </div>
            </div>

            {request.address && (
              <div className="pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400 block mb-0.5">Service Address</span>
                <p className="font-medium text-slate-800">{request.address.full_address}</p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400 block mb-0.5">Customer Requirement</span>
              <p className="text-slate-700 whitespace-pre-line leading-relaxed">{request.description}</p>
            </div>
          </div>

          {/* Step A: Assign One Provider (V1 Strict Business Rule) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-600" />
                <span>Assign Verified Specialist (1 Provider Policy)</span>
              </h3>
              {request.provider && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Assigned: {request.provider.name}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Select one suitable provider from the directory. Call the technician externally to confirm availability and quoted cost.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(Number(e.target.value) || '')}
                className="w-full sm:flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white"
              >
                <option value="">-- Choose Specialist from Directory --</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.phone}) — Area: {p.service_area || p.city}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAssignProvider}
                disabled={actionLoading || !selectedProviderId}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {request.provider ? 'Reassign' : 'Assign Specialist'}
              </button>
            </div>
          </div>

          {/* Step B: Create One Quotation (V1 Strict Business Rule) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Quotation Management (1 Quotation Policy)</span>
              </h3>
              {request.quotation ? (
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  request.quotation.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                  request.quotation.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                  'bg-indigo-100 text-indigo-800'
                }`}>
                  {request.quotation.status}
                </span>
              ) : (
                <button
                  onClick={() => setShowQuoteForm(!showQuoteForm)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showQuoteForm ? 'Cancel' : 'Create Quotation'}</span>
                </button>
              )}
            </div>

            {request.quotation ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">₹{request.quotation.amount}</span>
                  <span className="text-slate-400">valid until {new Date(request.quotation.valid_until).toLocaleDateString('en-IN')}</span>
                </div>
                <p className="text-slate-600 whitespace-pre-line">{request.quotation.description}</p>
              </div>
            ) : showQuoteForm ? (
              <form onSubmit={handleCreateQuotation} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Quotation Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      step="0.01"
                      placeholder="e.g. 750"
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Validity (Days)</label>
                    <select
                      value={quoteValidDays}
                      onChange={(e) => setQuoteValidDays(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                    >
                      <option value="2">2 Days</option>
                      <option value="3">3 Days (Recommended)</option>
                      <option value="7">7 Days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quotation Scope & Description</label>
                  <textarea
                    rows={3}
                    placeholder="Includes technician travel, dismantling, copper pipe seal and 30-day service warranty."
                    value={quoteDescription}
                    onChange={(e) => setQuoteDescription(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  {actionLoading ? 'Sending...' : 'Send Quotation to Customer'}
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-500">
                No quotation created yet. After confirming pricing with the assigned specialist, click "Create Quotation".
              </p>
            )}
          </div>

          {/* Communication History Timeline */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>Customer Communication History</span>
              </h3>
              <button
                onClick={() => setShowCommModal(true)}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Outcome</span>
              </button>
            </div>

            {request.communications && request.communications.length > 0 ? (
              <div className="space-y-3">
                {request.communications.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 capitalize flex items-center gap-1.5">
                        {c.channel === 'phone' ? <Phone className="w-3.5 h-3.5 text-blue-600" /> : <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>{c.direction} {c.channel}</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(c.communicated_at).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700">{c.summary}</p>
                    {c.outcome && (
                      <p className="text-slate-500 text-[11px]">
                        Outcome: <strong>{c.outcome}</strong>
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400 block pt-1">
                      Logged by {c.admin_name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No communication logged yet. Use Call or WhatsApp actions above, then click "Log Outcome".
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Internal Notes & Status */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Internal Admin Notes</h3>
            <textarea
              rows={5}
              placeholder="Private coordination notes for admin team only..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none"
            />
            <button
              onClick={handleSaveNotes}
              disabled={actionLoading}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              Update Internal Notes
            </button>
          </div>
        </div>
      </div>

      {/* Log Communication Modal */}
      {showCommModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Log Communication Outcome</h3>
            <p className="text-xs text-slate-500">
              Record outcome of your phone call or WhatsApp discussion with {request.user?.name}.
            </p>

            <form onSubmit={handleLogCommunication} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">Channel</label>
                  <select
                    value={commChannel}
                    onChange={(e: any) => setCommChannel(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="phone">Phone Call</option>
                    <option value="whatsapp">WhatsApp Message</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Direction</label>
                  <select
                    value={commDirection}
                    onChange={(e: any) => setCommDirection(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="outbound">Outbound (We contacted)</option>
                    <option value="inbound">Inbound (Customer called)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Summary of Discussion</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Spoke with customer about vehicle location & parking access."
                  value={commSummary}
                  onChange={(e) => setCommSummary(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Outcome / Next Action</label>
                <input
                  type="text"
                  placeholder="Customer agreed to morning slot; specialist informed."
                  value={commOutcome}
                  onChange={(e) => setCommOutcome(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCommModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
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

