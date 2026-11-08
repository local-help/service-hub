'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Car, 
  Truck, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Plus, 
  Wrench, 
  Wind, 
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Service, ServiceVariant, BuilderPackage, ServiceAddon } from '../../../types';
import { apiRequest } from '../../../api/client';

export default function DynamicServiceBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Builder States
  const [stepSelections, setStepSelections] = useState<Record<string, string>>({
    vehicle_type: 'hatchback',
    home_size: '2bhk',
    ac_type: 'split'
  });
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiRequest<Service>(`/services/${id}`)
      .then((data) => {
        setService(data);

        // Initialize default step values from builder_config
        const initialSteps: Record<string, string> = {};
        if (data.builder_config?.steps) {
          data.builder_config.steps.forEach((st) => {
            initialSteps[st.id] = st.default_value || st.options[0]?.id || '';
          });
        }
        setStepSelections((prev) => ({ ...prev, ...initialSteps }));

        // Initialize default package
        if (data.builder_config?.packages && data.builder_config.packages.length > 0) {
          setSelectedPackageId(data.builder_config.packages[0].id);
        } else if (data.variants && data.variants.length > 0) {
          setSelectedPackageId(data.variants[0].id.toString());
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Active step key (e.g. "hatchback", "suv_muv", "2bhk", "split")
  const primaryStepKey = useMemo(() => {
    if (stepSelections['vehicle_type']) return stepSelections['vehicle_type'];
    if (stepSelections['home_size']) return stepSelections['home_size'];
    if (stepSelections['ac_type']) return stepSelections['ac_type'];
    return Object.values(stepSelections)[0] || 'default';
  }, [stepSelections]);

  // Packages list: either from builder_config.packages or synthesized from service.variants
  const packagesList = useMemo(() => {
    if (service?.builder_config?.packages && service.builder_config.packages.length > 0) {
      return service.builder_config.packages;
    }

    // Fallback synthesis from variants
    if (service?.variants && service.variants.length > 0) {
      return service.variants.map((v) => ({
        id: v.id.toString(),
        name: v.name,
        short_description: v.description,
        badge: undefined,
        prices: {
          [primaryStepKey]: v.primary_price || service.fixed_price || 499
        }
      }));
    }

    // Single fixed price fallback package
    if (service) {
      return [{
        id: 'standard',
        name: service.name,
        short_description: service.short_description || service.description,
        prices: {
          [primaryStepKey]: service.fixed_price || 399
        }
      }];
    }

    return [];
  }, [service, primaryStepKey]);

  // Selected package object
  const activePackage = useMemo(() => {
    return packagesList.find((p) => p.id === selectedPackageId) || packagesList[0];
  }, [packagesList, selectedPackageId]);

  // Base Package Price for active vehicle/step selection
  const packagePrice = useMemo(() => {
    if (!activePackage) return service?.fixed_price || 0;
    const priceMap = activePackage.prices || {};
    return priceMap[primaryStepKey] || priceMap['default'] || Object.values(priceMap)[0] || service?.fixed_price || 0;
  }, [activePackage, primaryStepKey, service]);

  // Addons list
  const addonsList: ServiceAddon[] = useMemo(() => {
    return service?.addons || [];
  }, [service]);

  // Addons subtotal
  const addonsSubtotal = useMemo(() => {
    return selectedAddonIds.reduce((sum, addId) => {
      const addon = addonsList.find((a) => a.id === addId);
      return sum + (addon ? addon.price : 0);
    }, 0);
  }, [selectedAddonIds, addonsList]);

  // Platform fee (default ₹25)
  const platformFee = service?.builder_config?.platform_fee || 25.0;

  // Final Guaranteed Total
  const totalGuaranteedAmount = packagePrice + addonsSubtotal + platformFee;

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) => 
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleProceedToBooking = () => {
    if (!service) return;

    const query = new URLSearchParams();
    query.set('package_id', selectedPackageId || activePackage?.id || '');
    query.set('package_name', activePackage?.name || service.name);
    query.set('package_price', packagePrice.toString());
    query.set('step_key', primaryStepKey);
    query.set('total_amount', totalGuaranteedAmount.toString());

    if (selectedAddonIds.length > 0) {
      query.set('addons', selectedAddonIds.join(','));
      query.set('addons_total', addonsSubtotal.toString());
    }

    // Match variant ID if matching
    const matchingVariant = service.variants?.find((v) => {
      const vTypes = (v.variant_attributes || {})['vehicle_types'] || [];
      const pType = (v.variant_attributes || {})['package_type'];
      return (vTypes.includes(primaryStepKey) || vTypes.length === 0) && (pType === selectedPackageId || v.name.toLowerCase().includes(activePackage?.name.toLowerCase() || ''));
    }) || service.variants?.[0];

    if (matchingVariant) {
      query.set('variant_id', matchingVariant.id.toString());
    }

    router.push(`/services/${service.slug || service.id}/request?${query.toString()}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-6 w-36 bg-slate-200 rounded-md" />
        <div className="h-28 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="h-32 bg-slate-200 rounded-xl" />
            <div className="h-48 bg-slate-200 rounded-xl" />
          </div>
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-lg font-bold text-slate-900">Service not found</h2>
        <Link href="/" className="inline-block mt-3 text-sm text-teal-700 hover:underline">
          Return to home catalogue
        </Link>
      </div>
    );
  }

  const isComingSoon = service.coming_soon || service.category?.coming_soon;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-28 lg:pb-16">
      {/* Top Breadcrumb & Header */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to services</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                  {service.category?.name || 'Local Service'}
                </span>
                {service.estimated_duration_minutes && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{service.estimated_duration_minutes} mins</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
                {service.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                {service.description || service.short_description}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/90 px-3.5 py-2 rounded-xl text-emerald-800 text-xs font-semibold self-start sm:self-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Guaranteed Fixed Price</span>
            </div>
          </div>
        </div>
      </div>

      {isComingSoon ? (
        <div className="max-w-xl mx-auto my-12 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
          <h2 className="text-base font-bold text-amber-900">Launching Soon in Prayagraj</h2>
          <p className="text-xs text-amber-700">
            We are actively vetting specialists for {service.name}. Bookings will open shortly!
          </p>
          <Link
            href="/"
            className="inline-block text-xs font-semibold px-4 py-2 bg-slate-900 text-white rounded-lg"
          >
            Explore Other Services
          </Link>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Dynamic Builder Controls */}
            <div className="lg:col-span-2 space-y-6">

              {/* STEP 1: Configuration Questions (e.g. Select Vehicle Type / Home Size) */}
              {service.builder_config?.steps && service.builder_config.steps.length > 0 && (
                service.builder_config.steps.map((step) => (
                  <div key={step.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                        <span>{step.title}</span>
                      </h2>
                      {step.subtitle && (
                        <p className="text-xs text-slate-400 mt-0.5 ml-7">{step.subtitle}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {step.options.map((opt) => {
                        const isSelected = stepSelections[step.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setStepSelections((prev) => ({ ...prev, [step.id]: opt.id }))}
                            className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50/60 border-teal-600 ring-2 ring-teal-600/10'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {opt.id.includes('suv') ? <Truck className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${isSelected ? 'text-teal-900' : 'text-slate-900'}`}>
                                  {opt.label}
                                </span>
                                {isSelected && (
                                  <span className="w-4 h-4 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px]">
                                    <Check className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                              {opt.subtext && (
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{opt.subtext}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {/* STEP 2: Package Selection (Dynamic prices update based on Step 1) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                    <span>Select Service Package</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 ml-7">
                    Tailored fixed rates for {primaryStepKey === 'suv_muv' ? 'SUV / Big Car' : 'Hatchback / Sedan'}
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {packagesList.map((pkg) => {
                    const isSelected = selectedPackageId === pkg.id;
                    const priceMap = pkg.prices || {};
                    const currentPrice = priceMap[primaryStepKey] || priceMap['default'] || Object.values(priceMap)[0] || 0;

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-teal-50/50 border-teal-600 ring-2 ring-teal-600/10'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isSelected ? 'text-teal-900' : 'text-slate-900'}`}>
                              {pkg.name}
                            </span>
                            {pkg.badge && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                {pkg.badge}
                              </span>
                            )}
                          </div>
                          {pkg.short_description && (
                            <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                              {pkg.short_description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Fixed Price</span>
                            <span className="text-base font-black text-slate-900">
                              ₹{currentPrice.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              isSelected
                                ? 'bg-teal-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <span>Select</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: Optional Value Add-ons */}
              {addonsList.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center font-bold">3</span>
                      <span>Optional Service Add-ons</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5 ml-7">
                      Enhance your service with certified extra treatments
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {addonsList.map((addon) => {
                      const isChecked = selectedAddonIds.includes(addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => toggleAddon(addon.id)}
                          className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                            isChecked
                              ? 'bg-teal-50/50 border-teal-600 ring-2 ring-teal-600/10'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition shrink-0 ${
                            isChecked ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {addon.name}
                              </span>
                              <span className="text-xs font-black text-slate-900 shrink-0">
                                +₹{addon.price}
                              </span>
                            </div>
                            {addon.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                {addon.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Live Order Summary Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Booking Summary
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Review selected configuration and total
                  </p>
                </div>

                {/* Configuration Breakdown */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Service</span>
                      <span className="font-bold text-slate-900">{service.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {primaryStepKey === 'suv_muv' ? 'SUV / Big Car' : 'Hatchback'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between border-t border-slate-100 pt-2.5">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Package</span>
                      <span className="font-semibold text-slate-900">{activePackage?.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      ₹{packagePrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {selectedAddonIds.length > 0 && (
                    <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                      <span className="text-slate-400 block text-[11px] font-semibold">Selected Add-ons</span>
                      {selectedAddonIds.map((aId) => {
                        const addon = addonsList.find((a) => a.id === aId);
                        if (!addon) return null;
                        return (
                          <div key={aId} className="flex items-center justify-between text-slate-600">
                            <span className="truncate pr-2">{addon.name}</span>
                            <span className="font-semibold text-slate-900">+₹{addon.price}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Financials Subtotal */}
                  <div className="border-t border-slate-100 pt-2.5 space-y-1.5 text-slate-500">
                    <div className="flex justify-between">
                      <span>Services Subtotal</span>
                      <span className="font-semibold text-slate-900">₹{(packagePrice + addonsSubtotal).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="flex items-center gap-1">
                        <span>Platform Fee</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </span>
                      <span className="font-semibold text-slate-900">₹{platformFee}</span>
                    </div>
                  </div>

                  {/* Guaranteed Total */}
                  <div className="border-t-2 border-slate-900 pt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">Estimated Total</span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Fixed Price Guarantee</span>
                      </span>
                    </div>
                    <span className="text-2xl font-black text-slate-900">
                      ₹{totalGuaranteedAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Trust Badge */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 text-[11px] text-slate-500 leading-relaxed space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    <span>LocalHelp Quality Promise</span>
                  </div>
                  <p>
                    Verified local technician. Standard platform rates with no surprise charges. Pay securely online or post-service via Cash/UPI.
                  </p>
                </div>

                {/* Proceed Button */}
                <button
                  type="button"
                  onClick={handleProceedToBooking}
                  className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Schedule & Address</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Action Bar */}
      {!isComingSoon && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3.5 px-4 shadow-lg flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">Fixed</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">
                ₹{totalGuaranteedAmount.toLocaleString('en-IN')}
              </span>
              {activePackage?.name && (
                <span className="text-xs text-slate-500 truncate max-w-[130px]">
                  • {activePackage.name}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleProceedToBooking}
            className="py-2.5 px-5 bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
