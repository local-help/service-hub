'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, ArrowRight, ArrowLeft, Car } from 'lucide-react';
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
  const [filterType, setFilterType] = useState<'all' | 'fixed_price' | 'time_based'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiRequest<Category>(`/categories/${id}`)
      .then((data) => {
        setCategory(data);
        setSubcategories(data.subcategories || []);
        const rawServices = data.active_services || [];
        const fixedServices = rawServices.filter(
          (s: Service) => s.booking_type === 'fixed_price' || s.pricing_type === 'fixed_price'
        );
        setServices(fixedServices);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const hasVehicleFilter = services.some(
    (s) => s.supported_vehicle_types && s.supported_vehicle_types.length > 0
  );

  const filtered = services.filter((s) => {
    if (selectedSubcat !== 'all' && s.subcategory_id !== selectedSubcat) {
      return false;
    }
    if (filterType !== 'all') {
      const bType = s.booking_type || s.pricing_type;
      if (bType !== filterType) return false;
    }
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-100 rounded-md" />
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => <div key={n} className="h-44 bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-lg font-semibold text-slate-900">Category not found</h2>
        <Link href="/" className="inline-block mt-3 text-sm text-slate-600 hover:text-slate-900 underline">
          Back to categories
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition mb-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Categories</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {category.name}
              </h1>
              {category.coming_soon && (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Coming Soon
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-slate-500 mt-1 max-w-xl">{category.description}</p>
            )}
          </div>

          {/* Model Filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-50 rounded-lg border border-slate-200 text-xs self-start md:self-center">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({services.length})
            </button>
            <button
              onClick={() => setFilterType('fixed_price')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                filterType === 'fixed_price' ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Fixed Price
            </button>
            <button
              onClick={() => setFilterType('time_based')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                filterType === 'time_based' ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Time Based
            </button>
          </div>
        </div>

        {/* Subcategories */}
        {subcategories.length > 0 && (
          <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
            <button
              onClick={() => setSelectedSubcat('all')}
              className={`px-3 py-1 rounded-lg text-xs transition whitespace-nowrap ${
                selectedSubcat === 'all'
                  ? 'bg-teal-700 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            {subcategories.map((subcat) => (
              <button
                key={subcat.id}
                onClick={() => setSelectedSubcat(subcat.id)}
                className={`px-3 py-1 rounded-lg text-xs transition whitespace-nowrap ${
                  selectedSubcat === subcat.id
                    ? 'bg-teal-700 text-white font-medium shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {subcat.name} ({subcat.services_count || 0})
              </button>
            ))}
          </div>
        )}

        {/* Vehicle filter */}
        {hasVehicleFilter && (
          <div className="mt-3 flex items-center gap-1.5 text-xs overflow-x-auto">
            <span className="text-slate-400 text-xs flex items-center gap-1 shrink-0">
              <Car className="w-3.5 h-3.5" />
            </span>
            {[
              { id: 'all', label: 'All vehicles' },
              { id: 'hatchback', label: 'Hatchback' },
              { id: 'sedan', label: 'Sedan' },
              { id: 'suv_muv', label: 'SUV' },
              { id: 'bike_scooter', label: 'Bike' }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                className={`px-2.5 py-1 rounded-md text-xs transition shrink-0 ${
                  selectedVehicle === v.id
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-500 hover:text-slate-900'
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
        <div className="py-12 text-center border border-slate-200 rounded-xl space-y-1">
          <p className="text-sm font-medium text-slate-700">No services match the selected filters.</p>
          <p className="text-xs text-slate-400">Try changing your filter options.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((service) => {
            const isComingSoon = service.coming_soon || category.coming_soon;
            const bType = service.booking_type || service.pricing_type;

            return (
              <div
                key={service.id}
                className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {isComingSoon
                        ? 'Coming Soon'
                        : bType === 'time_based'
                        ? 'Time Based'
                        : 'Fixed Price'}
                    </span>
                    {service.estimated_duration_minutes && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {service.estimated_duration_minutes} min
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900">{service.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {service.description || service.short_description}
                  </p>

                  {service.supported_vehicle_types && service.supported_vehicle_types.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {service.supported_vehicle_types.map((vt) => (
                        <span key={vt} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-100">
                          {vt === 'suv_muv' ? 'SUV' : vt.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {isComingSoon ? (
                      <span className="text-xs text-amber-600 font-medium">Coming soon</span>
                    ) : bType === 'fixed_price' ? (
                      <span className="text-base font-semibold text-slate-900">
                        {service.fixed_price ? `₹${service.fixed_price}` : 'Options inside'}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600 font-medium">
                        From ₹800 / shift
                      </span>
                    )}
                  </div>

                  {isComingSoon ? (
                    <span className="text-xs text-slate-400">Unavailable</span>
                  ) : (
                    <Link
                      href={`/services/${service.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition shadow-xs"
                    >
                      <span>Book</span>
                      <ArrowRight className="w-3 h-3" />
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
