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
  Server
} from 'lucide-react';
import { User, PlatformSetting } from '../../../types';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';
import { useSupport } from '../../../contexts/SupportContext';

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
        message: `Email dispatched to ${res.recipient} via ${res.delivery_info?.method?.toUpperCase() || 'SMTP'}!`,
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
        // Normal admin can view logs
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
      await refreshSupport();
      setTimeout(() => setSaveSuccessMessage(''), 3000);
    } catch (err: any) {
      alert(err.error || `Failed to update ${key}`);
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
      fetchAll();
    } catch (err: any) {
      alert(err.error || 'Failed to update user status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Platform & Team Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure contact lines (Phone, WhatsApp), manage admin team accounts, and inspect operational activity logs.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => {
              setIsInviteOpen(true);
              setInviteSuccess(null);
              setInviteError('');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition"
          >
            <UserPlus className="w-5 h-5" />
            Invite Admin Member
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl mb-6 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold">Super Admin privileges required for configuration updates</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You are signed in as an operational Admin. You can review audit logs below, but only Super Admins can update system settings or invite admin users.
            </p>
          </div>
        </div>
      )}

      {saveSuccessMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl mb-6 flex items-center gap-2 text-sm font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {saveSuccessMessage}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Loading platform settings and admin team...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Customer Support Contact Numbers (Super Admin) */}
          {isSuperAdmin && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Customer Support Contact Configurations
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                These numbers power the customer-facing "Call Support" (<code className="bg-slate-100 px-1 py-0.5 rounded">tel:</code>) and "WhatsApp Us" (<code className="bg-slate-100 px-1 py-0.5 rounded">wa.me</code>) buttons across web and mobile.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      Support Phone Number
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">key: support_phone</span>
                  </div>
                  <input
                    type="text"
                    value={editableValues['support_phone'] || ''}
                    onChange={(e) => setEditableValues({ ...editableValues, support_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono"
                    placeholder="+918000000000"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveSetting('support_phone')}
                      disabled={savingKeys['support_phone']}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingKeys['support_phone'] ? 'Saving...' : 'Update Phone'}
                    </button>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      WhatsApp Helpline (Full Intl digits)
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">key: support_whatsapp</span>
                  </div>
                  <input
                    type="text"
                    value={editableValues['support_whatsapp'] || ''}
                    onChange={(e) => setEditableValues({ ...editableValues, support_whatsapp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono"
                    placeholder="918000000000"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveSetting('support_whatsapp')}
                      disabled={savingKeys['support_whatsapp']}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingKeys['support_whatsapp'] ? 'Saving...' : 'Update WhatsApp'}
                    </button>
                  </div>
                </div>

                {/* Platform Name */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Platform Brand Name
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">key: platform_name</span>
                  </div>
                  <input
                    type="text"
                    value={editableValues['platform_name'] || ''}
                    onChange={(e) => setEditableValues({ ...editableValues, platform_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    placeholder="LocalHelp"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveSetting('platform_name')}
                      disabled={savingKeys['platform_name']}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingKeys['platform_name'] ? 'Saving...' : 'Update Brand'}
                    </button>
                  </div>
                </div>

                {/* City */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Default Service City
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">key: default_city</span>
                  </div>
                  <input
                    type="text"
                    value={editableValues['default_city'] || ''}
                    onChange={(e) => setEditableValues({ ...editableValues, default_city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    placeholder="Prayagraj"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveSetting('default_city')}
                      disabled={savingKeys['default_city']}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingKeys['default_city'] ? 'Saving...' : 'Update City'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Admin Team Management (Super Admin) */}
          {isSuperAdmin && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Admin Team & Role Provisioning
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Only explicitly invited admins can access the coordination dashboard. Domain matching is never used for security.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase">
                      <th className="pb-3 font-semibold">Admin User</th>
                      <th className="pb-3 font-semibold">Role</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Joined</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminUsers.map((adm) => (
                      <tr key={adm.id} className="hover:bg-slate-50">
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-900">{adm.name}</p>
                          <p className="text-xs text-slate-500">{adm.email || adm.phone}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            adm.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {adm.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            adm.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {adm.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-500">
                          {new Date(adm.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          {adm.id !== user?.id && (
                            <button
                              onClick={() => handleToggleAdminStatus(adm)}
                              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                                adm.status === 'active'
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
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

          {/* Section: Email & Notification Delivery (Render Integration) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-teal-700" />
                  Email & Notification Delivery (Render Integration)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transactional customer emails (booking confirmation, status updates, cancellations, welcome) dispatched via Render.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-medium">
                <Server className="w-3.5 h-3.5 text-teal-600" />
                Render Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Test Email Dispatch Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Send Test Notification Email
                </span>
                <p className="text-xs text-slate-500">
                  Verify SMTP (Port 587) or Resend API delivery from your Render environment directly to your inbox.
                </p>

                {testEmailResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
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
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={testEmailSending || !testEmailAddress.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-medium transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testEmailSending ? 'Sending…' : 'Send Test'}</span>
                  </button>
                </form>
              </div>

              {/* Render Deployment Checklist */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Render Deployment Environment Variables
                </span>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li>
                    <code className="text-[11px] bg-slate-200/70 px-1 py-0.5 rounded text-slate-800 font-mono">RESEND_API_KEY</code>: Resend API token (works over Port 587 SMTP or Port 443 HTTPS).
                  </li>
                  <li>
                    <code className="text-[11px] bg-slate-200/70 px-1 py-0.5 rounded text-slate-800 font-mono">EMAIL_FROM</code>: Verified sender email (e.g. <span className="font-mono">LocalHelp &lt;notifications@yourdomain.com&gt;</span>).
                  </li>
                  <li>
                    <code className="text-[11px] bg-slate-200/70 px-1 py-0.5 rounded text-slate-800 font-mono">SMTP_PORT</code>: Port 587 with STARTTLS (Render blocks standard port 25).
                  </li>
                  <li>
                    <code className="text-[11px] bg-slate-200/70 px-1 py-0.5 rounded text-slate-800 font-mono">APP_HOST</code>: Hostname used in links (auto-filled on Render).
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Operational Audit Activity Logs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Recent Admin Activity & Audit Trail
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Immutable log of provider assignments, quote creations, status updates, and offline payment entries.
            </p>

            {activityLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No recent activity recorded.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                {activityLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{log.admin_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-slate-100 text-slate-700">
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
                    <span className="text-slate-400 text-[11px] whitespace-nowrap ml-4">
                      {new Date(log.created_at).toLocaleString()}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Invite Admin Team Member</h2>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="p-6 space-y-4">
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-sm">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Admin Invited Successfully!
                  </p>
                  <p className="text-xs mt-1">An account was provisioned for {inviteSuccess.email}.</p>
                  <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-300">
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Temporary Password:</p>
                    <p className="font-mono font-bold text-base text-slate-900 select-all">{inviteSuccess.tempPass}</p>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-2">
                    Share these temporary credentials with the team member. They can change their password upon sign in.
                  </p>
                </div>
                <button
                  onClick={() => setIsInviteOpen(false)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleInviteAdmin} className="p-5 space-y-4">
                {inviteError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priyanshu Sharma"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@localhelp.in"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admin">Admin (Operational coordination)</option>
                    <option value="super_admin">Super Admin (Full configuration access)</option>
                  </select>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
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

