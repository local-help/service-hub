'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Search, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  DollarSign 
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
            Deliveries & Payments
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Bookings & Revenue Operations
          </h1>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-center">
          {['all', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                statusFilter === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => <div key={n} className="h-24 bg-slate-200 animate-pulse rounded-2xl" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Bookings Found</h3>
          <p className="text-xs text-slate-500">Bookings appear once customer approves a quotation or selects fixed-price.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Booking ID</th>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Scheduled Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    #{b.id} <span className="text-[11px] text-blue-600 block">({b.reference_number})</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {b.service_name}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {new Date(b.scheduled_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      ₹{b.total_paid} / ₹{b.payment_amount}
                    </div>
                    <span className={`text-[10px] font-bold ${b.fully_paid ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {b.fully_paid ? 'Fully Paid' : 'Pending Payment'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {/* Record offline payment button */}
                    {!b.fully_paid && (
                      <button
                        onClick={() => {
                          setSelectedBooking(b);
                          setOfflineAmount(((b.payment_amount || 0) - b.total_paid).toString());
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        + Offline Payment
                      </button>
                    )}

                    {/* Status updater */}
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'in_progress')}
                        disabled={actionLoading}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        Start Work
                      </button>
                    )}

                    {b.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'completed')}
                        disabled={actionLoading}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        Mark Completed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Offline Payment Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Record Offline Payment</h3>
            <p className="text-xs text-slate-500">
              Record cash, POS, or direct UPI collected by specialist for Booking #{selectedBooking.id} ({selectedBooking.service_name}).
            </p>

            <form onSubmit={handleRecordOfflinePayment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Amount Collected (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  step="0.01"
                  value={offlineAmount}
                  onChange={(e) => setOfflineAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={offlineType}
                  onChange={(e) => setOfflineType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                >
                  <option value="cash">Cash (Collected on-site)</option>
                  <option value="upi_direct">Direct UPI QR Code</option>
                  <option value="card_pos">Card POS Swipe</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Received cash by technician Arun"
                  value={offlineNotes}
                  onChange={(e) => setOfflineNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

