'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Phone,
  Calendar,
  FileText
} from 'lucide-react';
import { apiRequest } from '../../../api/client';
import { ProviderAssignment } from '../../../types';

export default function ProviderRequestsPage() {
  const [assignments, setAssignments] = useState<ProviderAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab === 'pending') {
        params.append('status', 'assigned');
      } else if (activeTab === 'active') {
        params.append('status', 'accepted,in_progress');
      } else if (activeTab === 'completed') {
        params.append('status', 'completed');
      } else if (activeTab === 'rejected') {
        params.append('status', 'rejected,cancelled');
      }

      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }

      const res = await apiRequest<ProviderAssignment[]>(`/provider/requests?${params.toString()}`);
      setAssignments(res);
      setError(null);
    } catch (err: any) {
      setError(err.error || 'Failed to load assigned requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssignments();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Needs Response</span>;
      case 'accepted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Accepted</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">In Progress</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      case 'reassigned':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">Reassigned</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#242D2B]">Assigned Service Requests</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming bookings, submit quotations and report service completion
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search ref #, customer, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B65] focus:border-transparent shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E7E2D8] pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Jobs' },
          { id: 'pending', label: 'Needs Acceptance' },
          { id: 'active', label: 'Accepted & Active' },
          { id: 'completed', label: 'Completed' },
          { id: 'rejected', label: 'Rejected / Past' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#176B65] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-5 h-5" />
            <span>Could not load requests</span>
          </div>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-semibold text-slate-700">No requests found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            There are no requests matching the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const req = assignment.service_request;
            if (!req) return null;

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-2xl border border-[#E7E2D8] p-5 hover:border-[#176B65] hover:shadow-xs transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800">
                        {req.reference_number}
                      </span>
                      {getStatusBadge(assignment.status)}
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        Assigned on {new Date(assignment.assigned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#242D2B]">
                      {req.service_name}
                      {req.service_variant_name && (
                        <span className="text-[#176B65] font-semibold text-sm ml-2">
                          • {req.service_variant_name}
                        </span>
                      )}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {req.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-700">Customer:</span>
                        <span>{req.customer_name}</span>
                        {req.customer_phone && (
                          <span className="text-slate-400">({req.customer_phone})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{req.address?.formatted || req.address?.city || 'Prayagraj'}</span>
                      </div>
                    </div>

                    {assignment.rejection_reason && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                        <strong>Rejection Reason:</strong> {assignment.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Actions & Quotation column */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {req.active_quotation ? (
                      <div className="text-left lg:text-right">
                        <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Quotation Sent</span>
                        <strong className="text-base text-[#176B65]">₹{req.active_quotation.amount}</strong>
                        <span className="text-xs text-slate-500 block">Status: {req.active_quotation.status}</span>
                      </div>
                    ) : req.pricing_type === 'fixed_price' && req.fixed_price ? (
                      <div className="text-left lg:text-right">
                        <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Standard Price</span>
                        <strong className="text-base text-[#242D2B]">₹{req.fixed_price}</strong>
                      </div>
                    ) : (
                      <div className="text-left lg:text-right">
                        <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                          Quote Required
                        </span>
                      </div>
                    )}

                    <Link
                      href={`/provider/requests/${assignment.id}`}
                      className="w-full sm:w-auto px-4 py-2 bg-[#176B65] text-white hover:bg-[#12534E] text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Manage Job</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
