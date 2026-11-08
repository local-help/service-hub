'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Shield, 
  UserPlus, 
  Phone, 
  MessageCircle, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Clock,
  UserCheck,
  X,
  Mail,
  Send,
  Server,
  Building,
  Check,
  User as UserIcon,
  Globe
} from 'lucide-react';
import { User, PlatformSetting } from '../../../types';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';
import { useSupport } from '../../../contexts/SupportContext';
import { useToast } from '../../../contexts/ToastContext';

interface ActivityLog {
  id: number;
  admin_name: string;
  action: string;
  entity_type: string;
  entity_id: number;
  metadata?: any;
  created_at: string;
}

export default function AdminSettingsPage() {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const { refreshSupport } = useSupport();
  const { toast } = useToast();
  const router = useRouter();

  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable settings map
  const [editableValues, setEditableValues] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Invite Admin Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'super_admin'>('admin');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState<{ email: string; tempPass: string } | null>(null);

  // Email Notification Test State (Render Integration)
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress.trim()) return;
    setTestEmailSending(true);
    setTestEmailResult(null);
    try {
      const res = await apiRequest<{ message: string; recipient: string; delivery_info: any }>('/notifications/test_email', {
        method: 'POST',
        body: JSON.stringify({ email: testEmailAddress.trim() }),
      });
      setTestEmailResult({
        success: true,
        message: `Dispatched to ${res.recipient} via ${res.delivery_info?.method?.toUpperCase() || 'SMTP STARTTLS'}!`,
      });
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        message: err.error || 'Failed to dispatch test notification email',
      });
    } finally {
      setTestEmailSending(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        const [settingsData, usersData, logsData] = await Promise.all([
          apiRequest<PlatformSetting[]>('/admin/platform_settings'),
          apiRequest<User[]>('/admin/users'),
          apiRequest<{ activity_logs: ActivityLog[] } | ActivityLog[]>('/admin/activity_logs')
        ]);

        const sList = Array.isArray(settingsData) ? settingsData : [];
        setSettings(sList);
        const map: Record<string, string> = {};
        sList.forEach(s => { map[s.key] = s.value; });
        setEditableValues(map);

        setAdminUsers(Array.isArray(usersData) ? usersData : []);
        setActivityLogs(Array.isArray(logsData) ? logsData : (logsData as any).activity_logs || []);
      } else {
        const logsData = await apiRequest<{ activity_logs: ActivityLog[] } | ActivityLog[]>('/admin/activity_logs');
        setActivityLogs(Array.isArray(logsData) ? logsData : (logsData as any).activity_logs || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/login?redirect=/admin/settings');
      return;
    }
    fetchAll();
  }, [user, isAdmin, isSuperAdmin]);

  const handleSaveSetting = async (key: string) => {
    const val = editableValues[key];
    setSavingKeys(prev => ({ ...prev, [key]: true }));
    setSaveSuccessMessage('');

    try {
      await apiRequest(`/admin/platform_settings/${key}`, {
        method: 'PATCH',
        body: JSON.stringify({ value: val })
      });
      setSaveSuccessMessage(`Setting "${key}" updated successfully!`);
      toast.success(`Setting "${key}" updated successfully!`);
      await refreshSupport();
      setTimeout(() => setSaveSuccessMessage(''), 3000);
    } catch (err: any) {
      toast.error(err.error || `Failed to update ${key}`);
    } finally {
      setSavingKeys(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) {
      setInviteError('Name and email are required');
      return;
    }

    setInviteLoading(true);
    setInviteError('');

    try {
      const res = await apiRequest<{ user: User; temp_password: string }>('/admin/users/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          phone: invitePhone || null,
          role: inviteRole
        })
      });

      setInviteSuccess({
        email: inviteEmail,
        tempPass: res.temp_password
      });

      setInviteEmail('');
      setInviteName('');
      setInvitePhone('');
      fetchAll();
    } catch (err: any) {
      setInviteError(err.error || 'Failed to invite admin');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleToggleAdminStatus = async (targetUser: User) => {
    const nextStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    try {
      await apiRequest(`/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      toast.success(`User status changed to ${nextStatus}`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.error || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Platform & Operational Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure customer helpline numbers, manage admin team authorizations, and inspect audit activity logs
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => {
              setIsInviteOpen(true);
              setInviteSuccess(null);
              setInviteError('');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Admin Member</span>
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-2xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold">Super Admin privileges required for configuration updates</p>
            <p className="text-amber-700 mt-0.5">
              You are signed in as an operational Admin. You can review audit logs below, but only Super Admins can update system settings or invite admin users.
            </p>
          </div>
        </div>
      )}

      {saveSuccessMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center animate-pulse">
          <div className="h-4 w-36 bg-slate-200 rounded mx-auto mb-2" />
          <div className="h-3 w-56 bg-slate-200 rounded mx-auto" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Customer Helpline & Platform Brand */}
          {isSuperAdmin && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-700" />
                  <span>Customer Support Lines & Branding</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct phone (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">tel:</code>) and WhatsApp (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">wa.me</code>) lines surfaced to consumers in Prayagraj.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Helpline Phone Number</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">key: support_phone</span>
                  </div>
                  <input
                    type="text"
                    value={editableValues['support_phone'] || ''}
                    onChange={(e) => setEditableValues({ ...editableValues, support_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-mono focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="+918000000000"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveSetting('support_phone')}
                      disabled={savingKeys['support_phone']}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>{savingKeys['support_phone'] ? 'Saving...' : 'Update Phone'}</span>
                    </button>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                      <span>WhatsApp Support (Intl Format)</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">key: support_whatsapp</span>
                  </div>
                  <input
                    type="text"
                    value={editableValues['support_whatsapp'] || ''}
                    onChange={(e) => setEditableValues({ ...editableValues, support_whatsapp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-mono focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="918000000000"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveSetting('support_whatsapp')}
                      disabled={savingKeys['support_whatsapp']}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>{savingKeys['support_whatsapp'] ? 'Saving...' : 'Update WhatsApp'}</span>
                    </button>
                  </div>
                </div>

                {/* Platform Name */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-600" />
                      <span>Platform Brand Name</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">key: platform_name</span>
                  </div>
                  <input
                    type="text"
                    value={editableValues['platform_name'] || ''}
                    onChange={(e) => setEditableValues({ ...editableValues, platform_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="LocalHelp"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveSetting('platform_name')}
                      disabled={savingKeys['platform_name']}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>{savingKeys['platform_name'] ? 'Saving...' : 'Update Brand'}</span>
                    </button>
                  </div>
                </div>

                {/* Default City */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-600" />
                      <span>Primary Service City</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">key: default_city</span>
                  </div>
                  <input
                    type="text"
                    value={editableValues['default_city'] || ''}
                    onChange={(e) => setEditableValues({ ...editableValues, default_city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="Prayagraj"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveSetting('default_city')}
                      disabled={savingKeys['default_city']}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>{savingKeys['default_city'] ? 'Saving...' : 'Update City'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Admin Team & Roles */}
          {isSuperAdmin && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Admin Team & Role Provisioning</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorized operations personnel. Access is strictly whitelist-based.
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Admin Member</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Joined</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminUsers.map((adm) => (
                      <tr key={adm.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                              {adm.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{adm.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{adm.email || adm.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            adm.role === 'super_admin'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            {adm.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            adm.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {adm.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(adm.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {adm.id !== user?.id && (
                            <button
                              onClick={() => handleToggleAdminStatus(adm)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                adm.status === 'active'
                                  ? 'text-rose-700 hover:bg-rose-50 border border-rose-200'
                                  : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                              }`}
                            >
                              {adm.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 3: Email & Notification Delivery */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-700" />
                  <span>Transactional Notifications (Render SMTP)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transactional customer emails (quotations, booking confirmation, status alerts) dispatched from Render.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[11px] font-semibold self-start sm:self-auto">
                <Server className="w-3 h-3 text-slate-600" />
                Render Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Test Email Dispatch Card */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Send Test Notification Email
                </span>
                <p className="text-xs text-slate-500">
                  Verify SMTP (Port 587 STARTTLS) delivery from your environment directly to your inbox.
                </p>

                {testEmailResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      testEmailResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {testEmailResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testEmailResult.message}</span>
                  </div>
                )}

                <form onSubmit={handleSendTestEmail} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="your-email@example.com"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={testEmailSending || !testEmailAddress.trim()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testEmailSending ? 'Sending…' : 'Send Test'}</span>
                  </button>
                </form>
              </div>

              {/* Render Deployment Checklist */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Render Deployment Variables
                </span>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li>
                    <code className="text-[11px] bg-white px-1 py-0.5 rounded text-slate-800 font-mono border border-slate-200">RESEND_API_KEY</code>: Resend API token or SMTP password.
                  </li>
                  <li>
                    <code className="text-[11px] bg-white px-1 py-0.5 rounded text-slate-800 font-mono border border-slate-200">EMAIL_FROM</code>: Verified sender (e.g. notifications@localhelp.in).
                  </li>
                  <li>
                    <code className="text-[11px] bg-white px-1 py-0.5 rounded text-slate-800 font-mono border border-slate-200">SMTP_PORT</code>: Port 587 with STARTTLS (Port 25 blocked by Render).
                  </li>
                  <li>
                    <code className="text-[11px] bg-white px-1 py-0.5 rounded text-slate-800 font-mono border border-slate-200">APP_HOST</code>: Hostname used in booking verification links.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4: Operational Activity Audit Trail */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-700" />
                <span>Operational Activity & Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of provider assignments, price determinations, status updates, and payment collections.
              </p>
            </div>

            {activityLogs.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No recent activity recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                {activityLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50/70 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{log.admin_name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {log.action}
                        </span>
                        <span className="text-slate-600">
                          on {log.entity_type} #{log.entity_id}
                        </span>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {JSON.stringify(log.metadata)}
                        </p>
                      )}
                    </div>
                    <span className="text-slate-400 text-[11px] whitespace-nowrap ml-4 font-mono">
                      {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Invite Admin Member */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Invite Admin Team Member</h2>
                <p className="text-xs text-slate-500">Grant operations or super admin dashboard access</p>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="p-6 space-y-4">
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs">
                  <p className="font-bold flex items-center gap-1.5 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Admin Provisioned Successfully!
                  </p>
                  <p className="mt-1">An account was created for <strong>{inviteSuccess.email}</strong>.</p>
                  <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-300">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Temporary Password:</p>
                    <p className="font-mono font-bold text-base text-slate-900 select-all">{inviteSuccess.tempPass}</p>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-2">
                    Share these temporary credentials with the admin member. They will be prompted to reset upon first login.
                  </p>
                </div>
                <button
                  onClick={() => setIsInviteOpen(false)}
                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleInviteAdmin} className="p-5 space-y-3.5">
                {inviteError && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priyanshu Sharma"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@localhelp.in"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Administrative Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="admin">Admin (Operational dispatch & bookings)</option>
                    <option value="super_admin">Super Admin (Full configuration access)</option>
                  </select>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
                  >
                    {inviteLoading ? 'Inviting...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
