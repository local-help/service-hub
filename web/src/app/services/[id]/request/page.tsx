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
  Upload,
  X,
  Loader2,
  ImageIcon
} from 'lucide-react';
import { Service, Address, ServiceRequest, ServiceVariant } from '../../../../types';
import { apiRequest } from '../../../../api/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { CustomerSupportButtons } from '../../../../components/ui/SupportButtons';
import { GpsButton } from '../../../../components/ui/GpsButton';
import { LocationData } from '../../../../contexts/LocationContext';

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
    latitude: 25.4519 as number | null,
    longitude: 81.8340 as number | null,
    is_default: true,
  });

  const handleGpsDetected = (loc: LocationData) => {
    setNewAddress((prev) => ({
      ...prev,
      address_line: loc.address_line,
      landmark: loc.landmark || loc.locality,
      postal_code: loc.postal_code || prev.postal_code,
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
  };

  // Request form state
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00');
  const [attachments, setAttachments] = useState<{ file_url: string; file_name: string }[]>([]);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    if (!uploadUrl.trim()) return;
    const name = uploadUrl.split('/').pop()?.split('?')[0] || 'photo.jpg';
    setAttachments([
      ...attachments,
      { file_url: uploadUrl.trim(), file_name: name },
    ]);
    setUploadUrl('');
  };

  const handleDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await apiRequest<{ file_url: string; file_name: string }>('/uploads', {
          method: 'POST',
          body: formData,
        });

        setAttachments((prev) => [
          ...prev,
          {
            file_url: res.file_url,
            file_name: res.file_name || file.name,
          },
        ]);
      }
    } catch (err: any) {
      setError(err.error || 'Failed to upload photo from device');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
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
      <div className="max-w-md mx-auto px-4 py-16 space-y-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Request Submitted
          </h1>
          <p className="text-xs text-slate-500">
            Your request has been matched and is being coordinated with a local technician.
          </p>
        </div>

        {/* Reference Code Card */}
        <div className="p-5 border border-slate-200 rounded-xl space-y-2 text-center bg-slate-50/50">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Reference Number</span>
          <p className="text-2xl font-mono font-semibold text-slate-900">
            {createdRequest.reference_number}
          </p>
          <div className="text-xs text-slate-500 pt-1">
            Status: <span className="font-medium text-slate-800 capitalize">{createdRequest.status.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs font-medium pt-2">
          <Link
            href={`/requests/${createdRequest.id}`}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition"
          >
            View Details
          </Link>
          <Link
            href="/requests"
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition"
          >
            All Requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          href={`/services/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to service</span>
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Book Service
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {service?.name} {selectedVariant ? `• ${selectedVariant.name}` : ''}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Address */}
        <div className="border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>Doorstep Address</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowNewAddress(!showNewAddress)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showNewAddress ? 'Cancel' : 'New address'}</span>
            </button>
          </div>

          {/* New Address Sub-form */}
          {showNewAddress ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-medium text-slate-700">Add Doorstep Address</span>
                <GpsButton onLocationDetected={handleGpsDetected} label="Detect GPS" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Label (e.g. Home, Office)"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 outline-none"
                />
                <input
                  type="text"
                  placeholder="PIN Code (e.g. 211001)"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 outline-none"
                />
                <input
                  type="text"
                  placeholder="Flat / Street Address *"
                  required
                  value={newAddress.address_line}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 outline-none sm:col-span-2"
                />
                <input
                  type="text"
                  placeholder="Landmark (Optional)"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 outline-none sm:col-span-2"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateAddress}
                className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md cursor-pointer"
              >
                Save & Select
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    selectedAddressId === addr.id
                      ? 'border-slate-900 bg-slate-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-900">{addr.label || 'Address'}</span>
                    {selectedAddressId === addr.id && (
                      <span className="text-[10px] text-slate-500 font-medium">Selected</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{addr.full_address || addr.address_line}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Preferred Schedule */}
        <div className="border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Preferred Schedule</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Date</label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Time Window</label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none bg-white text-slate-900"
              >
                <option value="09:00">Morning (9 AM - 12 PM)</option>
                <option value="13:00">Afternoon (1 PM - 4 PM)</option>
                <option value="17:00">Evening (5 PM - 8 PM)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Requirement Details */}
        <div className="border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Details</h3>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Describe your requirement *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Need comprehensive wash for my Honda City. Basement parking, water tap available."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">Attach Photos (Optional)</label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline transition cursor-pointer"
              >
                {showUrlInput ? 'Upload from device' : 'Or paste photo URL'}
              </button>
            </div>

            {!showUrlInput ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleDeviceUpload}
                  className="hidden"
                  id="device-photo-upload"
                />
                <label
                  htmlFor="device-photo-upload"
                  className={`border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/70 hover:bg-slate-100/70 transition text-center ${
                    uploadingFile ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  {uploadingFile ? (
                    <div className="flex items-center gap-2 text-xs text-slate-600 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                      <span>Uploading from device...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-900 block">
                          Upload photo from device
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Take a photo or choose from library (JPG, PNG, WebP)
                        </span>
                      </div>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition cursor-pointer"
                >
                  Add
                </button>
              </div>
            )}

            {/* Thumbnail previews */}
            {attachments.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="border border-slate-200 rounded-lg p-2 bg-white flex items-center gap-2.5 overflow-hidden shadow-xs"
                  >
                    <img
                      src={att.file_url}
                      alt={att.file_name}
                      className="w-10 h-10 rounded-md object-cover border border-slate-100 bg-slate-50 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {att.file_name}
                      </p>
                      <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Attached
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(i)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition shrink-0"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition disabled:opacity-50 cursor-pointer"
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}

export default function CreateRequestPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-6 w-32 bg-slate-100 rounded-md" />
        <div className="h-40 bg-slate-100 rounded-xl" />
      </div>
    }>
      <CreateRequestContent />
    </Suspense>
  );
}
