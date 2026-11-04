'use client';

import React, { useEffect, useState } from 'react';
import { 
  Layers, 
  Check, 
  X, 
  DollarSign, 
  AlertCircle, 
  Save, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apiRequest } from '../../../api/client';
import { ProviderServiceItem } from '../../../types';

export default function ProviderServicesPage() {
  const [services, setServices] = useState<ProviderServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pricingDrafts, setPricingDrafts] = useState<Record<number, Record<string, string>>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<ProviderServiceItem[]>('/provider/services');
      setServices(res);
      setError(null);
    } catch (err: any) {
      setError(err.error || 'Failed to load services catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleToggleActive = async (service: ProviderServiceItem) => {
    try {
      setSavingId(service.id);
      await apiRequest(`/provider/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !service.active }),
      });
      await fetchServices();
    } catch (err: any) {
      alert(err.error || 'Failed to update service status');
    } finally {
      setSavingId(null);
    }
  };

  const handleCustomPriceChange = (serviceId: number, variantId: number, val: string) => {
    setPricingDrafts((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || {}),
        [variantId.toString()]: val,
      },
    }));
  };

  const handleSavePricing = async (service: ProviderServiceItem) => {
    const draft = pricingDrafts[service.id];
    if (!draft) {
      setEditingId(null);
      return;
    }

    const payload: Record<string, number> = {};
    Object.entries(draft).forEach(([k, v]) => {
      const num = parseFloat(v);
      if (!isNaN(num) && num > 0) {
        payload[k] = num;
      }
    });

    try {
      setSavingId(service.id);
      await apiRequest(`/provider/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          provider_specific_pricing: {
            ...(service.provider_specific_pricing || {}),
            ...payload,
          },
        }),
      });
      setEditingId(null);
      await fetchServices();
    } catch (err: any) {
      alert(err.error || 'Failed to update custom pricing');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded"></div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#242D2B]">My Services & Custom Pricing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View services you are authorised to fulfill and set your organisation-specific rates
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-5 h-5" />
            <span>Could not load services</span>
          </div>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-semibold text-slate-700">No Services Assigned</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Your provider account has not been configured with catalogue services yet. Please contact Super Admin.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.category_name}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500 uppercase">
                        {item.pricing_type.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#242D2B] mt-1">
                      {item.service_name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleActive(item)}
                      disabled={savingId === item.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        item.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.active ? 'Active & Accepting' : 'Paused / Inactive'}
                    </button>

                    {item.variants && item.variants.length > 0 && (
                      <button
                        onClick={() => setEditingId(isEditing ? null : item.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Close Pricing' : 'Custom Pricing'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Base price row */}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Catalogue Base Price:</span>
                  <strong className="text-slate-800 text-sm">
                    {item.base_price ? `₹${item.base_price}` : 'Quotation Required'}
                  </strong>
                </div>

                {/* Variants & Custom Pricing Drawer */}
                {item.variants && item.variants.length > 0 && isEditing && (
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Package & Vehicle Type Pricing Overrides
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Leave blank to use standard platform price
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {item.variants.map((v) => {
                        const customVal =
                          pricingDrafts[item.id]?.[v.id.toString()] ??
                          item.provider_specific_pricing?.[v.id.toString()] ??
                          '';

                        return (
                          <div
                            key={v.id}
                            className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs"
                          >
                            <span className="font-semibold text-xs text-slate-800 block truncate">
                              {v.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              Platform: {v.price ? `₹${v.price}` : 'Quote'}
                            </span>
                            <div className="pt-1 flex items-center gap-1.5">
                              <span className="text-xs text-slate-500">₹</span>
                              <input
                                type="number"
                                placeholder={v.price ? v.price.toString() : 'Quote'}
                                value={customVal}
                                onChange={(e) =>
                                  handleCustomPriceChange(item.id, v.id, e.target.value)
                                }
                                className="w-full text-xs p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#176B65]"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleSavePricing(item)}
                        disabled={savingId === item.id}
                        className="px-4 py-2 bg-[#176B65] text-white rounded-xl text-xs font-semibold hover:bg-[#12534E] transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingId === item.id ? 'Saving...' : 'Save Custom Pricing'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
