'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Trash2, ArrowLeft, Check } from 'lucide-react';
import { Address } from '../../types';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

export default function AddressesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    label: 'Home',
    address_line: '',
    landmark: '',
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    postal_code: '211001',
    is_default: false,
  });

  const fetchAddresses = () => {
    apiRequest<Address[]>('/addresses')
      .then(setAddresses)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/addresses');
      return;
    }
    fetchAddresses();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest<Address>('/addresses', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowAdd(false);
      setForm({
        label: 'Home',
        address_line: '',
        landmark: '',
        city: 'Prayagraj',
        state: 'Uttar Pradesh',
        postal_code: '211001',
        is_default: false,
      });
      fetchAddresses();
    } catch (err: any) {
      alert(err.error || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this address?')) return;
    try {
      await apiRequest(`/addresses/${id}`, { method: 'DELETE' });
      fetchAddresses();
    } catch (err: any) {
      alert(err.error || 'Failed to delete address');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Saved Service Addresses
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your residential and commercial service locations in Prayagraj (Allahabad)
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAdd ? 'Cancel' : 'Add New Address'}</span>
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Add New Service Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Address Label</label>
              <input
                type="text"
                placeholder="e.g. Home, Office, Villa"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Postal PIN Code</label>
              <input
                type="text"
                required
                placeholder="560103"
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500 block mb-1">Address Line</label>
              <input
                type="text"
                required
                placeholder="Flat / Floor / Society / Main Road"
                value={form.address_line}
                onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Landmark (Optional)</label>
              <input
                type="text"
                placeholder="Opposite Central Mall"
                value={form.landmark}
                onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">City</label>
              <input
                type="text"
                disabled
                value="Prayagraj (Allahabad), Uttar Pradesh"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Set as default service address</span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => <div key={n} className="h-24 bg-slate-200 animate-pulse rounded-2xl" />)}
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <MapPin className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Addresses Saved</h3>
          <p className="text-xs text-slate-500">Add your address to book doorstep services quickly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{addr.label || 'Address'}</span>
                  {addr.is_default && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/50 font-bold px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{addr.full_address}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

