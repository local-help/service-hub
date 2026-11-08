'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Wrench, 
  Car, 
  Sparkles, 
  Bolt, 
  Laptop, 
  ArrowRight, 
  Clock, 
  Search, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2,
  ChevronRight,
  Flame,
  X
} from 'lucide-react';
import { Category, Service } from '../types';
import { apiRequest } from '../api/client';
import { useLocation } from '../contexts/LocationContext';

export default function HomePage() {
  const { location, setIsModalOpen } = useLocation();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest<Category[]>('/categories'),
      apiRequest<{ services: Service[] } | Service[]>('/services?per_page=100')
    ]).then(([catData, svcData]) => {
      setCategories(catData || []);
      const svcs = Array.isArray(svcData) ? svcData : (svcData as any).services || [];
      setAllServices(svcs);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getCategoryIcon = (slug?: string, iconName?: string | null) => {
    const cls = 'w-5 h-5 text-teal-700';
    if (slug === 'vehicle-services' || iconName === 'car') return <Car className={cls} />;
    if (slug === 'home-services' || iconName === 'sparkles') return <Sparkles className={cls} />;
    if (slug === 'computer-services' || iconName === 'laptop') return <Laptop className={cls} />;
    if (slug === 'emergency-assistance' || iconName === 'bolt') return <Bolt className={cls} />;
    return <Wrench className={cls} />;
  };

  // Instant autocomplete search matches
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allServices.filter((s) => {
      const catName = s.category?.name || categories.find((c) => c.id === s.category_id)?.name;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.short_description && s.short_description.toLowerCase().includes(q)) ||
        (catName && catName.toLowerCase().includes(q))
      );
    }).slice(0, 6);
  }, [searchQuery, allServices, categories]);

  // Curated Popular Services across categories
  const popularServices = useMemo(() => {
    const prioritySlugs = [
      'car-wash',
      'car-detailing',
      'ac-repair-servicing',
      'deep-cleaning',
      'electrical-repair',
      'plumbing-repair',
      'laptop-repair',
      'hourly-driver'
    ];

    const curated: Service[] = [];
    prioritySlugs.forEach((slug) => {
      const found = allServices.find((s) => s.slug === slug);
      if (found) curated.push(found);
    });

    // Fill with active services if some slugs not found
    if (curated.length < 8) {
      allServices.forEach((s) => {
        if (!curated.some((c) => c.id === s.id) && curated.length < 8) {
          curated.push(s);
        }
      });
    }

    return curated;
  }, [allServices]);

  const selectedCategoryObj = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return categories.find(
      (c) => c.slug === selectedCategory || c.id.toString() === selectedCategory
    );
  }, [selectedCategory, categories]);

  // Filtered by selected category pill
  const displayedServices = useMemo(() => {
    if (selectedCategory === 'all' || !selectedCategoryObj) return popularServices;
    return allServices.filter((s) => 
      s.category_id === selectedCategoryObj.id || 
      s.category?.slug === selectedCategoryObj.slug ||
      s.category?.id === selectedCategoryObj.id
    );
  }, [selectedCategory, selectedCategoryObj, popularServices, allServices]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-14 pb-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Guaranteed Fixed Pricing • Verified Local Technicians</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Doorstep Services in <span className="text-teal-700">Prayagraj</span>
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-500 leading-relaxed">
            Car wash, AC servicing, deep cleaning, and home repairs. Select your service, configure your package, and get verified doorstep delivery.
          </p>

          {/* Instant Flat Search Bar */}
          <div className="max-w-xl mx-auto pt-2 relative">
            <div className="flex items-center bg-white rounded-xl border border-slate-200/90 shadow-sm px-4 py-3 gap-3 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100 transition">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search services (e.g. Car Wash, AC Service, Electrician, Plumber)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-700 transition shrink-0"
              >
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline font-medium">{location.locality || 'Civil Lines'}</span>
              </button>
            </div>

            {/* Autocomplete Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div 
                className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden text-left divide-y divide-slate-100"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="px-4 py-2 bg-slate-50/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Matching Services ({searchResults.length})
                </div>
                {searchResults.map((svc) => (
                  <Link
                    key={svc.id}
                    href={`/services/${svc.slug || svc.id}`}
                    onClick={() => {
                      setIsSearchFocused(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-teal-50/40 transition group"
                  >
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-teal-800">
                        {svc.name}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>{svc.category?.name || 'Local Service'}</span>
                        {svc.estimated_duration_minutes && (
                          <>
                            <span>•</span>
                            <span>{svc.estimated_duration_minutes} mins</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {svc.fixed_price ? `₹${svc.fixed_price}` : 'Configurable'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Flat Service Discovery: Category Quick Pills */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Top Services
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id.toString();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.slug || cat.id.toString())}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {cat.services_count || 0}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Direct Service Cards Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>
                {selectedCategory === 'all' || !selectedCategoryObj
                  ? 'Popular Doorstep Services'
                  : selectedCategoryObj.name.toLowerCase().endsWith('services')
                  ? selectedCategoryObj.name
                  : `${selectedCategoryObj.name} Services`}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedCategory === 'all' || !selectedCategoryObj
                ? '1-click configuration, guaranteed pricing, and verified dispatch'
                : selectedCategoryObj.description || `1-click configuration, guaranteed pricing, and verified dispatch for ${selectedCategoryObj.name}`}
            </p>
          </div>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition flex items-center gap-1 cursor-pointer"
            >
              <span>View All Top Services</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-44 bg-slate-100 animate-pulse rounded-xl border border-slate-200/60" />
            ))}
          </div>
        ) : displayedServices.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/80">
            <p className="text-sm font-semibold text-slate-700">No services found in this category</p>
            <p className="text-xs text-slate-400 mt-1">Check back soon or explore our popular services.</p>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition"
            >
              View All Top Services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedServices.map((service) => (
              <div
                key={service.id}
                className="border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between hover:border-teal-300 hover:shadow-md transition bg-white group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-100">
                      {service.category?.name || categories.find((c) => c.id === service.category_id)?.name || 'Local Service'}
                    </span>
                    {service.estimated_duration_minutes && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {service.estimated_duration_minutes}m
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {service.short_description || service.description}
                  </p>
                </div>

                <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Fixed from</span>
                    <span className="text-sm font-black text-slate-900">
                      {service.fixed_price ? `₹${service.fixed_price}` : '₹299'}
                    </span>
                  </div>

                  {service.coming_soon ? (
                    <span className="inline-flex items-center px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-lg">
                      Coming Soon
                    </span>
                  ) : (
                    <Link
                      href={`/services/${service.slug || service.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 group-hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition shadow-xs"
                    >
                      <span>Book</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trust & Guarantee Highlights */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200/70">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs mx-auto sm:mx-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Fixed Transparent Pricing</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                No on-site surprises or bargaining. Standard fixed tariffs with a ₹25 platform fee.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs mx-auto sm:mx-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">100% Verified Specialists</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Background-checked, police-verified technicians with proven track records in Prayagraj.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs mx-auto sm:mx-0">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">On-Time Doorstep Delivery</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Guaranteed arrival in your scheduled time slot, fully equipped with professional tools.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
