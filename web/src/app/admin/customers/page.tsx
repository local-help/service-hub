'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserCheck, 
  Search, 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle, 
  X, 
  FileText,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import { User, Address, ServiceRequest, Booking } from '../../../types';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';

interface CustomerDetail {
  customer: User;
  addresses: Address[];
  requests: ServiceRequest[];
  bookings: Booking[];
}

export default function AdminCustomersPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  // Selected customer for detailed view
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCustomers = () => {
    setLoading(true);
    let url = `/admin/customers?`;
    if (q) url += `q=${encodeURIComponent(q)}&`;

    apiRequest<{ customers: User[] } | User[]>(url)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).customers || [];
        setCustomers(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/login?redirect=/admin/customers');
      return;
    }
    fetchCustomers();
  }, [user, isAdmin]);

  const loadCustomerDetail = async (id: number) => {
    setSelectedCustomerId(id);
    setDetailLoading(true);
    try {
      const res = await apiRequest<CustomerDetail>(`/admin/customers/${id}`);
      setDetail(res);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-blue-600" />
          Customer Directory & Profiles
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          View customer accounts, addresses, service request history, and direct phone/WhatsApp contact options.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, or email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={fetchCustomers}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
        >
          Search
        </button>
      </div>

      {/* Customer List & Split Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customers List */}
        <div className={`${selectedCustomerId ? 'lg:col-span-5' : 'lg:col-span-12'} transition-all`}>
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
              No registered customers found matching your criteria.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {customers.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                const cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
                const intlPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone.replace(/^0+/, '')}`;

                return (
                  <div
                    key={c.id}
                    onClick={() => loadCustomerDetail(c.id)}
                    className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition ${
                      isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{c.name}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {c.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        {c.phone && <span className="font-mono">{c.phone}</span>}
                        {c.email && <span>{c.email}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.phone && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`tel:${c.phone}`}
                            title="Call Customer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <a
                            href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(`Hello ${c.name}, this is LocalHelp Customer Support.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp Customer"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                      <ChevronRight className={`w-4 h-4 text-slate-400 ${isSelected ? 'rotate-90 text-blue-600' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Customer Details */}
        {selectedCustomerId && (
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {detail?.customer.name || 'Customer Details'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    User ID #{selectedCustomerId} • Joined {detail?.customer.created_at ? new Date(detail.customer.created_at).toLocaleDateString() : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {detailLoading || !detail ? (
                <div className="py-12 text-center text-slate-500">Loading details...</div>
              ) : (
                <div className="space-y-6">
                  {/* Contact Action Bar */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</p>
                      <p className="text-sm font-medium text-slate-800 font-mono mt-0.5">{detail.customer.phone || 'No phone'}</p>
                      {detail.customer.email && <p className="text-xs text-slate-600">{detail.customer.email}</p>}
                    </div>

                    {detail.customer.phone && (
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${detail.customer.phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow-sm"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call Now
                        </a>
                        <a
                          href={`https://wa.me/${detail.customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${detail.customer.name}, this is LocalHelp Customer Support.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Saved Addresses */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      Saved Addresses ({detail.addresses?.length || 0})
                    </h3>
                    {!detail.addresses || detail.addresses.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No addresses saved.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {detail.addresses.map((a) => (
                          <div key={a.id} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span>{a.label}</span>
                              {a.is_default && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-normal">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600">{a.address_line}</p>
                            {a.landmark && <p className="text-slate-500 text-[11px]">Near {a.landmark}</p>}
                            <p className="text-slate-500">{a.city} - {a.postal_code}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Service Requests */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Recent Service Requests ({detail.requests?.length || 0})
                    </h3>
                    {!detail.requests || detail.requests.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No service requests placed yet.</p>
                    ) : (
                      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden max-h-48 overflow-y-auto">
                        {detail.requests.map((r) => (
                          <div key={r.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-600">{r.reference_number}</span>
                                <span className="text-slate-800 font-medium">{r.service?.name}</span>
                              </div>
                              <p className="text-slate-500 text-[11px] mt-0.5">{new Date(r.created_at).toLocaleString()}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
                              {r.status.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bookings */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      Confirmed Bookings ({detail.bookings?.length || 0})
                    </h3>
                    {!detail.bookings || detail.bookings.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No bookings confirmed yet.</p>
                    ) : (
                      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden max-h-48 overflow-y-auto">
                        {detail.bookings.map((b) => (
                          <div key={b.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900">{b.reference_number}</span>
                                <span className="text-slate-800">{b.service_name}</span>
                              </div>
                              <p className="text-slate-500 text-[11px] mt-0.5">
                                Scheduled: {b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString() : 'N/A'} • Paid: ₹{b.total_paid}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-800">
                              {b.status.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
