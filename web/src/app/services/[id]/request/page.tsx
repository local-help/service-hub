'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  MapPin,
  Calendar,
  Plus,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Car,
  Clock
} from 'lucide-react';
import { Service, Address, ServiceRequest, ServiceVariant } from '../../../../types';
import { apiRequest } from '../../../../api/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { CustomerSupportButtons } from '../../../../components/ui/SupportButtons';

function CreateRequestContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const router = useRouter();

  // Query params from service detail page
  const variantIdParam = searchParams.get('variant_id');
  const vehicleTypeParam = searchParams.get('vehicle_type');
  const durationHoursParam = searchParams.get('duration_hours');
  const pickupDropParam = searchParams.get('pickup_drop');

  const [service, setService] = useState<Service | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(null);
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

    // Fetch service details
    apiRequest<Service>(`/services/${id}`).then((svc) => {
      setService(svc);
      if (variantIdParam && svc.variants) {
        const found = svc.variants.find((v) => v.id.toString() === variantIdParam);
        if (found) setSelectedVariant(found);
      }
    }).catch(console.error);

    // Fetch addresses
    apiRequest<Address[]>('/addresses').then((list) => {
      setAddresses(list);
      const def = list.find((a) => a.is_default);
      if (def) setSelectedAddressId(def.id);
      else if (list.length > 0) setSelectedAddressId(list[0].id);
      else setShowNewAddress(true);
    }).catch(console.error);
  }, [id, user, variantIdParam]);

  const handleCreateAddress = async (e: React.FormEvent) => {
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
          service_variant_id: variantIdParam ? parseInt(variantIdParam) : null,
          vehicle_type: vehicleTypeParam || null,
          duration_hours: durationHoursParam ? parseInt(durationHoursParam) : null,
          selected_options: pickupDropParam === 'true' ? { pickup_and_drop: true } : {},
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#242D2B] tracking-tight">
            Service Request Submitted!
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your request has been registered in our central system. Our customer support desk will coordinate with a verified local technician.
          </p>
        </div>

        {/* Reference Code Card */}
        <div className="p-6 bg-white border border-[#E7E2D8] rounded-3xl shadow-sm space-y-3">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Reference Number</span>
          <p className="text-3xl font-mono font-black text-[#176B65] tracking-wider">
            {createdRequest.reference_number}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <span>Status:</span>
            <span className="font-bold text-amber-600 uppercase">
              {createdRequest.status.replace('_', ' ')}
            </span>
          </div>
          {selectedVariant && (
            <p className="text-xs text-slate-600 font-medium pt-2 border-t border-[#E7E2D8]">
              Selected Package: <strong>{selectedVariant.name}</strong>
            </p>
          )}
        </div>

        {/* Help & Support Call/WA buttons */}
        <div className="pt-2">
          <CustomerSupportButtons
            referenceNumber={createdRequest.reference_number}
            serviceName={createdRequest.service?.name}
            className="justify-center"
          />
        </div>

        <div className="pt-4 flex items-center justify-center gap-4 text-xs font-semibold">
          <Link
            href={`/requests/${createdRequest.id}`}
            className="px-5 py-2.5 bg-[#176B65] hover:bg-[#135752] text-white rounded-xl shadow-xs transition"
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#242D2B] tracking-tight">
          Request Service
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {service?.name} • {service?.booking_type === 'fixed_price' ? `Fixed Price ₹${service.fixed_price}` : service?.booking_type === 'time_based' ? 'Time-Based Driver Service' : 'Quotation Based'}
        </p>
      </div>

      {/* Selected Package Banner */}
      {(selectedVariant || durationHoursParam || vehicleTypeParam) && (
        <div className="p-4 rounded-2xl bg-[#F7F5EF] border border-[#E7E2D8] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#176B65] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#176B65] tracking-wider block">Configured Service</span>
              <p className="text-xs font-bold text-[#242D2B]">
                {selectedVariant ? selectedVariant.name : service?.name}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                {vehicleTypeParam && <span>Vehicle: {vehicleTypeParam.toUpperCase()}</span>}
                {durationHoursParam && <span>• Duration: {durationHoursParam} Hours</span>}
                {pickupDropParam === 'true' && <span>• Includes Pickup & Drop</span>}
              </div>
            </div>
          </div>
          {selectedVariant?.primary_price && (
            <span className="text-base font-black text-[#176B65] shrink-0">
              ₹{selectedVariant.primary_price}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Address */}
        <div className="bg-white border border-[#E7E2D8] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#242D2B] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#176B65]" />
              <span>Service Location</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowNewAddress(!showNewAddress)}
              className="text-xs font-bold text-[#176B65] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showNewAddress ? 'Cancel' : 'Add New Address'}</span>
            </button>
          </div>

          {/* New Address Sub-form */}
          {showNewAddress ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
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
                  placeholder="PIN Code (e.g. 211001)"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="text"
                  placeholder="Flat / Floor / Street Address *"
                  required
                  value={newAddress.address_line}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white sm:col-span-2"
                />
                <input
                  type="text"
                  placeholder="Landmark (Optional)"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white sm:col-span-2"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateAddress}
                className="px-4 py-2 bg-[#176B65] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Save & Select This Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${selectedAddressId === addr.id
                    ? 'border-[#176B65] bg-[#F7F5EF] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{addr.label || 'Address'}</span>
                    {selectedAddressId === addr.id && (
                      <span className="text-[10px] font-bold text-[#176B65] uppercase">Selected</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{addr.full_address || addr.address_line}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Preferred Schedule */}
        <div className="bg-white border border-[#E7E2D8] rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#242D2B] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#176B65]" />
            <span>Preferred Date & Time</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Preferred Date</label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Preferred Time Window</label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl outline-none bg-white"
              >
                <option value="09:00">Morning (09:00 AM - 12:00 PM)</option>
                <option value="13:00">Afternoon (01:00 PM - 04:00 PM)</option>
                <option value="17:00">Evening (05:00 PM - 08:00 PM)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Requirement Description & Uploads */}
        <div className="bg-white border border-[#E7E2D8] rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#242D2B]">Requirement Details</h3>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Describe the service needed *</label>
            <textarea
              required
              rows={4}
              placeholder="e.g. Need comprehensive wash for my Honda City. Car is parked in the basement, power socket and water tap available."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Attach Photo URL (Optional)</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/issue-photo.jpg"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Add Link
              </button>
            </div>
            {attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((att, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-mono">
                    📎 {att.file_name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-[#176B65] hover:bg-[#135752] text-white font-bold text-sm rounded-2xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <span>Submitting Service Request...</span>
          ) : (
            <>
              <span>Submit Service Request</span>
              <CheckCircle2 className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <CustomerSupportButtons variant="banner" />
    </div>
  );
}

export default function CreateRequestPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-48 bg-slate-200 rounded-2xl" />
      </div>
    }>
      <CreateRequestContent />
    </Suspense>
  );
}
