'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
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
  ShieldCheck,
  Check,
  Info,
  ImageIcon
} from 'lucide-react';
import { Service, Address, ServiceRequest, ServiceVariant } from '../../../../types';
import { apiRequest } from '../../../../api/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { GpsButton } from '../../../../components/ui/GpsButton';
import { LocationData } from '../../../../contexts/LocationContext';

function CreateRequestContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const router = useRouter();

  // Query params from Dynamic Service Builder
  const packageNameParam = searchParams.get('package_name');
  const packagePriceParam = parseFloat(searchParams.get('package_price') || '0');
  const stepKeyParam = searchParams.get('step_key') || searchParams.get('vehicle_type') || '';
  const addonsParam = searchParams.get('addons') || '';
  const addonsTotalParam = parseFloat(searchParams.get('addons_total') || '0');
  const totalAmountParam = parseFloat(searchParams.get('total_amount') || '0');
  const variantIdParam = searchParams.get('variant_id');

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

  const handleLocationDetected = (loc: LocationData) => {
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
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [preferredTime, setPreferredTime] = useState('11:00');
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
  }, [id, user, variantIdParam, router]);

  // Derived financial computations
  const effectivePackageName = packageNameParam || selectedVariant?.name || service?.name || 'Service Package';
  const effectivePackagePrice = packagePriceParam || selectedVariant?.primary_price || service?.fixed_price || 499;
  const platformFee = service?.builder_config?.platform_fee || 25.0;
  const effectiveTotal = totalAmountParam || (effectivePackagePrice + addonsTotalParam + platformFee);

  const selectedAddonsList = useMemo(() => {
    if (!addonsParam || !service?.addons) return [];
    const ids = addonsParam.split(',').filter(Boolean);
    return service.addons.filter((a) => ids.includes(a.id));
  }, [addonsParam, service]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      return;
    }

    setUploadingFile(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('localhelp_token');
      const res = await fetch('/api/v1/uploads', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload photo');
      }

      const uploadedData = await res.json();
      setAttachments((prev) => [
        ...prev,
        {
          file_url: uploadedData.file_url,
          file_name: uploadedData.file_name || file.name,
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo from device');
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

    setSubmitting(true);
    setError(null);

    try {
      const preferredAt = preferredDate
        ? new Date(`${preferredDate}T${preferredTime}:00`).toISOString()
        : new Date(Date.now() + 86400000).toISOString();

      const finalDescription = description.trim() || 
        `${effectivePackageName} (${stepKeyParam || 'Standard'}) booking for ${user?.name || 'Customer'}`;

      const response = await apiRequest<ServiceRequest>('/service_requests', {
        method: 'POST',
        body: JSON.stringify({
          service_id: service?.id,
          service_variant_id: variantIdParam ? parseInt(variantIdParam) : null,
          vehicle_type: stepKeyParam || null,
          total_amount: effectiveTotal,
          selected_options: {
            package_name: effectivePackageName,
            step_key: stepKeyParam,
            addons: selectedAddonsList.map((a) => a.name),
            total_amount: effectiveTotal
          },
          address_id: selectedAddressId,
          description: finalDescription,
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
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your request has been received. Our operations team is assigning a verified technician in your area.
          </p>
        </div>

        {/* Reference Code Card */}
        <div className="p-6 border border-slate-200 rounded-2xl space-y-3 text-center bg-white shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Booking Reference Number
          </span>
          <p className="text-3xl font-mono font-black text-slate-900 tracking-wider">
            {createdRequest.reference_number}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Guaranteed Total:</span>
            <span className="font-bold text-slate-900 text-sm">₹{effectiveTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs font-semibold pt-2">
          <Link
            href={`/bookings/${createdRequest.booking?.id || createdRequest.id}`}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition shadow-xs"
          >
            Manage Booking
          </Link>
          <Link
            href="/bookings"
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition"
          >
            View All Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          href={`/services/${service?.slug || id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to package builder</span>
        </Link>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Review & Schedule Booking
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Standard doorstep dispatch with guaranteed fixed pricing
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Review Summary Card (Zero Quotation Language) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Order Summary</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Fixed Tariff Guarantee
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 text-sm block">{effectivePackageName}</span>
              {stepKeyParam && (
                <span className="text-[11px] text-slate-400 capitalize">
                  Vehicle Type: {stepKeyParam.replace('_', ' ')}
                </span>
              )}
            </div>
            <span className="font-bold text-slate-900 text-sm">
              ₹{effectivePackagePrice.toLocaleString('en-IN')}
            </span>
          </div>

          {selectedAddonsList.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">Selected Add-ons:</span>
              {selectedAddonsList.map((addon) => (
                <div key={addon.id} className="flex items-center justify-between text-slate-600">
                  <span>+ {addon.name}</span>
                  <span className="font-semibold text-slate-900">₹{addon.price}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
            <span className="flex items-center gap-1">
              <span>Platform Fee</span>
              <Info className="w-3 h-3 text-slate-400" />
            </span>
            <span className="font-semibold text-slate-900">₹{platformFee}</span>
          </div>

          <div className="pt-3 border-t-2 border-slate-900 flex items-baseline justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">Estimated Total</span>
            <span className="text-2xl font-black text-slate-900">
              ₹{effectiveTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 2: Address Selection */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-700" />
              <span>Doorstep Address</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowNewAddress(!showNewAddress)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              {showNewAddress ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{showNewAddress ? 'Cancel' : 'Add new address'}</span>
            </button>
          </div>

          {/* New Address Sub-form */}
          {showNewAddress ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800">Add Doorstep Address</span>
                <GpsButton onLocationDetected={handleLocationDetected} label="Current Location" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Label (e.g. Home, Office)"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 outline-none"
                />
                <input
                  type="text"
                  placeholder="PIN Code (e.g. 211001)"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 outline-none"
                />
                <input
                  type="text"
                  placeholder="Flat / Street Address *"
                  required
                  value={newAddress.address_line}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 outline-none sm:col-span-2"
                />
                <input
                  type="text"
                  placeholder="Landmark (Optional)"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 outline-none sm:col-span-2"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateAddress}
                className="px-4 py-2 bg-teal-700 text-white text-xs font-bold rounded-lg hover:bg-teal-800 transition cursor-pointer shadow-xs"
              >
                Save & Select
              </button>
            </div>
          ) : addresses.length === 0 ? (
            <p className="text-xs text-slate-400">No saved addresses. Please add your address above.</p>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-teal-50/50 border-teal-600 ring-2 ring-teal-600/10'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-teal-700 bg-teal-700' : 'border-slate-300'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{addr.label || 'Address'}</span>
                        {addr.is_default && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{addr.full_address || addr.address_line}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 3: Preferred Schedule */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-700" />
            <span>Select Preferred Date & Time Slot</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Date</label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none bg-white text-slate-900 focus:border-teal-600 transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Arrival Slot</label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none bg-white text-slate-900 focus:border-teal-600 transition cursor-pointer"
              >
                <option value="09:00">Morning (09:00 AM – 11:00 AM)</option>
                <option value="11:00">Noon (11:00 AM – 01:00 PM)</option>
                <option value="14:00">Afternoon (02:00 PM – 04:00 PM)</option>
                <option value="16:00">Evening (04:00 PM – 06:00 PM)</option>
                <option value="18:00">Late Evening (06:00 PM – 08:00 PM)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 4: Special Instructions / Notes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
          <label className="text-xs font-bold text-slate-900 block">
            Special Instructions / Gate Landmark (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Please bring extra extension cord; call upon reaching Tower B..."
            className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none bg-white text-slate-900 focus:border-teal-600 transition"
          />
        </div>

        {/* Step 5: Attach Photos (Optional) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-teal-700" />
              <span>Attach Photos (Optional)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Helps specialist prepare</span>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              id="device-photo-upload"
              onChange={handleFileUpload}
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
                  <div className="w-8 h-8 rounded-full bg-white border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Upload photo from device
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Take a photo or choose from library (JPG, PNG, WebP)
                    </span>
                  </div>
                </>
              )}
            </label>

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

        {/* Submit Booking */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-black text-sm rounded-xl transition disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2"
        >
          {submitting ? 'Confirming Booking…' : `Confirm & Book • ₹${effectiveTotal.toLocaleString('en-IN')}`}
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
