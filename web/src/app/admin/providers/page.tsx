'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Briefcase,
  X,
  Edit2,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Check,
  UserPlus,
  LayoutGrid,
  Table as TableIcon,
  Mail,
  Building2,
  ExternalLink
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
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

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
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    business_address: '',
    address: '',
    city: 'Prayagraj',
    service_area: '',
    notes: '',
    active: true,
    verification_status: 'verified',
    operational_status: 'active',
    service_ids: [] as number[],
    user_name: '',
    user_email: '',
    user_password: '',
  });

  const fetchProviders = () => {
    setLoading(true);
    let url = `/admin/providers?`;
    if (q) url += `q=${encodeURIComponent(q)}&`;
    if (cityFilter) url += `city=${encodeURIComponent(cityFilter)}&`;
    if (verificationFilter !== 'all') url += `verification_status=${encodeURIComponent(verificationFilter)}&`;

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
  }, [user, isAdmin, verificationFilter]);

  const handleOpenAdd = () => {
    setEditingProvider(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      business_address: '',
      address: '',
      city: 'Prayagraj',
      service_area: '',
      notes: '',
      active: true,
      verification_status: 'verified',
      operational_status: 'active',
      service_ids: [],
      user_name: '',
      user_email: '',
      user_password: '',
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
      contact_person: p.contact_person || '',
      contact_phone: p.contact_phone || p.phone,
      contact_email: p.contact_email || p.email || '',
      business_address: p.business_address || p.address || '',
      address: p.address || '',
      city: p.city || 'Prayagraj',
      service_area: p.service_area || '',
      notes: p.notes || '',
      active: p.active,
      verification_status: p.verification_status || 'verified',
      operational_status: p.operational_status || 'active',
      service_ids: p.services?.map((s) => s.id) || [],
      user_name: '',
      user_email: '',
      user_password: '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleToggleService = (svcId: number) => {
    const exists = formData.service_ids.includes(svcId);
    setFormData({
      ...formData,
      service_ids: exists
        ? formData.service_ids.filter((id) => id !== svcId)
        : [...formData.service_ids, svcId],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      if (editingProvider) {
        await apiRequest(`/admin/providers/${editingProvider.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            contact_person: formData.contact_person || null,
            contact_phone: formData.contact_phone || null,
            contact_email: formData.contact_email || null,
            business_address: formData.business_address || null,
            address: formData.address || null,
            city: formData.city || null,
            service_area: formData.service_area || null,
            notes: formData.notes || null,
            active: formData.active,
            service_ids: formData.service_ids,
          }),
        });
      } else {
        const payload: any = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          contact_person: formData.contact_person || null,
          contact_phone: formData.contact_phone || null,
          contact_email: formData.contact_email || null,
          business_address: formData.business_address || null,
          address: formData.address || null,
          city: formData.city || null,
          service_area: formData.service_area || null,
          notes: formData.notes || null,
          active: formData.active,
          service_ids: formData.service_ids,
        };

        if (formData.user_email && formData.user_name) {
          payload.user = {
            name: formData.user_name,
            email: formData.user_email,
            phone: formData.contact_phone || formData.phone,
            password: formData.user_password || 'Provider@123456',
          };
        }

        await apiRequest('/admin/providers', {
          method: 'POST',
          body: JSON.stringify(payload),
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

  const handleVerifyProvider = async (p: Provider) => {
    try {
      await apiRequest(`/admin/providers/${p.id}/verify`, { method: 'POST' });
      fetchProviders();
    } catch (err: any) {
      alert(err.error || 'Failed to verify provider');
    }
  };

  const handleSuspendProvider = async (p: Provider) => {
    const reason = prompt('Enter suspension reason:', 'Policy non-compliance');
    if (!reason) return;

    try {
      await apiRequest(`/admin/providers/${p.id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      fetchProviders();
    } catch (err: any) {
      alert(err.error || 'Failed to suspend provider');
    }
  };

  const handleActivateProvider = async (p: Provider) => {
    try {
      await apiRequest(`/admin/providers/${p.id}/activate`, { method: 'POST' });
      fetchProviders();
    } catch (err: any) {
      alert(err.error || 'Failed to activate provider');
    }
  };

  const verifiedCount = providers.filter((p) => p.verification_status === 'verified').length;
  const underReviewCount = providers.filter((p) => p.verification_status === 'under_review').length;
  const suspendedCount = providers.filter((p) => p.verification_status === 'suspended' || p.operational_status === 'suspended').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Service Providers Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage vetted local specialists, verify business credentials, and assign service authorizations
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Specialist</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Total Enrolled</span>
          <span className="text-xl font-bold text-slate-900 mt-0.5 block">{providers.length}</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Verified Active</span>
          <span className="text-xl font-bold text-emerald-600 mt-0.5 block">{verifiedCount}</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Under Review</span>
          <span className="text-xl font-bold text-amber-600 mt-0.5 block">{underReviewCount}</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Suspended</span>
          <span className="text-xl font-bold text-rose-600 mt-0.5 block">{suspendedCount}</span>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Providers', count: providers.length },
              { id: 'verified', label: 'Verified', count: verifiedCount },
              { id: 'under_review', label: 'Under Review', count: underReviewCount },
              { id: 'suspended', label: 'Suspended', count: suspendedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setVerificationFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${verificationFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search & View Mode Switch */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search name, phone, area..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProviders()}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Provider List / Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center animate-pulse">
          <div className="h-4 w-32 bg-slate-200 rounded mx-auto mb-3" />
          <div className="h-8 w-64 bg-slate-200 rounded mx-auto" />
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No Specialists Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or enroll a new service specialist in Prayagraj.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Operational Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Specialist / Business</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Service Area</th>
                  <th className="py-3 px-4">Services ({services.length})</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providers.map((p) => {
                  const isVerified = p.verification_status === 'verified';
                  const isSuspended = p.verification_status === 'suspended' || p.operational_status === 'suspended';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{p.name}</span>
                            {p.contact_person && (
                              <span className="text-[11px] text-slate-500 block">Contact: {p.contact_person}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <a href={`tel:${p.phone}`} className="font-mono text-slate-900 hover:underline block">
                          {p.phone}
                        </a>
                        {p.email && <span className="text-[11px] text-slate-500 truncate max-w-[150px] block">{p.email}</span>}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{p.service_area || p.city || 'Prayagraj'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {p.services && p.services.length > 0 ? (
                            p.services.slice(0, 2).map((s) => (
                              <span
                                key={s.id}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200"
                              >
                                {s.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">None</span>
                          )}
                          {p.services && p.services.length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200 font-medium">
                              +{p.services.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isVerified && !isSuspended && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        {isSuspended && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Ban className="w-3 h-3" />
                            Suspended
                          </span>
                        )}
                        {!isVerified && !isSuspended && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {p.verification_status || 'Pending'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isVerified && !isSuspended && (
                            <button
                              onClick={() => handleVerifyProvider(p)}
                              title="Verify Specialist"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Verify</span>
                            </button>
                          )}

                          {isSuspended ? (
                            <button
                              onClick={() => handleActivateProvider(p)}
                              title="Activate Specialist"
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspendProvider(p)}
                              title="Suspend Specialist"
                              className="px-2.5 py-1 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition"
                            >
                              Suspend
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Details"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Detailed Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {providers.map((p) => {
            const isVerified = p.verification_status === 'verified';
            const isSuspended = p.verification_status === 'suspended' || p.operational_status === 'suspended';

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-400 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                      {p.contact_person && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Contact: <strong>{p.contact_person}</strong></p>
                      )}
                    </div>

                    <div>
                      {isVerified && !isSuspended && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                      {isSuspended && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Ban className="w-3 h-3" />
                          Suspended
                        </span>
                      )}
                      {!isVerified && !isSuspended && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {p.verification_status || 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${p.phone}`} className="hover:underline font-mono text-slate-800">
                        {p.phone}
                      </a>
                    </div>
                    {p.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.service_area || p.address || p.city || 'Prayagraj'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Authorized Services ({p.services?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {p.services && p.services.length > 0 ? (
                        p.services.slice(0, 3).map((s) => (
                          <span
                            key={s.id}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200"
                          >
                            {s.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                      {p.services && p.services.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200">
                          +{p.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {p.suspension_reason && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                      <strong>Suspension:</strong> {p.suspension_reason}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                    title="Edit provider details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {!isVerified && !isSuspended && (
                      <button
                        onClick={() => handleVerifyProvider(p)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        Verify
                      </button>
                    )}

                    {isSuspended ? (
                      <button
                        onClick={() => handleActivateProvider(p)}
                        className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSuspendProvider(p)}
                        className="px-2.5 py-1 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Onboard / Edit Provider Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingProvider ? 'Edit Service Provider' : 'Onboard New Specialist'}
                </h3>
                <p className="text-xs text-slate-500">
                  Enroll verified local technicians into Prayagraj operations
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business / Provider Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Apex Auto Detailing"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+9198XXXXXXXX"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="provider@example.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Prayagraj"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Area / Neighborhoods
                  </label>
                  <input
                    type="text"
                    value={formData.service_area}
                    onChange={(e) => setFormData({ ...formData, service_area: e.target.value })}
                    placeholder="Civil Lines, Katra, Georgetown"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Address
                </label>
                <input
                  type="text"
                  value={formData.business_address}
                  onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                  placeholder="Plot 14, MG Marg, Civil Lines"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Configure Services Multi-select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Authorize Catalogue Services ({formData.service_ids.length} selected)
                </label>
                <div className="max-h-36 overflow-y-auto p-2.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {services.map((svc) => {
                    const isSelected = formData.service_ids.includes(svc.id);
                    return (
                      <button
                        type="button"
                        key={svc.id}
                        onClick={() => handleToggleService(svc.id)}
                        className={`p-2 rounded-lg text-left text-xs transition cursor-pointer flex items-center justify-between ${isSelected
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'hover:bg-white text-slate-700 bg-white/60 border border-slate-200/50'
                          }`}
                      >
                        <span className="truncate">{svc.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Initial Owner User Credentials */}
              {!editingProvider && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-800">
                      Create Specialist Login Account
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">User Full Name</label>
                      <input
                        type="text"
                        value={formData.user_name}
                        onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                        placeholder="e.g. Rajesh Sharma"
                        className="w-full text-xs p-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Login Email</label>
                      <input
                        type="email"
                        value={formData.user_email}
                        onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                        placeholder="rajesh@example.com"
                        className="w-full text-xs p-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Password</label>
                      <input
                        type="password"
                        value={formData.user_password}
                        onChange={(e) => setFormData({ ...formData, user_password: e.target.value })}
                        placeholder="Provider@123456"
                        className="w-full text-xs p-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
                >
                  {modalLoading ? 'Saving...' : editingProvider ? 'Update Specialist' : 'Complete Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
