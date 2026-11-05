'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Address } from '../../types';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { GpsButton } from '../../components/ui/GpsButton';
import { LocationData } from '../../contexts/LocationContext';

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
    latitude: 25.4519 as number | null,
    longitude: 81.8340 as number | null,
    is_default: false,
  });

  const handleGpsDetected = (loc: LocationData) => {
    setForm((prev) => ({
      ...prev,
      address_line: loc.address_line,
      landmark: loc.landmark || loc.locality,
      postal_code: loc.postal_code || prev.postal_code,
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
  };

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
        latitude: null,
        longitude: null,
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Saved Addresses
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Service locations in Prayagraj (Allahabad)
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition self-start sm:self-center cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAdd ? 'Cancel' : 'Add Address'}</span>
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Add Service Address</h3>
            <GpsButton onLocationDetected={handleGpsDetected} label="Detect GPS" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Label</label>
              <input
                type="text"
                placeholder="e.g. Home, Office"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">PIN Code</label>
              <input
                type="text"
                required
                placeholder="211001"
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500 block mb-1">Address Line</label>
              <input
                type="text"
                required
                placeholder="Flat / Floor / Street"
                value={form.address_line}
                onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Landmark (Optional)</label>
              <input
                type="text"
                placeholder="Near landmark"
                value={form.landmark}
                onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">City</label>
              <input
                type="text"
                disabled
                value="Prayagraj, Uttar Pradesh"
                className="w-full px-3 py-2 text-xs border border-slate-100 rounded-lg bg-slate-50 text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="rounded border-slate-300 text-slate-900"
              />
              <span>Set as default</span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition cursor-pointer shadow-xs"
            >
              {submitting ? 'Saving…' : 'Save Address'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => <div key={n} className="h-20 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      ) : addresses.length === 0 ? (
        <div className="border border-slate-200 rounded-xl p-12 text-center max-w-sm mx-auto space-y-3">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">No saved addresses</h3>
          <p className="text-xs text-slate-400">Add an address to speed up booking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-900">{addr.label || 'Address'}</span>
                  {addr.is_default && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{addr.full_address}</p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                  title="Delete address"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
