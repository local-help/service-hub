'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Search,
  Download,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Ban,
  Filter,
  ArrowUpDown,
  FileCheck,
  Building,
  User,
  Calendar,
  X
} from 'lucide-react';
import { PaymentReceipt } from '../../../types';
import { apiRequest, downloadFile } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';

export default function AdminPaymentsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Snapshot modal state
  const [viewingReceipt, setViewingReceipt] = useState<PaymentReceipt | null>(null);
  const [showJsonRaw, setShowJsonRaw] = useState(false);

  // Void modal state
  const [voidingReceipt, setVoidingReceipt] = useState<PaymentReceipt | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidLoading, setVoidLoading] = useState(false);

  const fetchReceipts = () => {
    setLoading(true);
    let url = `/admin/payment_receipts?`;
    if (searchTerm.trim()) url += `search=${encodeURIComponent(searchTerm.trim())}&`;
    if (statusFilter !== 'all') url += `status=${statusFilter}&`;

    apiRequest<PaymentReceipt[]>(url)
      .then((data) => {
        setReceipts(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/login?redirect=/admin/payments');
      return;
    }
    fetchReceipts();
  }, [user, isAdmin, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReceipts();
  };

  const handleDownload = async (receipt: PaymentReceipt) => {
    setDownloadingId(receipt.id);
    try {
      await downloadFile(
        `/admin/payment_receipts/${receipt.id}/download`,
        `LocalHelp_Receipt_${receipt.receipt_number}.pdf`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to download receipt');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingReceipt) return;
    setVoidLoading(true);
    try {
      await apiRequest(`/admin/payment_receipts/${voidingReceipt.id}/void`, {
        method: 'POST',
        body: JSON.stringify({ reason: voidReason.trim() || 'Voided by administrative decision' }),
      });
      setVoidingReceipt(null);
      setVoidReason('');
      fetchReceipts();
    } catch (err: any) {
      alert(err.error || 'Failed to void receipt');
    } finally {
      setVoidLoading(false);
    }
  };

  const issuedCount = receipts.filter((r) => r.status === 'issued').length;
  const voidedCount = receipts.filter((r) => r.status === 'voided').length;
  const totalVolume = receipts
    .filter((r) => r.status === 'issued')
    .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
  const emailedCount = receipts.filter((r) => r.emailed_at).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-100 font-semibold uppercase tracking-wider">
              Financial Records
            </span>
            <span className="text-xs text-slate-400 font-mono">Centralized Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Payment Receipts & Auditing</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable transaction snapshots, customer-facing PDF receipts, and compliance ledger
          </p>
        </div>

        <button
          onClick={fetchReceipts}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Total Active Volume
          </span>
          <div className="text-2xl font-bold text-teal-700 mt-1">₹{totalVolume.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-500">{issuedCount} valid issued receipts</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Issued Receipts
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{issuedCount}</div>
          <span className="text-[11px] text-emerald-600 font-medium">100% immutable snapshots</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Emailed to Customers
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{emailedCount}</div>
          <span className="text-[11px] text-slate-500">Delivered via background jobs</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Voided / Audit Disputed
          </span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{voidedCount}</div>
          <span className="text-[11px] text-slate-500">Explicit void audit trail</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search receipt number (LH-REC-...), booking reference, txn reference or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-teal-600 bg-slate-50/50 text-slate-900"
            />
          </form>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
            {['all', 'issued', 'voided'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
            Loading receipt ledger...
          </div>
        ) : receipts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No payment receipts found</p>
            <p className="text-[11px] text-slate-400">
              Receipts are automatically generated when customer payments are verified or recorded.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Receipt Info</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((rcpt) => (
                  <tr key={rcpt.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{rcpt.receipt_number}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(rcpt.generated_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                      {rcpt.payment_reference && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Ref: {rcpt.payment_reference}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{rcpt.customer_name || 'Customer'}</div>
                      <div className="text-[11px] text-slate-500">{rcpt.receipt_data?.customer?.email || '—'}</div>
                      <div className="text-[10px] text-slate-400">{rcpt.receipt_data?.customer?.phone || '—'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{rcpt.service_name || 'Service'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Booking: {rcpt.receipt_data?.booking?.reference_number || `#${rcpt.booking_id}`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Partner: {rcpt.receipt_data?.service?.provider_name || 'Assigned Local Partner'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-teal-800 text-sm">
                        ₹{Number(rcpt.total_amount).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-500 capitalize">
                        {rcpt.payment_method || 'Online'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {rcpt.emailed_at ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Emailed</span>
                          </span>
                          <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                            {rcpt.last_emailed_to}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Not sent yet</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {rcpt.status === 'issued' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                          Issued
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px]" title={rcpt.void_reason || 'Voided'}>
                          Voided
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownload(rcpt)}
                          disabled={downloadingId === rcpt.id}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                          title="Download Receipt PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-teal-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setViewingReceipt(rcpt)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                          title="Inspect Immutable Snapshot"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                        </button>

                        {rcpt.status === 'issued' && (
                          <button
                            type="button"
                            onClick={() => setVoidingReceipt(rcpt)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                            title="Void Receipt"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snapshot Inspection Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Receipt Snapshot</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-mono font-semibold text-slate-700">
                    {viewingReceipt.receipt_number}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Immutable record captured at payment verification. Silently editing issued snapshots is prohibited.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {showJsonRaw ? 'Raw JSONB Snapshot' : 'Structured Overview'}
              </span>
              <button
                type="button"
                onClick={() => setShowJsonRaw(!showJsonRaw)}
                className="text-xs text-teal-700 hover:text-teal-800 font-medium underline cursor-pointer"
              >
                {showJsonRaw ? 'View Structured' : 'View Raw JSON'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {showJsonRaw ? (
                <pre className="p-3 bg-slate-900 text-teal-300 rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto">
                  {JSON.stringify(viewingReceipt.receipt_data, null, 2)}
                </pre>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Customer</span>
                      <p className="font-semibold text-slate-900">{viewingReceipt.customer_name}</p>
                      <p className="text-slate-500 text-[11px]">{viewingReceipt.receipt_data?.customer?.email}</p>
                      <p className="text-slate-500 text-[11px]">{viewingReceipt.receipt_data?.customer?.phone}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Booking & Provider</span>
                      <p className="font-semibold text-slate-900">{viewingReceipt.service_name}</p>
                      <p className="text-slate-500 text-[11px]">
                        Ref: {viewingReceipt.receipt_data?.booking?.reference_number}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Provider: {viewingReceipt.receipt_data?.service?.provider_name}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Itemized Breakdown</span>
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Selected Package:</span>
                        <span>₹{viewingReceipt.receipt_data?.breakdown?.package_price || 0}</span>
                      </div>
                      {viewingReceipt.receipt_data?.service?.addons?.map((add: any, i: number) => (
                        <div key={i} className="flex justify-between text-slate-600">
                          <span>Add-on: {add.name}</span>
                          <span>₹{add.price}</span>
                        </div>
                      ))}
                      {(viewingReceipt.receipt_data?.breakdown?.platform_fee || 0) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Platform Facilitation Fee:</span>
                          <span>₹{viewingReceipt.receipt_data.breakdown.platform_fee}</span>
                        </div>
                      )}
                      <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900">
                        <span>Total Amount Paid:</span>
                        <span className="text-teal-700">₹{viewingReceipt.total_amount}</span>
                      </div>
                    </div>
                  </div>

                  {viewingReceipt.void_reason && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs space-y-1">
                      <span className="text-rose-800 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Receipt Voided</span>
                      </span>
                      <p className="text-rose-700 text-[11px]">Reason: {viewingReceipt.void_reason}</p>
                      {viewingReceipt.voided_at && (
                        <p className="text-rose-500 text-[10px]">
                          Voided at: {new Date(viewingReceipt.voided_at).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Storage Key: {viewingReceipt.receipt_data?.storage_key || 'storage/receipts/...'}
              </span>
              <button
                type="button"
                onClick={() => handleDownload(viewingReceipt)}
                className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {voidingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Void Receipt</h3>
                  <p className="text-xs text-slate-500 font-mono">{voidingReceipt.receipt_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVoidingReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Voiding this receipt records an immutable administrative audit log and marks the receipt as cancelled. The snapshot remains preserved for regulatory compliance.
            </p>

            <form onSubmit={handleConfirmVoid} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for Voiding <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g. Customer requested full booking refund; payment disputed or chargeback received..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-900 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidingReceipt(null)}
                  className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={voidLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {voidLoading ? 'Voiding...' : 'Confirm Void'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

