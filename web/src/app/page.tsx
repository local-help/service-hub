'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Wrench, 
  Car, 
  Sparkles, 
  Bolt, 
  Tv, 
  Briefcase, 
  ArrowRight, 
  Clock, 
  Search,
  MapPin,
  Phone,
  Shield,
  LifeBuoy
} from 'lucide-react';
import { Category, Service } from '../types';
import { apiRequest } from '../api/client';
import { CustomerSupportButtons } from '../components/ui/SupportButtons';
import { useLocation } from '../contexts/LocationContext';
import { useSupport } from '../contexts/SupportContext';

export default function HomePage() {
  const { location, setIsModalOpen } = useLocation();
  const { supportInfo, getCallUrl } = useSupport();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest<Category[]>('/categories'),
      apiRequest<{ services: Service[] } | Service[]>('/services?per_page=60')
    ]).then(([catData, svcData]) => {
      setCategories(catData || []);
      const svcs = Array.isArray(svcData) ? svcData : (svcData as any).services || [];

      // Target 4 popular services: Car Wash, Car Service, Car Insurance Claim, Roadside Assistance
      const targetSlugs = ['car-wash', 'car-servicing-maintenance', 'car-insurance-assistance', 'roadside-assistance'];
      const popular: Service[] = [];

      targetSlugs.forEach((slug) => {
        const found = svcs.find((s: Service) => s.slug === slug);
        if (found) popular.push(found);
      });

      // Fallbacks if any not matched by slug
      if (!popular.some(s => s.slug === 'car-wash')) {
        const s = svcs.find((x: Service) => x.name.toLowerCase().includes('car wash'));
        if (s) popular.push(s);
      }
      if (!popular.some(s => s.slug === 'car-servicing-maintenance')) {
        const s = svcs.find((x: Service) => x.name.toLowerCase() === 'car service' || x.name.toLowerCase().includes('car servicing'));
        if (s) popular.push(s);
      }
      if (!popular.some(s => s.slug === 'car-insurance-assistance')) {
        const s = svcs.find((x: Service) => x.name.toLowerCase().includes('insurance'));
        if (s) popular.push(s);
      }
      if (!popular.some(s => s.slug === 'roadside-assistance')) {
        const s = svcs.find((x: Service) => x.name.toLowerCase().includes('roadside') || x.name.toLowerCase().includes('jump start'));
        if (s) popular.push(s);
      }

      setServices(popular);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getCategoryIcon = (iconName?: string | null) => {
    const cls = 'w-5 h-5 text-slate-600';
    switch (iconName) {
      case 'car': return <Car className={cls} />;
      case 'sparkles': return <Sparkles className={cls} />;
      case 'wrench': return <Wrench className={cls} />;
      case 'bolt': return <Bolt className={cls} />;
      case 'tv': return <Tv className={cls} />;
      default: return <Briefcase className={cls} />;
    }
  };

  const filteredServices = searchQuery
    ? services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.short_description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : services;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 leading-tight">
            Local services you can trust
          </h1>

          <p className="max-w-xl mx-auto text-base text-slate-500 leading-relaxed">
            From car detailing to home repairs — submit a request and get automatically matched with a verified local technician in Prayagraj.
          </p>

          {/* Search bar */}
          <div className="max-w-lg mx-auto pt-2">
            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 gap-3 focus-within:border-teal-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100 transition">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search services…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-700 transition shrink-0"
              >
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">{location.locality || 'Prayagraj'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 1. POPULAR SERVICES FIRST */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Popular Services</h2>
            <p className="text-xs text-slate-400 mt-0.5">Direct doorstep vehicle care and emergency assistance</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-44 bg-slate-50 animate-pulse rounded-xl border border-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-teal-300 hover:shadow-xs transition bg-white"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-100">
                      {service.booking_type === 'time_based' ? 'Hourly' : 'Direct Booking'}
                    </span>
                    {service.estimated_duration_minutes && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {service.estimated_duration_minutes} min
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {service.short_description || service.description}
                  </p>
                </div>

                <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {service.fixed_price ? (
                      <span className="text-base font-semibold text-slate-900">
                        ₹{service.fixed_price}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">
                        Standard Tariff
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/services/${service.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition shadow-xs"
                  >
                    <span>Book</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. CATEGORIES BELOW POPULAR SERVICES */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
            <p className="text-xs text-slate-400 mt-0.5">Explore our coordinated service categories</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-24 bg-slate-50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="group flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-50/70 hover:bg-teal-50/40 border border-slate-100 hover:border-teal-200 transition text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200 group-hover:border-teal-300 transition">
                  {getCategoryIcon(category.icon_name)}
                </div>
                <span className="text-xs font-medium text-slate-700 group-hover:text-teal-900 line-clamp-2 transition">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-slate-50 rounded-xl p-8 sm:p-10 border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">How LocalHelp Works</h2>
          <p className="text-sm text-slate-500 mb-8">
            No spam calls, no bidding — just verified local professionals.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center text-sm font-semibold shadow-xs">
                1
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Select a service</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Choose your service, pick options, and pin your location via GPS.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center text-sm font-semibold shadow-xs">
                2
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Verified match</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your request is automatically assigned to a verified local professional, who reviews the details and prepares for your doorstep visit.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center text-sm font-semibold shadow-xs">
                3
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Approve & relax</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review the quote, approve the booking, and get full support until completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal support bar */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Need help? Our support team is available 8 AM – 9 PM, all days.
          </p>
          <div className="flex items-center gap-3">
            <a
              href={getCallUrl()}
              className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-teal-700 transition"
            >
              <Phone className="w-4 h-4 text-teal-600" />
              <span>{supportInfo.phone}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Floating support */}
      <CustomerSupportButtons variant="floating" />
    </div>
  );
}
