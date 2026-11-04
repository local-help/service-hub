'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Plus, 
  ArrowLeft, 
  AlertCircle
} from 'lucide-react';
import { Service, Address, ServiceRequest } from '../../../../types';
import { apiRequest } from '../../../../api/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { CustomerSupportButtons } from '../../../../components/ui/SupportButtons';

export default function CreateRequestPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const router = useRouter();

  const [service, setService] = useState<Service | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  
  // New address form state
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    address_line: '',
    landmark: '',
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    postal_code: '211001',
    is_default: true,
  });

  // Request form state
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00');
  const [attachments, setAttachments] = useState<{ file_url: string; file_name: string }[]>([]);
  const [uploadUrl, setUploadUrl] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=/services/${id}/request`);
      return;
    }

    if (id) {
      apiRequest<Service>(`/services/${id}`).then(setService).catch(console.error);
    }

    apiRequest<Address[]>('/addresses')
      .then((addrs) => {
        setAddresses(addrs || []);
        const defaultAddr = addrs?.find((a) => a.is_default) || addrs?.[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        else setShowNewAddress(true);
      })
      .catch(console.error);
  }, [id, user, router]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiRequest<Address>('/addresses', {
        method: 'POST',
        body: JSON.stringify(newAddress),
      });
      setAddresses([created, ...addresses]);
      setSelectedAddressId(created.id);
      setShowNewAddress(false);
    } catch (err: any) {
      setError(err.error || 'Failed to save address');
    }
  };

  const handleAddAttachment = () => {
    if (!uploadUrl) return;
    setAttachments([
      ...attachments,
      { file_url: uploadUrl, file_name: uploadUrl.split('/').pop() || 'photo.jpg' },
    ]);
    setUploadUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddressId) {
      setError('Please select or add a service address');
      return;
    }
    if (!description.trim()) {
      setError('Please describe your requirement');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const preferredAt = preferredDate
        ? new Date(`${preferredDate}T${preferredTime}:00`).toISOString()
        : new Date(Date.now() + 86400000).toISOString();

      const response = await apiRequest<ServiceRequest>('/service_requests', {
        method: 'POST',
        body: JSON.stringify({
          service_id: service?.id,
          address_id: selectedAddressId,
          description,
          preferred_at: preferredAt,
          attachments,
        }),
      });

      setCreatedRequest(response);
    } catch (err: any) {
      setError(err.error || 'Failed to submit service request');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (createdRequest) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Service Request Submitted!
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your request has been received by our central LocalHelp coordination desk.
          </p>
        </div>

        {/* Reference Number Card */}
        <div className="bg-white border-2 border-dashed border-blue-200 rounded-3xl p-6 sm:p-8 max-w-md mx-auto shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Request Reference Number
          </span>
          <span className="text-3xl font-black text-blue-600 tracking-wider">
            {createdRequest.reference_number}
          </span>
          <p className="text-xs text-slate-500 mt-2">
            Quote this reference whenever contacting customer support.
          </p>
        </div>

        {/* Workflow reminder */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-left max-w-md mx-auto text-xs space-y-2.5">
          <h4 className="font-bold text-slate-900 text-sm">Next Steps:</h4>
          <p className="text-slate-600">
            • <strong>Admin Coordination:</strong> Our desk will contact one verified local technician to confirm schedule & pricing.
          </p>
          <p className="text-slate-600">
            • <strong>One Quotation:</strong> You'll receive 1 transparent quote directly in your app. No spam calls.
          </p>
        </div>

        {/* Support Buttons */}
        <div className="space-y-4 max-w-md mx-auto">
          <p className="text-xs font-semibold text-slate-500">Need immediate update?</p>
          <CustomerSupportButtons
            referenceNumber={createdRequest.reference_number}
            serviceName={createdRequest.service?.name}
            className="justify-center"
          />
        </div>

        <div className="pt-4 flex items-center justify-center gap-4 text-xs font-semibold">
          <Link
            href={`/requests/${createdRequest.id}`}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
          >
            View Request Details
          </Link>
          <Link
            href="/requests"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            My Requests List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          href={`/services/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Service</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Request Service
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {service?.name} • {service?.pricing_type === 'fixed_price' ? `Fixed Price ₹${service.fixed_price}` : 'Quotation Based'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Address */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Service Location</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowNewAddress(!showNewAddress)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showNewAddress ? 'Cancel' : 'Add New Address'}</span>
            </button>
          </div>

          {/* New Address Sub-form */}
          {showNewAddress ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <p className="text-xs font-bold text-slate-700">Add Service Address (Prayagraj, Allahabad)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Label (e.g. Home, Office)"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="text"
                  placeholder="Address Line (Flat / Building / Street)"
                  required
                  value={newAddress.address_line}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="text"
                  placeholder="Landmark (Optional)"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="text"
                  placeholder="PIN Code"
                  required
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleAddAddress}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                Save & Use This Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    selectedAddressId === addr.id
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{addr.label || 'Address'}</span>
                    {addr.is_default && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">{addr.full_address}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Requirement Details */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Requirement Description
          </h3>
          <p className="text-xs text-slate-500">
            Describe what needs to be done, brand or model (if appliance/car), or specific issues observed.
          </p>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="E.g., Kitchen sink pipe is leaking at the joint. Water leaks when tap is on. Looking for quick fix."
            className="w-full p-3.5 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:border-blue-500 transition"
          />

          {/* Optional Attachments / Photo URLs */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Add Photo Links (Optional)</span>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Add Link
              </button>
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {attachments.map((att, i) => (
                  <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                    📎 {att.file_name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Preferred Schedule */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Preferred Date & Time</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Preferred Date</label>
              <input
                type="date"
                value={preferredDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Preferred Time Window</label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
              >
                <option value="09:00">Morning (9:00 AM - 12:00 PM)</option>
                <option value="12:00">Afternoon (12:00 PM - 3:00 PM)</option>
                <option value="15:00">Late Afternoon (3:00 PM - 6:00 PM)</option>
                <option value="18:00">Evening (6:00 PM - 8:00 PM)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/services/${id}`}
            className="px-5 py-3 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition cursor-pointer"
          >
            {submitting ? 'Submitting...' : 'Confirm & Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

