'use client';

import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Check, 
  Save, 
  AlertCircle, 
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { apiRequest } from '../../../api/client';
import { ProviderAvailability } from '../../../types';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];

export default function ProviderAvailabilityPage() {
  const [availability, setAvailability] = useState<ProviderAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [isAvailable, setIsAvailable] = useState(true);
  const [operatingDays, setOperatingDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');
  const [tempReason, setTempReason] = useState('');

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<ProviderAvailability>('/provider/availability');
      setAvailability(res);
      setIsAvailable(res.is_available);
      setOperatingDays(res.operating_days || []);
      setStartTime(res.working_hours_start || '08:00');
      setEndTime(res.working_hours_end || '20:00');
      setTempStart(res.temporary_unavailability_start ? res.temporary_unavailability_start.substring(0, 16) : '');
      setTempEnd(res.temporary_unavailability_end ? res.temporary_unavailability_end.substring(0, 16) : '');
      setTempReason(res.unavailability_reason || '');
      setError(null);
    } catch (err: any) {
      setError(err.error || 'Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const toggleDay = (day: string) => {
    if (operatingDays.includes(day)) {
      setOperatingDays(operatingDays.filter((d) => d !== day));
    } else {
      setOperatingDays([...operatingDays, day]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccess(false);
      await apiRequest('/provider/availability', {
        method: 'PATCH',
        body: JSON.stringify({
          is_available: isAvailable,
          operating_days: operatingDays,
          working_hours_start: startTime,
          working_hours_end: endTime,
          temporary_unavailability_start: tempStart ? new Date(tempStart).toISOString() : null,
          temporary_unavailability_end: tempEnd ? new Date(tempEnd).toISOString() : null,
          unavailability_reason: tempReason || null,
        }),
      });
      setSuccess(true);
      await fetchAvailability();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.error || 'Failed to save availability');
    } finally {
      setSaving(false);
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

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#242D2B]">Operating Schedule & Availability</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure working hours and days when your teams are available to service customers in Prayagraj
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Availability schedule updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Master Availability Toggle */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#242D2B]">Accepting Service Requests</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Toggle off if you want to temporarily suspend receiving new assignments
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAvailable(!isAvailable)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              isAvailable
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {isAvailable ? 'Active & Open' : 'Paused / Offline'}
          </button>
        </div>

        {/* Operating Days */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#242D2B] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#176B65]" />
            Operating Days in Prayagraj
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DAYS_OF_WEEK.map((day) => {
              const checked = operatingDays.includes(day.id);
              return (
                <button
                  type="button"
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                    checked
                      ? 'bg-[#176B65] text-white border-[#176B65] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Shift Hours */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#242D2B] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#176B65]" />
            Daily Operating Hours
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shift Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shift End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
              />
            </div>
          </div>
        </div>

        {/* Temporary Vacation / Maintenance Window */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#242D2B]">
            Temporary Scheduled Downtime (Optional)
          </h3>
          <p className="text-xs text-slate-500">
            Set dates when your team is temporarily on leave or doing vehicle/equipment maintenance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                From Date & Time
              </label>
              <input
                type="datetime-local"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                To Date & Time
              </label>
              <input
                type="datetime-local"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for temporary unavailability
            </label>
            <input
              type="text"
              placeholder="e.g. Workshop maintenance, Festival holiday"
              value={tempReason}
              onChange={(e) => setTempReason(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#176B65] text-white rounded-xl text-xs font-bold hover:bg-[#12534E] transition disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Availability Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
