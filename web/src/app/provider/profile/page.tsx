'use client';

import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Save, 
  Plus, 
  AlertCircle, 
  Check, 
  UserPlus
} from 'lucide-react';
import { apiRequest } from '../../../api/client';
import { Provider, ProviderUser } from '../../../types';

export default function ProviderProfilePage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [team, setTeam] = useState<ProviderUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [description, setDescription] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [serviceArea, setServiceArea] = useState('');

  // Team Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'staff'>('staff');
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [pRes, tRes] = await Promise.all([
        apiRequest<Provider>('/provider/profile'),
        apiRequest<ProviderUser[]>('/provider/profile/team'),
      ]);
      setProvider(pRes);
      setTeam(tRes);

      setDescription(pRes.description || pRes.notes || '');
      setContactPerson(pRes.contact_person || '');
      setContactPhone(pRes.contact_phone || pRes.phone || '');
      setContactEmail(pRes.contact_email || pRes.email || '');
      setBusinessAddress(pRes.business_address || pRes.address || '');
      setServiceArea(pRes.service_area || '');
      setError(null);
    } catch (err: any) {
      setError(err.error || 'Failed to load organisation profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccess(false);
      await apiRequest('/provider/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          description,
          contact_person: contactPerson,
          contact_phone: contactPhone,
          contact_email: contactEmail,
          business_address: businessAddress,
          service_area: serviceArea,
        }),
      });
      setSuccess(true);
      await fetchProfile();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setInviteLoading(true);
      await apiRequest('/provider/profile/team', {
        method: 'POST',
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          phone: invitePhone,
          role: inviteRole,
        }),
      });
      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      setInvitePhone('');
      await fetchProfile();
    } catch (err: any) {
      alert(err.error || 'Failed to add team member');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <AlertCircle className="w-5 h-5 mb-1" />
        <p className="text-sm">{error || 'Could not load profile'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Top Organization Header */}
      <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#242D2B]">{provider.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {provider.verification_status || 'Verified'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered Service Provider • Prayagraj (Allahabad), Uttar Pradesh
          </p>
        </div>

        <div className="text-xs text-slate-500 text-left sm:text-right">
          <span>Operational Status:</span>
          <strong className="block text-slate-800 uppercase font-semibold mt-0.5">
            {provider.operational_status || 'Active'}
          </strong>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs space-y-5">
        <h3 className="font-bold text-sm text-[#242D2B] flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="w-4 h-4 text-[#176B65]" />
          Business Details & Contact Info
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Person *
            </label>
            <input
              type="text"
              required
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Phone *
            </label>
            <input
              type="tel"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Service Area / Localities
            </label>
            <input
              type="text"
              placeholder="e.g. Civil Lines, Katra, Ashok Nagar, Georgetown"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Physical Business / Workshop Address
          </label>
          <input
            type="text"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Business Description & Capabilities
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#176B65] text-white rounded-xl text-xs font-bold hover:bg-[#12534E] transition disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Update Details'}</span>
          </button>
        </div>
      </form>

      {/* Authorised Team Members */}
      <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#242D2B] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#176B65]" />
              Team Members & Login Accounts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Staff members authorised to access this provider workspace
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {team.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-slate-800 block">{m.name}</span>
                <span className="text-[11px] text-slate-500">
                  {m.email || m.phone} • Role: <strong className="uppercase">{m.role}</strong>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Add Authorised Team Member
            </h3>
            <p className="text-xs text-slate-500">
              Create credentials for an operator or manager in your organisation.
            </p>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Amit Kumar"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="operator@localhelp.com"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="+9198XXXXXXXX"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
                >
                  <option value="staff">Staff (View & fulfill requests)</option>
                  <option value="manager">Manager (Manage services & schedule)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#176B65] text-white hover:bg-[#12534E] disabled:opacity-50"
                >
                  {inviteLoading ? 'Creating...' : 'Add Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
