'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ClipboardList,
  Calendar,
  LogOut,
  ArrowLeft,
  Camera,
  X,
  Upload,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../api/client';

export default function ProfilePage() {
  const { user, loading, updateProfile, changePassword, logout } = useAuth();
  const router = useRouter();

  // Profile Edit State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showAvatarInput, setShowAvatarInput] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync user state into local form fields
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/profile');
      return;
    }

    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user, loading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!name.trim()) {
      setProfileError('Full name cannot be blank');
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setProfileError('Please provide either an email or a phone number');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        avatar_url: avatarUrl.trim() || null,
      });
      setProfileSuccess('Profile details saved successfully');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.error || 'Failed to update profile details');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setProfileError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiRequest<{ file_url: string }>('/uploads', {
        method: 'POST',
        body: formData,
      });

      setAvatarUrl(res.file_url);
      setProfileSuccess('Photo uploaded from device. Remember to click "Save Profile Details" below.');
      setTimeout(() => setProfileSuccess(null), 5000);
    } catch (err: any) {
      setProfileError(err.error || 'Failed to upload photo from device');
    } finally {
      setUploadingAvatar(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    if (user?.has_password && !currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await changePassword({
        current_password: user?.has_password ? currentPassword : undefined,
        new_password: newPassword,
      });
      setPasswordSuccess(res.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err.error || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
        <div className="h-40 bg-slate-100 rounded-xl"></div>
        <div className="h-64 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  if (!user) return null;

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    })
    : 'Recent';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb */}
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
              My Profile
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your personal information, contact credentials, and security settings
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition self-start sm:self-center cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* User Header Summary Card */}
      <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar display */}
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-xs"
                onError={() => setAvatarUrl('')}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-semibold text-xl flex items-center justify-center shadow-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowAvatarInput(!showAvatarInput)}
              className="absolute -bottom-1 -right-1 p-1.5 bg-white border border-slate-200 hover:border-slate-400 text-slate-600 rounded-full shadow-xs cursor-pointer transition"
              title="Change avatar picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{user.name}</h2>
              <span className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user.email || user.phone}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Member since {memberSince} • Prayagraj, UP
            </p>
          </div>
        </div>

        {/* Quick verification badge */}
        <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Active Account
          </span>
          {user.phone && (
            <span className="text-[11px] text-slate-500">
              Phone: {user.phone}
            </span>
          )}
        </div>
      </div>

      {/* Avatar Photo Edit Tray */}
      {showAvatarInput && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-800">
              Update Profile Photo
            </label>
            <button
              type="button"
              onClick={() => setShowAvatarInput(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              ref={avatarFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarDeviceUpload}
              className="hidden"
              id="avatar-device-upload"
            />
            <label
              htmlFor="avatar-device-upload"
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition cursor-pointer shadow-xs ${
                uploadingAvatar ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              {uploadingAvatar ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload from device</span>
                </>
              )}
            </label>

            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
              >
                Remove Photo
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1">Or paste a photo URL:</span>
            <input
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-slate-400 text-slate-900 bg-white"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Click "Save Profile Details" below after uploading or selecting your photo.
          </p>
        </div>
      )}

      {/* Section 1: Edit Profile Form */}
      <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Personal & Contact Details
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Keep your contact information up to date for booking confirmations and technician coordination
          </p>
        </div>

        {profileSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Amit Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition text-slate-900"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Email Address
                </label>
                {user.email_verified && (
                  <span className="text-[10px] text-emerald-600 font-medium">Verified</span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition text-slate-900"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Phone Number
                </label>
                {user.phone_verified && (
                  <span className="text-[10px] text-emerald-600 font-medium">Verified</span>
                )}
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Details'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Security & Password */}
      <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {user.has_password ? 'Security & Password' : 'Set Account Password'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {user.has_password
              ? 'Update your account password regularly to keep your bookings secure'
              : 'You signed in via phone passcode. Set a password below to allow email or direct password login.'}
          </p>
        </div>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {user.has_password && (
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showCurrentPassword ? 'Hide password' : 'View password'}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showNewPassword ? 'Hide password' : 'View password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'View password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer"
            >
              {savingPassword
                ? 'Updating...'
                : user.has_password
                  ? 'Update Password'
                  : 'Set Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: Account Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/addresses"
          className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-2 w-fit rounded-lg bg-slate-50 text-slate-700 mb-2 group-hover:bg-slate-100 transition">
              <MapPin className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-slate-900">Saved Addresses</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Service addresses in Prayagraj
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-900 mt-3 block">
            Manage Addresses →
          </span>
        </Link>

        <Link
          href="/requests"
          className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-2 w-fit rounded-lg bg-slate-50 text-slate-700 mb-2 group-hover:bg-slate-100 transition">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-slate-900">Service Requests</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Track custom quotes & repairs
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-900 mt-3 block">
            View Requests →
          </span>
        </Link>

        <Link
          href="/bookings"
          className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-2 w-fit rounded-lg bg-slate-50 text-slate-700 mb-2 group-hover:bg-slate-100 transition">
              <Calendar className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-slate-900">Bookings</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Confirmed appointments & history
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-900 mt-3 block">
            View Bookings →
          </span>
        </Link>
      </div>
    </div>
  );
}
