'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Service } from '../../../types';
import { apiRequest } from '../../../api/client';
import { CustomerSupportButtons } from '../../../components/ui/SupportButtons';

export default function ServiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiRequest<Service>(`/services/${id}`)
      .then(setService)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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
        <Link href="/" className="inline-block mt-4 text-sm text-blue-600 font-semibold hover:underline">
          Browse services
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          href={service.category ? `/categories/${service.category.id}` : '/'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {service.category?.name || 'Category'}</span>
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            service.pricing_type === 'fixed_price'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200/50'
          }`}>
            {service.pricing_type === 'fixed_price' ? 'Fixed Price Service' : 'Quotation Required'}
          </span>
          {service.estimated_duration_minutes && (
            <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {service.estimated_duration_minutes} minutes estimated
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {service.name}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
          {service.short_description}
        </p>
      </div>

      {/* Main card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Service Description</h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {service.description || 'Full doorstep inspection, professional diagnostic, and execution using certified tools and materials.'}
          </p>
        </div>

        {/* Benefits list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verified technician coordinated by LocalHelp</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Doorstep service at your selected time</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No multiple spam calls — 1 quote policy</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Payment online or offline after satisfaction</span>
          </div>
        </div>

        {/* Action Callout */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Service Fee</span>
            {service.pricing_type === 'fixed_price' ? (
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-slate-900">₹{service.fixed_price}</span>
                <span className="text-xs text-slate-500">all-inclusive</span>
              </div>
            ) : (
              <div className="mt-0.5">
                <span className="text-xl font-bold text-indigo-700">Custom Quotation</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Admin team will coordinate with provider and send you 1 quote
                </p>
              </div>
            )}
          </div>

          <Link
            href={`/services/${service.id}/request`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition cursor-pointer"
          >
            <span>{service.pricing_type === 'fixed_price' ? 'Book This Service' : 'Submit Request for Quote'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <CustomerSupportButtons variant="banner" serviceName={service.name} />
    </div>
  );
}

