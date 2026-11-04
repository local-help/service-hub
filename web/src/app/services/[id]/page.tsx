'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, CheckCircle, ArrowRight, ArrowLeft, Car, Shield, AlertTriangle, Moon, Sparkles } from 'lucide-react';
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
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-48 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-slate-900">Service Not Found</h2>
        <Link href="/" className="inline-block mt-4 text-sm text-[#176B65] font-semibold hover:underline">
          Browse services
        </Link>
      </div>
    );
  }

  const isComingSoon = service.coming_soon || service.category?.coming_soon;
  const bType = service.booking_type || service.pricing_type;
  const hasVariants = service.variants && service.variants.length > 0;

  // Filter variants matching selected vehicle type if variant has vehicle_types attribute
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4">
          <Link href="/" className="hover:text-slate-800 transition">Catalogue</Link>
          <span>/</span>
          {service.category && (
            <>
              <Link href={`/categories/${service.category.id}`} className="hover:text-slate-800 transition">
                {service.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          {service.subcategory && (
            <span className="text-slate-700">{service.subcategory.name}</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#242D2B] tracking-tight">
                {service.name}
              </h1>
              {isComingSoon && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Coming Soon
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
              {service.description || service.short_description}
            </p>
          </div>

          <div className="shrink-0">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider block text-center ${
              isComingSoon
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : bType === 'fixed_price'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : bType === 'time_based'
                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
            }`}>
              {isComingSoon
                ? 'Coming Soon'
                : bType === 'fixed_price'
                ? 'Fixed Price'
                : bType === 'time_based'
                ? 'Time Based'
                : 'Request a Quote'}
            </span>
          </div>
        </div>
      </div>

      {/* Coming Soon Notice */}
      {isComingSoon && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold text-sm">Service Launching Soon in Prayagraj</p>
            <p>
              We are actively onboarding and verifying licensed service providers for this category. Bookings will open shortly.
            </p>
          </div>
        </div>
      )}

      {/* Vehicle Type Selector (If supported) */}
      {!isComingSoon && service.supported_vehicle_types && service.supported_vehicle_types.length > 0 && (
        <div className="p-6 bg-white border border-[#E7E2D8] rounded-3xl space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Car className="w-4 h-4 text-[#176B65]" />
            <span>Select Vehicle Category</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {service.supported_vehicle_types.map((vt) => (
              <button
                key={vt}
                onClick={() => setSelectedVehicle(vt)}
                className={`p-3 rounded-2xl border text-xs font-bold transition text-center ${
                  selectedVehicle === vt
                    ? 'bg-[#176B65] text-white border-[#176B65] shadow-xs'
                    : 'bg-[#F7F5EF] text-slate-700 border-[#E7E2D8] hover:bg-white'
                }`}
              >
                {vt === 'suv_muv'
                  ? 'SUV / Big Car'
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
        <div className="p-6 bg-white border border-[#E7E2D8] rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#242D2B] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#25877C]" />
              <span>Choose Service Package / Option</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {displayVariants.length} option{displayVariants.length > 1 ? 's' : ''} available
            </span>
          </div>

          <div className="space-y-2.5">
            {displayVariants.map((variant) => {
              const isSelected = selectedVariantId === variant.id;
              const price = variant.primary_price;

              return (
                <div
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-[#176B65] bg-[#F7F5EF] shadow-xs'
                      : 'border-[#E7E2D8] bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#176B65] bg-[#176B65]' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-bold text-[#242D2B]">{variant.name}</span>
                    </div>
                    {variant.description && (
                      <p className="text-xs text-slate-500 pl-6 leading-relaxed">
                        {variant.description}
                      </p>
                    )}
                  </div>

                  {price && (
                    <div className="text-right shrink-0 pl-2">
                      <span className="text-sm font-black text-[#176B65]">₹{price}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">inclusive</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pickup and Drop Add-on for Car Wash */}
          {service.slug === 'car-wash' && (
            <div className="pt-4 border-t border-[#E7E2D8] flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pickupDrop}
                  onChange={(e) => setPickupDrop(e.target.checked)}
                  className="rounded text-[#176B65] focus:ring-[#176B65]"
                />
                <span>Include Pickup & Drop (Doorstep pickup and return delivery on request)</span>
              </label>
              <span className="text-xs font-bold text-slate-500">On Request</span>
            </div>
          )}
        </div>
      )}

      {/* Time Based Calculator for Driver Services */}
      {!isComingSoon && bType === 'time_based' && (
        <div className="p-6 bg-white border border-[#E7E2D8] rounded-3xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#242D2B] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#176B65]" />
              <span>Shift Duration & Schedule</span>
            </h3>
            <span className="text-xs font-bold text-[#176B65]">Time-Based Pricing</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[4, 8, 10, 12].map((hrs) => (
              <button
                key={hrs}
                onClick={() => setDriverHours(hrs)}
                className={`py-3 rounded-2xl border text-xs font-bold transition text-center ${
                  driverHours === hrs
                    ? 'bg-[#176B65] text-white border-[#176B65]'
                    : 'bg-[#F7F5EF] text-slate-700 border-[#E7E2D8] hover:bg-white'
                }`}
              >
                {hrs} Hours Shift
              </button>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F5EF] border border-[#E7E2D8] space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-700">
                  Duty Extends Past 10:00 PM (Late Night Return)
                </span>
              </div>
              <input
                type="checkbox"
                checked={extendsPastNight}
                onChange={(e) => setExtendsPastNight(e.target.checked)}
                className="rounded text-[#176B65] focus:ring-[#176B65]"
              />
            </label>
            <p className="text-[11px] text-slate-500">
              Standard shift: ₹800 for 8 hrs. ₹50/hr extra up to 10 PM. After 10 PM: ₹100/hr + ₹300 fixed night allowance.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 block">Calculated Driver Tariff</span>
              <span className="text-[11px] text-emerald-600">
                {driverHours} hrs {extendsPastNight ? '• with night allowance' : '• daytime'}
              </span>
            </div>
            <span className="text-xl font-black text-emerald-900">
              {calcLoading ? '...' : calculatedPrice ? `₹${calculatedPrice}` : '₹800'}
            </span>
          </div>
        </div>
      )}

      {/* Summary & Checkout Action Box */}
      <div className="p-6 bg-white border border-[#E7E2D8] rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Estimated Cost</span>
          {isComingSoon ? (
            <span className="text-lg font-bold text-slate-400">Not Bookable Yet</span>
          ) : bType === 'time_based' ? (
            <span className="text-2xl font-black text-[#176B65]">
              ₹{calculatedPrice || 800}
            </span>
          ) : bType === 'fixed_price' ? (
            <span className="text-2xl font-black text-[#242D2B]">
              ₹{selectedVariant?.primary_price || service.fixed_price || 299}
            </span>
          ) : (
            <div>
              <span className="text-lg font-bold text-indigo-700">Free Quotation</span>
              <span className="text-[11px] text-slate-500 block">Admin coordinates with provider</span>
            </div>
          )}
        </div>

        {isComingSoon ? (
          <button
            disabled
            className="px-6 py-3 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed border border-slate-200"
          >
            Service Coming Soon
          </button>
        ) : (
          <button
            onClick={handleProceed}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#176B65] hover:bg-[#135752] text-white font-bold text-sm rounded-xl transition shadow-sm cursor-pointer"
          >
            <span>
              {bType === 'fixed_price'
                ? 'Proceed to Booking'
                : bType === 'time_based'
                ? 'Book Driver Shift'
                : 'Request Free Quotation'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <CustomerSupportButtons variant="banner" />
    </div>
  );
}
