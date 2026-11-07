'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  ChevronRight,
  User,
  Users,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { User as UserType, Address, ServiceRequest, Booking } from '../../../types';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';

interface CustomerDetail {
  customer: UserType;
  addresses: Address[];
  requests: ServiceRequest[];
  bookings: Booking[];
}

export default function AdminCustomersPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [customers, setCustomers] = useState<UserType[]>([]);
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

    apiRequest<{ customers: UserType[] } | UserType[]>(url)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Customer Accounts & Profiles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access Prayagraj client directories, verified service histories, delivery addresses, and direct communication channels
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search name, phone, or email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 transition shadow-2xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
        </div>
      </div>

      {/* Customer List & Split Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customers Directory */}
        <div className={`${selectedCustomerId ? 'lg:col-span-5' : 'lg:col-span-12'} transition-all space-y-3`}>
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-500">
              Customers Enrolled ({customers.length})
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center animate-pulse">
              <div className="h-4 w-32 bg-slate-200 rounded mx-auto mb-2" />
              <div className="h-3 w-48 bg-slate-200 rounded mx-auto" />
            </div>
          ) : customers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No Customers Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No registered customer records match your search criteria.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {customers.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                const cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
                const intlPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone.replace(/^0+/, '')}`;

                return (
                  <div
                    key={c.id}
                    onClick={() => loadCustomerDetail(c.id)}
                    className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition group ${isSelected ? 'bg-slate-50/90 border-l-4 border-slate-900' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 group-hover:bg-slate-200 transition">
                        {(c.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs truncate">{c.name}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {c.status || 'active'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-slate-500">
                          {c.phone && <span className="font-mono text-slate-700">{c.phone}</span>}
                          {c.email && <span className="truncate max-w-[140px]">{c.email}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {c.phone && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`tel:${c.phone}`}
                            title="Call Customer"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(`Hello ${c.name}, this is LocalHelp Customer Support.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp Customer"
                            className="p-1.5 text-slate-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                      <ChevronRight className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition ${isSelected ? 'rotate-90 text-slate-900' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Customer Details Drawer */}
        {selectedCustomerId && (
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sticky top-24 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {(detail?.customer.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {detail?.customer.name || 'Customer Details'}
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Client ID #{selectedCustomerId} • Registered {detail?.customer.created_at ? new Date(detail.customer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {detailLoading || !detail ? (
                <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
                  Loading customer details & booking records...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Contact Action Bar */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Direct Contact</span>
                      <p className="text-xs font-bold text-slate-900 font-mono mt-0.5">{detail.customer.phone || 'No phone'}</p>
                      {detail.customer.email && <p className="text-xs text-slate-600 mt-0.5">{detail.customer.email}</p>}
                    </div>

                    {detail.customer.phone && (
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${detail.customer.phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Client</span>
                        </a>
                        <a
                          href={`https://wa.me/${detail.customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${detail.customer.name}, this is LocalHelp Customer Support regarding your service request.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Saved Addresses */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-600" />
                      Saved Delivery Addresses ({detail.addresses?.length || 0})
                    </h3>
                    {!detail.addresses || detail.addresses.length === 0 ? (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                        No addresses registered yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {detail.addresses.map((a) => (
                          <div key={a.id} className="p-3 bg-white border border-slate-200/80 rounded-xl text-xs space-y-1 shadow-2xs">
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span>{a.label || 'Home'}</span>
                              {a.is_default && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-semibold border border-slate-200">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">{a.address_line}</p>
                            {a.landmark && <p className="text-slate-500 text-[10px]">Near: {a.landmark}</p>}
                            <p className="text-slate-400 text-[10px]">{a.city} - {a.postal_code}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Service Requests */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      Inquiries Placed ({detail.requests?.length || 0})
                    </h3>
                    {!detail.requests || detail.requests.length === 0 ? (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                        No inquiries submitted yet.
                      </div>
                    ) : (
                      <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden max-h-52 overflow-y-auto shadow-2xs">
                        {detail.requests.map((r) => (
                          <div key={r.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50 transition">
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/requests/${r.id}`}
                                  className="font-mono font-bold text-slate-900 hover:text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  {r.reference_number}
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </Link>
                                <span className="text-slate-800 font-medium">{r.service?.name}</span>
                              </div>
                              <p className="text-slate-400 text-[11px] mt-0.5">
                                {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                              {r.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bookings */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      Confirmed Bookings ({detail.bookings?.length || 0})
                    </h3>
                    {!detail.bookings || detail.bookings.length === 0 ? (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                        No bookings confirmed yet.
                      </div>
                    ) : (
                      <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden max-h-52 overflow-y-auto shadow-2xs">
                        {detail.bookings.map((b) => (
                          <div key={b.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50 transition">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900">{b.reference_number}</span>
                                <span className="text-slate-800 font-medium">{b.service_name}</span>
                              </div>
                              <p className="text-slate-500 text-[11px] mt-0.5">
                                Scheduled: {b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString('en-IN') : 'N/A'} • Paid: ₹{b.total_paid}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {b.status.replace(/_/g, ' ')}
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
