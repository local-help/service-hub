'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, ArrowRight, ArrowLeft, Car, Wrench, ShieldAlert } from 'lucide-react';
import { Category, Subcategory, Service } from '../../../types';
import { apiRequest } from '../../../api/client';
import { CustomerSupportButtons } from '../../../components/ui/SupportButtons';

export default function CategoryPage() {
  const params = useParams();
  const id = params?.id as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcat, setSelectedSubcat] = useState<number | 'all'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'fixed_price' | 'quotation' | 'time_based'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiRequest<Category>(`/categories/${id}`)
      .then((data) => {
        setCategory(data);
        setSubcategories(data.subcategories || []);
        setServices(data.active_services || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const hasVehicleFilter = services.some(
    (s) => s.supported_vehicle_types && s.supported_vehicle_types.length > 0
  );

  const filtered = services.filter((s) => {
    // Subcategory filter
    if (selectedSubcat !== 'all' && s.subcategory_id !== selectedSubcat) {
      return false;
    }
    // Booking model filter
    if (filterType !== 'all') {
      const bType = s.booking_type || s.pricing_type;
      if (bType !== filterType) return false;
    }
    // Vehicle type filter
    if (selectedVehicle !== 'all') {
      if (
        s.supported_vehicle_types &&
        s.supported_vehicle_types.length > 0 &&
        !s.supported_vehicle_types.includes(selectedVehicle)
      ) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-24 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => <div key={n} className="h-48 bg-slate-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-slate-900">Category Not Found</h2>
        <Link href="/" className="inline-block mt-4 text-sm text-teal-700 font-semibold hover:underline">
          Back to all categories
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & Header */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>All Categories</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#242D2B] tracking-tight">
                {category.name}
              </h1>
              {category.coming_soon && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Coming Soon
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">{category.description}</p>
          </div>

          {/* Pricing Model Filter Chips */}
          <div className="flex items-center p-1 bg-[#F7F5EF] rounded-xl border border-[#E7E2D8] text-xs font-semibold self-start md:self-center overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                filterType === 'all' ? 'bg-[#176B65] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({services.length})
            </button>
            <button
              onClick={() => setFilterType('fixed_price')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                filterType === 'fixed_price' ? 'bg-[#176B65] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fixed Price
            </button>
            <button
              onClick={() => setFilterType('quotation')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                filterType === 'quotation' ? 'bg-[#176B65] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Request Quote
            </button>
            <button
              onClick={() => setFilterType('time_based')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                filterType === 'time_based' ? 'bg-[#176B65] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Time Based
            </button>
          </div>
        </div>

        {/* Subcategories Horizontal Bar */}
        {subcategories.length > 0 && (
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E7E2D8]">
            <button
              onClick={() => setSelectedSubcat('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedSubcat === 'all'
                  ? 'bg-[#242D2B] text-[#F7F5EF]'
                  : 'bg-white text-slate-700 border border-[#E7E2D8] hover:bg-slate-50'
              }`}
            >
              All Subcategories
            </button>
            {subcategories.map((subcat) => (
              <button
                key={subcat.id}
                onClick={() => setSelectedSubcat(subcat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedSubcat === subcat.id
                    ? 'bg-[#176B65] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-[#E7E2D8] hover:bg-slate-50'
                }`}
              >
                {subcat.name} ({subcat.services_count || 0})
              </button>
            ))}
          </div>
        )}

        {/* Vehicle Type Filter (For Vehicle Services) */}
        {hasVehicleFilter && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Car className="w-3.5 h-3.5" /> Vehicle:
            </span>
            {[
              { id: 'all', label: 'All Vehicles' },
              { id: 'hatchback', label: 'Hatchback' },
              { id: 'sedan', label: 'Sedan' },
              { id: 'suv_muv', label: 'SUV / MUV' },
              { id: 'bike_scooter', label: 'Bike / Scooter' }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                  selectedVehicle === v.id
                    ? 'bg-[#25877C] text-white border-[#25877C]'
                    : 'bg-white text-slate-600 border-[#E7E2D8] hover:bg-slate-50'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Services Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E7E2D8] rounded-3xl space-y-2">
          <p className="text-base font-bold text-slate-800">No services match your filters.</p>
          <p className="text-xs text-slate-500">Try switching subcategories or vehicle types.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((service) => {
            const isComingSoon = service.coming_soon || category.coming_soon;
            const bType = service.booking_type || service.pricing_type;

            return (
              <div
                key={service.id}
                className="bg-white border border-[#E7E2D8] rounded-3xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isComingSoon
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : bType === 'fixed_price'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                        : bType === 'time_based'
                        ? 'bg-teal-50 text-teal-800 border border-teal-200/60'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200/60'
                    }`}>
                      {isComingSoon
                        ? 'Coming Soon'
                        : bType === 'fixed_price'
                        ? 'Fixed Price'
                        : bType === 'time_based'
                        ? 'Time Based'
                        : 'Quotation Required'}
                    </span>
                    {service.estimated_duration_minutes && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {service.estimated_duration_minutes} mins
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#242D2B]">{service.name}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {service.description || service.short_description}
                  </p>

                  {/* Supported Vehicles Tag */}
                  {service.supported_vehicle_types && service.supported_vehicle_types.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {service.supported_vehicle_types.map((vt) => (
                        <span key={vt} className="text-[10px] px-2 py-0.5 rounded bg-[#F7F5EF] text-slate-600 border border-[#E7E2D8]">
                          {vt === 'suv_muv' ? 'SUV / MUV' : vt.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-6 border-t border-[#E7E2D8] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Pricing</span>
                    {isComingSoon ? (
                      <span className="text-xs font-bold text-amber-700">Launching Soon</span>
                    ) : bType === 'fixed_price' ? (
                      <span className="text-lg font-black text-[#242D2B]">
                        {service.fixed_price ? `₹${service.fixed_price}` : 'Options Available'}
                      </span>
                    ) : bType === 'time_based' ? (
                      <span className="text-xs font-bold text-[#176B65]">
                        From ₹800 / 8h shift
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-indigo-600">
                        Free Quote by Admin
                      </span>
                    )}
                  </div>

                  {isComingSoon ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-xl cursor-not-allowed border border-slate-200"
                    >
                      Not Bookable
                    </button>
                  ) : (
                    <Link
                      href={`/services/${service.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#176B65] hover:bg-[#135752] text-white text-xs font-semibold rounded-xl transition shadow-xs"
                    >
                      <span>
                        {bType === 'fixed_price' ? 'Select Package' : bType === 'time_based' ? 'Configure Shift' : 'Request Quote'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CustomerSupportButtons variant="banner" />
    </div>
  );
}
