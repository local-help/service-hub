'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, ArrowRight, ArrowLeft, Car, AlertTriangle, Moon } from 'lucide-react';
import { Service, ServiceVariant } from '../../../types';
import { apiRequest } from '../../../api/client';
import { CustomerSupportButtons } from '../../../components/ui/SupportButtons';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  // User selections
  const [selectedVehicle, setSelectedVehicle] = useState<string>('hatchback');
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [pickupDrop, setPickupDrop] = useState(false);

  // Time-based driver controls
  const [driverHours, setDriverHours] = useState<number>(8);
  const [extendsPastNight, setExtendsPastNight] = useState<boolean>(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiRequest<Service>(`/services/${id}`)
      .then((data) => {
        setService(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariantId(data.variants[0].id);
        }
        if (data.supported_vehicle_types && data.supported_vehicle_types.length > 0) {
          setSelectedVehicle(data.supported_vehicle_types[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Dynamic tariff calculation for time-based services
  useEffect(() => {
    if (!service || service.booking_type !== 'time_based') return;
    setCalcLoading(true);
    const nightHrs = extendsPastNight ? Math.max(driverHours - 8, 2) : 0;

    apiRequest<any>(`/services/${id}/calculate_price`, {
      method: 'POST',
      body: JSON.stringify({
        variant_id: selectedVariantId,
        hours: driverHours,
        extends_past_night: extendsPastNight,
        night_hours: nightHrs
      })
    })
      .then((res) => {
        setCalculatedPrice(res.total_price);
      })
      .catch(console.error)
      .finally(() => setCalcLoading(false));
  }, [id, service, selectedVariantId, driverHours, extendsPastNight]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-100 rounded-md" />
        <div className="h-40 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-lg font-semibold text-slate-900">Service not found</h2>
        <Link href="/" className="inline-block mt-3 text-sm text-slate-600 hover:text-slate-900 underline">
          Browse services
        </Link>
      </div>
    );
  }

  const isComingSoon = service.coming_soon || service.category?.coming_soon;
  const bType = service.booking_type || service.pricing_type;
  const hasVariants = service.variants && service.variants.length > 0;

  const matchingVariants = hasVariants
    ? service.variants!.filter((v) => {
        const vTypes = (v.variant_attributes || {})['vehicle_types'];
        if (!vTypes || vTypes.length === 0) return true;
        if (selectedVehicle === 'hatchback' || selectedVehicle === 'sedan') {
          return vTypes.includes('hatchback') || vTypes.includes('sedan');
        }
        return vTypes.includes(selectedVehicle);
      })
    : [];

  const displayVariants = matchingVariants.length > 0 ? matchingVariants : (service.variants || []);
  const selectedVariant = service.variants?.find((v) => v.id === selectedVariantId);

  const handleProceed = () => {
    const query = new URLSearchParams();
    if (selectedVariantId) query.set('variant_id', selectedVariantId.toString());
    if (selectedVehicle) query.set('vehicle_type', selectedVehicle);
    if (pickupDrop) query.set('pickup_drop', 'true');
    if (bType === 'time_based') query.set('duration_hours', driverHours.toString());

    router.push(`/services/${service.id}/request?${query.toString()}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
          <Link href="/" className="hover:text-slate-700 transition">Catalogue</Link>
          <span>/</span>
          {service.category && (
            <>
              <Link href={`/categories/${service.category.id}`} className="hover:text-slate-700 transition">
                {service.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-slate-600">{service.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {service.name}
              </h1>
              {isComingSoon && (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Coming Soon
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
              {service.description || service.short_description}
            </p>
          </div>

          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 self-start sm:self-center">
            {isComingSoon ? 'Coming Soon' : bType === 'time_based' ? 'Time Based' : 'Fixed Price'}
          </span>
        </div>
      </div>

      {/* Coming Soon Notice */}
      {isComingSoon && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-0.5">
            <p className="font-medium">Launching Soon in Prayagraj</p>
            <p className="text-amber-700">We are onboarding verified providers. Bookings will open shortly.</p>
          </div>
        </div>
      )}

      {/* Vehicle Type Selector */}
      {!isComingSoon && service.supported_vehicle_types && service.supported_vehicle_types.length > 0 && (
        <div className="p-5 border border-slate-200 rounded-xl space-y-2.5">
          <label className="text-xs font-medium text-slate-500 block flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5" />
            <span>Select Vehicle Type</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {service.supported_vehicle_types.map((vt) => (
              <button
                key={vt}
                onClick={() => setSelectedVehicle(vt)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition text-center cursor-pointer ${
                  selectedVehicle === vt
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {vt === 'suv_muv'
                  ? 'SUV / MUV'
                  : vt === 'bike_scooter'
                  ? 'Bike / Scooter'
                  : vt.charAt(0).toUpperCase() + vt.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Service Packages & Variants Selector */}
      {!isComingSoon && displayVariants.length > 0 && (
        <div className="p-5 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Select Package
            </h3>
            <span className="text-xs text-slate-400">
              {displayVariants.length} option{displayVariants.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            {displayVariants.map((variant) => {
              const isSelected = selectedVariantId === variant.id;
              const price = variant.primary_price;

              return (
                <div
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-teal-700 bg-teal-700' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{variant.name}</span>
                    </div>
                    {variant.description && (
                      <p className="text-xs text-slate-500 pl-5.5 leading-relaxed">
                        {variant.description}
                      </p>
                    )}
                  </div>

                  {price && (
                    <span className="text-sm font-semibold text-slate-900 shrink-0">
                      ₹{price}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Optional Pickup & Drop */}
          {service.slug === 'car-wash' && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pickupDrop}
                  onChange={(e) => setPickupDrop(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>Include Doorstep Pickup & Return Delivery</span>
              </label>
              <span className="text-xs text-slate-400">On request</span>
            </div>
          )}
        </div>
      )}

      {/* Time Based Controls */}
      {!isComingSoon && bType === 'time_based' && (
        <div className="p-5 border border-slate-200 rounded-xl space-y-4">
          <div>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Shift Duration
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[4, 8, 10, 12].map((hrs) => (
                <button
                  key={hrs}
                  onClick={() => setDriverHours(hrs)}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition text-center cursor-pointer ${
                    driverHours === hrs
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {hrs} Hours
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-700">
                  Duty Extends Past 10:00 PM (Late Night Return)
                </span>
              </div>
              <input
                type="checkbox"
                checked={extendsPastNight}
                onChange={(e) => setExtendsPastNight(e.target.checked)}
                className="rounded border-slate-300 text-slate-900"
              />
            </label>
            <p className="text-[11px] text-slate-400">
              ₹800 for 8 hrs base. Late night includes fixed night allowance.
            </p>
          </div>
        </div>
      )}

      {/* Summary Box & Proceed CTA */}
      <div className="p-5 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 block">Total Price</span>
          {isComingSoon ? (
            <span className="text-sm font-medium text-slate-400">Not bookable</span>
          ) : bType === 'time_based' ? (
            <span className="text-xl font-semibold text-slate-900">
              ₹{calculatedPrice || 800}
            </span>
          ) : (
            <span className="text-xl font-semibold text-slate-900">
              ₹{selectedVariant?.primary_price || service.fixed_price || 299}
            </span>
          )}
        </div>

        {isComingSoon ? (
          <button
            disabled
            className="px-5 py-2.5 bg-slate-100 text-slate-400 text-xs font-medium rounded-lg cursor-not-allowed"
          >
            Coming Soon
          </button>
        ) : (
          <button
            onClick={handleProceed}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition cursor-pointer shadow-xs"
          >
            <span>Proceed to Booking</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <CustomerSupportButtons variant="banner" />
    </div>
  );
}
