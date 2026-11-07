'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Search, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  ChevronRight,
  PlusCircle,
  X,
  Play,
  Check,
  AlertCircle
} from 'lucide-react';
import { Booking } from '../../../types';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';

export default function AdminBookingsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Offline payment modal state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [offlineAmount, setOfflineAmount] = useState('');
  const [offlineType, setOfflineType] = useState('cash');
  const [offlineNotes, setOfflineNotes] = useState('');

  const fetchBookings = () => {
    setLoading(true);
    let url = `/admin/bookings?`;
    if (statusFilter && statusFilter !== 'all') url += `status=${statusFilter}&`;

    apiRequest<{ bookings: Booking[] } | Booking[]>(url)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).bookings || [];
        setBookings(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/login?redirect=/admin/bookings');
      return;
    }
    fetchBookings();
  }, [user, isAdmin, statusFilter]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    if (!confirm(`Update booking status to ${newStatus}?`)) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchBookings();
    } catch (err: any) {
      alert(err.error || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !offlineAmount) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/payments/record_offline`, {
        method: 'POST',
        body: JSON.stringify({
          booking_id: selectedBooking.id,
          amount: parseFloat(offlineAmount),
          offline_type: offlineType,
          notes: offlineNotes,
        }),
      });
      setSelectedBooking(null);
      setOfflineAmount('');
      setOfflineNotes('');
      alert('Offline payment recorded successfully');
      fetchBookings();
    } catch (err: any) {
      alert(err.error || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All Bookings' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'rescheduled', label: 'Rescheduled' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Dispatch & Fulfillment Desk
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Bookings & Revenue Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track confirmed technician appointments, record field cash collections, and manage job completion.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar self-start sm:self-center">
          {filterTabs.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-200/70 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No Bookings Found</h3>
          <p className="text-xs text-slate-500">
            Bookings appear here once a customer creates a fixed-price order.
          </p>
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="mt-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Show All Bookings
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="py-3.5 px-5">Booking Reference</th>
                  <th className="py-3.5 px-5">Service Details</th>
                  <th className="py-3.5 px-5">Scheduled Appointment</th>
                  <th className="py-3.5 px-5">Fulfillment Status</th>
                  <th className="py-3.5 px-5">Financial Settlement</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition group">
                    <td className="py-3.5 px-5">
                      <div className="font-mono font-bold text-slate-900">
                        #{b.id}
                      </div>
                      <span className="font-mono text-[11px] text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200/50 inline-block mt-0.5">
                        {b.reference_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{b.service_name}</div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {b.booking_type || 'Standard Service'}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {b.scheduled_at ? new Date(b.scheduled_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }) : (b.preferred_at ? `Preferred: ${new Date(b.preferred_at).toLocaleDateString('en-IN')}` : 'Awaiting Schedule')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        b.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                          : b.status === 'in_progress'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200/70'
                          : b.status === 'rescheduled'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                          : b.status === 'completed'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          b.status === 'confirmed' ? 'bg-emerald-500' :
                          b.status === 'in_progress' ? 'bg-sky-500 animate-pulse' :
                          b.status === 'rescheduled' ? 'bg-amber-500' :
                          b.status === 'completed' ? 'bg-slate-500' : 'bg-rose-500'
                        }`} />
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">
                        ₹{b.total_paid} <span className="text-slate-400 font-normal">/ ₹{b.payment_amount}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-0.5 ${
                        b.fully_paid ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {b.fully_paid ? '● Fully Settled' : '○ Payment Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Record offline payment button */}
                        {!b.fully_paid && (
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setOfflineAmount(((b.payment_amount || 0) - b.total_paid).toString());
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                            <span>+ Payment</span>
                          </button>
                        )}

                        {/* Status updater */}
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'in_progress')}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-bold rounded-lg transition cursor-pointer"
                          >
                            <Play className="w-3 h-3 text-sky-600 fill-sky-600" />
                            <span>Start Work</span>
                          </button>
                        )}

                        {b.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'completed')}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Complete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Offline Payment Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Field Collection</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Booking #{selectedBooking.id} ({selectedBooking.reference_number})</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Record cash, POS, or direct UPI payment collected by technician for <strong className="text-slate-800">{selectedBooking.service_name}</strong>.
            </p>

            <form onSubmit={handleRecordOfflinePayment} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Amount Collected (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  step="0.01"
                  value={offlineAmount}
                  onChange={(e) => setOfflineAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl outline-none font-bold focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Collection Channel</label>
                <select
                  value={offlineType}
                  onChange={(e) => setOfflineType(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white focus:border-slate-900"
                >
                  <option value="cash">Cash (Collected on-site by technician)</option>
                  <option value="upi_direct">Direct UPI QR Code scan</option>
                  <option value="card_pos">Portable Card POS Machine</option>
                  <option value="cheque">Cheque / Demand Draft</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Receipt Notes / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Received cash by technician, receipt #402"
                  value={offlineNotes}
                  onChange={(e) => setOfflineNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  Confirm & Settle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
