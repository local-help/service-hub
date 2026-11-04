'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MessageCircle, 
  MapPin, 
  CheckCircle, 
  XCircle,
  Briefcase,
  X,
  Edit2
} from 'lucide-react';
import { Provider, Service } from '../../../types';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';

export default function AdminProvidersPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Bengaluru',
    service_area: '',
    notes: '',
    active: true,
    service_ids: [] as number[],
  });

  const fetchProviders = () => {
    setLoading(true);
    let url = `/admin/providers?`;
    if (q) url += `q=${encodeURIComponent(q)}&`;
    if (cityFilter) url += `city=${encodeURIComponent(cityFilter)}&`;
    if (activeFilter !== 'all') url += `active=${activeFilter === 'active'}&`;

    apiRequest<{ providers: Provider[] } | Provider[]>(url)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).providers || [];
        setProviders(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchServices = () => {
    apiRequest<{ services: Service[] } | Service[]>('/services')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).services || [];
        setServices(list);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/login?redirect=/admin/providers');
      return;
    }
    fetchProviders();
    fetchServices();
  }, [user, isAdmin]);

  const handleOpenAdd = () => {
    setEditingProvider(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: 'Bengaluru',
      service_area: '',
      notes: '',
      active: true,
      service_ids: [],
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Provider) => {
    setEditingProvider(p);
    setFormData({
      name: p.name,
      phone: p.phone,
      email: p.email || '',
      address: p.address || '',
      city: p.city || 'Bengaluru',
      service_area: p.service_area || '',
      notes: p.notes || '',
      active: p.active,
      service_ids: p.services?.map(s => s.id) || [],
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleToggleService = (sId: number) => {
    setFormData(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(sId)
        ? prev.service_ids.filter(id => id !== sId)
        : [...prev.service_ids, sId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setModalError('Provider name and phone are required');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      if (editingProvider) {
        await apiRequest(`/admin/providers/${editingProvider.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            provider: {
              name: formData.name,
              phone: formData.phone,
              email: formData.email || null,
              address: formData.address || null,
              city: formData.city || null,
              service_area: formData.service_area || null,
              notes: formData.notes || null,
              active: formData.active,
            },
            service_ids: formData.service_ids
          })
        });
      } else {
        await apiRequest('/admin/providers', {
          method: 'POST',
          body: JSON.stringify({
            provider: {
              name: formData.name,
              phone: formData.phone,
              email: formData.email || null,
              address: formData.address || null,
              city: formData.city || null,
              service_area: formData.service_area || null,
              notes: formData.notes || null,
              active: formData.active,
            },
            service_ids: formData.service_ids
          })
        });
      }

      setIsModalOpen(false);
      fetchProviders();
    } catch (err: any) {
      setModalError(err.error || 'Failed to save provider details');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleActive = async (p: Provider) => {
    try {
      await apiRequest(`/admin/providers/${p.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          provider: { active: !p.active }
        })
      });
      fetchProviders();
    } catch (err: any) {
      alert(err.error || 'Failed to update provider status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Provider Directory (Manual Coordination)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            LocalHelp admin records providers to contact manually for availability and quotes. Providers do not log in.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition"
        >
          <Plus className="w-5 h-5" />
          Add Provider
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search provider by name, phone or notes..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProviders()}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button
            onClick={fetchProviders}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Provider List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Loading providers...
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No providers found</p>
          <p className="text-sm mt-1">Try adjusting your search filters or add a new provider.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((p) => {
            const cleanPhone = p.phone.replace(/[^0-9]/g, '');
            const intlPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone.replace(/^0+/, '')}`;

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-snug">{p.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.city || 'Bengaluru'} {p.service_area ? `• ${p.service_area}` : ''}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(p)}
                      title="Click to toggle status"
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 transition ${
                        p.active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p.active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {p.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Phone & Email */}
                  <div className="text-sm text-slate-700 space-y-1 mb-3">
                    <p className="font-mono text-xs text-slate-600 font-semibold">{p.phone}</p>
                    {p.email && <p className="text-xs text-slate-500 truncate">{p.email}</p>}
                    {p.address && <p className="text-xs text-slate-500">{p.address}</p>}
                  </div>

                  {/* Associated Services */}
                  {p.services && p.services.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> Services
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.services.map((svc) => (
                          <span
                            key={svc.id}
                            className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200"
                          >
                            {svc.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Internal Notes */}
                  {p.notes && (
                    <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 mb-4 italic">
                      "{p.notes}"
                    </div>
                  )}
                </div>

                {/* Card Actions: Call, WhatsApp, Edit */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${p.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition"
                      title="Direct Call Provider"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                    <a
                      href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(`Hi ${p.name}, this is LocalHelp admin regarding service availability.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold rounded-lg transition"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Provider"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add/Edit Provider */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProvider ? 'Edit Provider' : 'Add New Local Provider'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Provider Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Electrical Works"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="provider@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Service Area / Locality
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Koramangala, Indiranagar"
                    value={formData.service_area}
                    onChange={(e) => setFormData({ ...formData, service_area: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Address
                </label>
                <input
                  type="text"
                  placeholder="Shop #, Street name, Landmark"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Assignable Services
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1.5">
                  {services.map((svc) => (
                    <label
                      key={svc.id}
                      className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded cursor-pointer text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={formData.service_ids.includes(svc.id)}
                        onChange={() => handleToggleService(svc.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{svc.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Internal Admin Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Reliable for emergency electrical jobs, quotes slightly higher on weekends..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="activeCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Provider is currently active & accepting manual calls
                </label>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : editingProvider ? 'Update Provider' : 'Create Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

