'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { Category, Service } from '../../../types';
import { apiRequest } from '../../../api/client';
import { CustomerSupportButtons } from '../../../components/ui/SupportButtons';

export default function CategoryPage() {
  const params = useParams();
  const id = params?.id as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'fixed_price' | 'quotation'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiRequest<Category>(`/categories/${id}`)
      .then((data) => {
        setCategory(data);
        setServices(data.active_services || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = services.filter((s) => {
    if (filterType === 'all') return true;
    return s.pricing_type === filterType;
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
        <Link href="/" className="inline-block mt-4 text-sm text-blue-600 font-semibold hover:underline">
          Back to all categories
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>All Categories</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {category.name}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">{category.description}</p>
          </div>

          {/* Pricing Model Filter Chips */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold self-start sm:self-center">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({services.length})
            </button>
            <button
              onClick={() => setFilterType('fixed_price')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterType === 'fixed_price' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fixed Price
            </button>
            <button
              onClick={() => setFilterType('quotation')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterType === 'quotation' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quotation Based
            </button>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((service) => (
          <div
            key={service.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  service.pricing_type === 'fixed_price'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200/50'
                }`}>
                  {service.pricing_type === 'fixed_price' ? 'Fixed Price' : 'Quotation Required'}
                </span>
                {service.estimated_duration_minutes && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {service.estimated_duration_minutes} mins
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900">{service.name}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {service.description || service.short_description}
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Service Cost</span>
                {service.pricing_type === 'fixed_price' ? (
                  <span className="text-lg font-black text-slate-900">
                    ₹{service.fixed_price}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-indigo-600">
                    Free Quote by Admin
                  </span>
                )}
              </div>

              <Link
                href={`/services/${service.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <span>{service.pricing_type === 'fixed_price' ? 'Select Package' : 'Request Quote'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <CustomerSupportButtons variant="banner" />
    </div>
  );
}

