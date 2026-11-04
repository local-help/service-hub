'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit3, 
  Check, 
  X, 
  AlertCircle, 
  Layers, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Car
} from 'lucide-react';
import { Category, Subcategory, Service } from '../../../types';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';

export default function AdminCataloguePage() {
  const { user, isAdmin } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Load all categories on mount
  const loadCategories = () => {
    setLoading(true);
    apiRequest<Category[]>('/categories')
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0 && !selectedCatId) {
          setSelectedCatId(cats[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // When selected category changes, load its subcategories and services
  useEffect(() => {
    if (!selectedCatId) return;
    apiRequest<Category>(`/categories/${selectedCatId}`)
      .then((catData) => {
        setSubcategories(catData.subcategories || []);
        setServices(catData.active_services || []);
      })
      .catch(console.error);
  }, [selectedCatId]);

  // Toggle Coming Soon for a service
  const handleToggleComingSoon = async (svc: Service) => {
    setUpdatingId(svc.id);
    try {
      const updated = await apiRequest<Service>(`/admin/services/${svc.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          coming_soon: !svc.coming_soon
        })
      });
      setServices(services.map((s) => s.id === svc.id ? { ...s, coming_soon: updated.coming_soon } : s));
    } catch (err: any) {
      alert(err.error || 'Failed to update service status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle Active for a service
  const handleToggleActive = async (svc: Service) => {
    setUpdatingId(svc.id);
    try {
      const updated = await apiRequest<Service>(`/admin/services/${svc.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          active: !svc.active
        })
      });
      setServices(services.map((s) => s.id === svc.id ? { ...s, active: updated.active } : s));
    } catch (err: any) {
      alert(err.error || 'Failed to update service');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredServices = services.filter((s) => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#176B65] via-[#145C57] to-[#242D2B] text-[#F7F5EF] p-6 sm:p-8 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25877C]/30 border border-[#25877C]/40 text-[#F7F5EF] text-xs font-semibold mb-3">
              <span>🗂️ Catalogue & Pricing Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F7F5EF]">
              Service Catalogue Manager
            </h1>
            <p className="text-xs sm:text-sm text-[#E7E2D8]/90 mt-1 max-w-2xl">
              Configurable Category Hierarchy, Subcategories, Variants, Vehicle Applicability, and Pricing Rules.
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-[#F7F5EF] text-[#176B65] font-semibold text-xs rounded-xl shadow hover:bg-white transition self-start sm:self-center"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-2 border-b border-[#25877C]/30 text-xs sm:text-sm">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-4 py-2 rounded-xl font-medium transition whitespace-nowrap ${
                selectedCatId === cat.id
                  ? 'bg-[#25877C] text-white shadow'
                  : 'text-[#E7E2D8] hover:bg-[#25877C]/20'
              }`}
            >
              <span>{cat.name}</span>
              {cat.coming_soon && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-400 text-slate-900 font-bold">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategories Overview */}
      <div className="p-5 bg-white border border-[#E7E2D8] rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#176B65]" />
            <span>Configured Subcategories</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {subcategories.length} subcategories
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {subcategories.map((subcat) => (
            <div
              key={subcat.id}
              className="px-3 py-1.5 rounded-xl bg-[#F7F5EF] border border-[#E7E2D8] text-xs font-bold text-slate-700 flex items-center gap-2"
            >
              <span>{subcat.name}</span>
              <span className="w-5 h-5 rounded-full bg-white text-[#176B65] border border-[#E7E2D8] text-[10px] flex items-center justify-center font-bold">
                {subcat.services_count || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Services Table and Search */}
      <div className="p-6 bg-white border border-[#E7E2D8] rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#242D2B]">Active Services in Category</h3>
            <p className="text-xs text-slate-500">
              Manage booking types, toggle Coming Soon non-bookable status, and check pricing rules.
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl outline-none w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F5EF] text-[#242D2B] border-b border-[#E7E2D8]">
              <tr>
                <th className="p-3 font-bold">Service Name</th>
                <th className="p-3 font-bold">Subcategory</th>
                <th className="p-3 font-bold">Booking Model</th>
                <th className="p-3 font-bold">Base Price / Tariff</th>
                <th className="p-3 font-bold">Vehicles</th>
                <th className="p-3 font-bold">Coming Soon</th>
                <th className="p-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E2D8]">
              {filteredServices.map((svc) => (
                <tr key={svc.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3">
                    <span className="font-bold text-[#242D2B] block text-sm">{svc.name}</span>
                    <span className="text-[11px] text-slate-400 line-clamp-1">{svc.short_description}</span>
                  </td>
                  <td className="p-3 text-slate-600 font-medium">
                    {svc.subcategory?.name || 'General'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      svc.booking_type === 'fixed_price'
                        ? 'bg-emerald-100 text-emerald-800'
                        : svc.booking_type === 'time_based'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {svc.booking_type === 'fixed_price' ? 'Fixed Price' : svc.booking_type === 'time_based' ? 'Time Based' : 'Quotation'}
                    </span>
                  </td>
                  <td className="p-3 font-black text-[#176B65]">
                    {svc.booking_type === 'fixed_price' ? `₹${svc.fixed_price || 299}` : svc.booking_type === 'time_based' ? '₹800 / 8h' : 'Quoted by Admin'}
                  </td>
                  <td className="p-3 text-slate-600">
                    {svc.supported_vehicle_types && svc.supported_vehicle_types.length > 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {svc.supported_vehicle_types.join(', ')}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">N/A</span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleComingSoon(svc)}
                      disabled={updatingId === svc.id}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        svc.coming_soon
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {svc.coming_soon ? 'Soon (Non-bookable)' : 'Available'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/services/${svc.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#176B65] hover:underline"
                    >
                      <span>Preview</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
