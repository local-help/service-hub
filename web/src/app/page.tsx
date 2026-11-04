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
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Category, Service } from '../types';
import { apiRequest } from '../api/client';
import { CustomerSupportButtons } from '../components/ui/SupportButtons';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest<Category[]>('/categories'),
      apiRequest<{ services: Service[] } | Service[]>('/services?per_page=20')
    ]).then(([catData, svcData]) => {
      setCategories(catData || []);
      const svcs = Array.isArray(svcData) ? svcData : (svcData as any).services || [];
      // Filter out quotation-based services from UI
      const directServices = svcs.filter(
        (s: Service) => s.pricing_type !== 'quotation' && s.booking_type !== 'quotation'
      );
      setServices(directServices.slice(0, 6));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getCategoryIcon = (iconName?: string | null) => {
    switch (iconName) {
      case 'car': return <Car className="w-6 h-6 text-teal-deep" />;
      case 'sparkles': return <Sparkles className="w-6 h-6 text-teal-accent" />;
      case 'wrench': return <Wrench className="w-6 h-6 text-teal-deep" />;
      case 'bolt': return <Bolt className="w-6 h-6 text-amber-600" />;
      case 'tv': return <Tv className="w-6 h-6 text-teal-accent" />;
      default: return <Briefcase className="w-6 h-6 text-charcoal-muted" />;
    }
  };

  const filteredServices = searchQuery
    ? services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.short_description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : services;

  return (
    <div className="space-y-16 pb-16 bg-[#F7F5EF]">
      {/* Hero Section — Deep Teal & Warm Ivory */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#176B65] via-[#145C57] to-[#242D2B] text-[#F7F5EF] pt-14 pb-20 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#25877C_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#25877C]/25 border border-[#25877C]/40 text-[#F7F5EF] text-xs font-semibold backdrop-blur-md">
            <span>📍 Prayagraj (Allahabad) Coverage</span>
            <span className="text-[#E7E2D8]/60">•</span>
            <span>Smart Instant Matching</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F7F5EF] leading-tight">
            Local Services You Can Trust, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8BE3D9] via-[#F7F5EF] to-[#D5CEC0]">
              Coordinated with Personal Care.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#E7E2D8] font-normal leading-relaxed">
            From doorstep car detailing to home deep cleaning and electrical repairs. Submit a request, your request is automatically matched with a verified local technician, and delivers transparent pricing.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden p-1.5 border border-[#E7E2D8] text-[#242D2B]">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search for 'car wash', 'ac repair', 'drain cleaning'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-slate-400 text-[#242D2B]"
              />
              <button 
                className="bg-[#176B65] hover:bg-[#135752] text-[#F7F5EF] font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shrink-0 shadow-sm"
              >
                Find Service
              </button>
            </div>
          </div>

          {/* Highlights */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-center border-t border-[#E7E2D8]/20">
            <div>
              <p className="text-2xl font-black text-[#F7F5EF]">100%</p>
              <p className="text-xs text-[#E7E2D8]/80 mt-0.5">Verified Local Providers</p>
            </div>
            <div>
              <p className="text-2xl font-black text-[#F7F5EF]">GPS Pinned</p>
              <p className="text-xs text-[#E7E2D8]/80 mt-0.5">Doorstep Accuracy</p>
            </div>
            <div>
              <p className="text-2xl font-black text-[#F7F5EF]">Prayagraj</p>
              <p className="text-xs text-[#E7E2D8]/80 mt-0.5">Full City Coverage</p>
            </div>
            <div>
              <p className="text-2xl font-black text-[#F7F5EF]">Direct</p>
              <p className="text-xs text-[#E7E2D8]/80 mt-0.5">Fixed Upfront Rates</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-[#242D2B] tracking-tight">Service Categories</h2>
            <p className="text-sm text-slate-500 mt-1">Browse our coordinated local service categories</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-32 bg-[#E7E2D8]/50 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="group relative bg-white border border-[#E7E2D8] hover:border-[#25877C] rounded-2xl p-5 text-center shadow-xs hover:shadow-md transition-all duration-200 flex flex-col items-center justify-between"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F0F8F7] group-hover:bg-[#D6ECE9] flex items-center justify-center transition mb-3 border border-[#B0DCD7]/40">
                  {getCategoryIcon(category.icon_name)}
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#242D2B] group-hover:text-[#176B65] transition line-clamp-2">
                  {category.name}
                </h3>
                <span className="text-[11px] font-medium text-slate-500 mt-1">
                  {category.services_count ?? 3} services
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Popular Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-[#242D2B] tracking-tight">Popular Services</h2>
            <p className="text-sm text-slate-500 mt-1">Direct-booking fixed price & time-based packages</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-[#E7E2D8] hover:border-[#25877C]/60 rounded-2xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-[#E6F3F1] text-[#176B65] border border-[#B0DCD7]">
                    {service.booking_type === 'time_based' ? 'Time Based' : 'Fixed Price'}
                  </span>
                  {service.estimated_duration_minutes && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {service.estimated_duration_minutes} mins
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#242D2B] group-hover:text-[#176B65] transition">
                  {service.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {service.short_description || service.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#E7E2D8]/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Pricing</span>
                  {service.fixed_price ? (
                    <span className="text-lg font-black text-[#176B65]">
                      ₹{service.fixed_price}
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-[#25877C]">
                      Dynamic Tariff
                    </span>
                  )}
                </div>

                <Link
                  href={`/services/${service.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#176B65] hover:bg-[#135752] text-[#F7F5EF] text-xs font-semibold rounded-xl transition shadow-xs"
                >
                  <span>Book Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How LocalHelp Works — Process Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E7E2D8] rounded-3xl p-8 sm:p-12 shadow-sm">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#176B65]">Streamlined Marketplace</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242D2B] mt-1">How LocalHelp Works for You</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Unlike open bidding platforms that flood you with spam calls, LocalHelp coordinates directly with certified local professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-[#F7F5EF] rounded-2xl border border-[#E7E2D8]">
              <div className="w-12 h-12 rounded-xl bg-[#176B65] text-[#F7F5EF] flex items-center justify-center font-bold text-lg mb-4 shadow-sm">
                1
              </div>
              <h4 className="text-base font-bold text-[#242D2B]">Select Service & Options</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Choose your service, select vehicle type or hourly driver duration, and pinpoint your doorstep via GPS.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-[#F7F5EF] rounded-2xl border border-[#E7E2D8]">
              <div className="w-12 h-12 rounded-xl bg-[#25877C] text-[#F7F5EF] flex items-center justify-center font-bold text-lg mb-4 shadow-sm">
                2
              </div>
              <h4 className="text-base font-bold text-[#242D2B]">Verified Specialist Dispatched</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Your request is automatically assigned to a verified local professional, who reviews the details and prepares for your doorstep visit.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-[#F7F5EF] rounded-2xl border border-[#E7E2D8]">
              <div className="w-12 h-12 rounded-xl bg-[#242D2B] text-[#F7F5EF] flex items-center justify-center font-bold text-lg mb-4 shadow-sm">
                3
              </div>
              <h4 className="text-base font-bold text-[#242D2B]">Approve & Relax</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Review your quote on web or mobile. Once approved, the booking is confirmed with full phone and WhatsApp support until completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support Banner Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CustomerSupportButtons variant="banner" />
      </section>

      {/* Floating Support Action */}
      <CustomerSupportButtons variant="floating" />
    </div>
  );
}
