import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { User, Phone, Mail, MapPin, Plus, LogOut, CheckCircle, Shield, Edit3, Trash2, ArrowRight, Briefcase } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../types';
import { apiRequest } from '../api/client';
import { SupportBanner } from '../components/SupportBanner';
import { colors } from '../theme/colors';

interface Props {
  onLogout: () => void;
}

const PRAYAGRAJ_LOCALITIES = [
  { name: 'Civil Lines', pin: '211001' },
  { name: 'Katra', pin: '211002' },
  { name: 'Tagore Town', pin: '211002' },
  { name: 'Ashok Nagar', pin: '211001' },
  { name: 'Georgetown', pin: '211002' },
  { name: 'Mumfordganj', pin: '211002' },
  { name: 'Naini', pin: '211008' },
  { name: 'Jhunsi', pin: '211019' },
  { name: 'Dhoomanganj', pin: '211011' },
];

export const ProfileScreen: React.FC<Props> = ({ onLogout }) => {
  const { user, logout, refreshProfile, isAdmin, setViewMode } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  
  // Edit Profile State
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Add Address State
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrLine, setAddrLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Prayagraj');
  const [pincode, setPincode] = useState('211001');

  const fetchAddresses = async () => {
    try {
      const data = await apiRequest<{ addresses: Address[] } | Address[]>('/addresses');
      const list = Array.isArray(data) ? data : (data as any).addresses || [];
      setAddresses(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAddresses();
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    setSavingProfile(true);
    try {
      await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim() || undefined,
        }),
      });
      await refreshProfile();
      setEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async () => {
    if (!addrLine.trim()) {
      Alert.alert('Required', 'Address line is required.');
      return;
    }
    try {
      await apiRequest('/addresses', {
        method: 'POST',
        body: JSON.stringify({
          address: {
            label: addrLabel,
            address_line: addrLine,
            landmark: landmark || null,
            city,
            postal_code: pincode,
            state: 'Uttar Pradesh',
            is_default: addresses.length === 0,
          },
        }),
      });
      setShowAddAddr(false);
      setAddrLine('');
      setLandmark('');
      fetchAddresses();
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to save address');
    }
  };

  const handleDeleteAddress = (id: number) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this saved address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/addresses/${id}`, { method: 'DELETE' });
            fetchAddresses();
          } catch (err: any) {
            Alert.alert('Error', err.error || 'Failed to delete address');
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            onLogout();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Admin Workspace Switcher */}
        {isAdmin && (
          <View style={styles.adminCard}>
            <View style={styles.adminBadgeRow}>
              <View style={styles.adminPill}>
                <Shield size={12} color="#ffffff" />
                <Text style={styles.adminPillText}>ADMIN OPERATIONS</Text>
              </View>
              <Text style={styles.adminRoleText}>
                {user?.role === 'super_admin' ? 'Super Admin' : 'Staff Admin'}
              </Text>
            </View>
            <Text style={styles.adminCardTitle}>LocalHelp Admin Console</Text>
            <Text style={styles.adminCardDesc}>
              Switch to the Admin Workspace to manage the Prayagraj dispatch queue, assign specialists, approve providers, and review real-time booking revenue.
            </Text>
            <TouchableOpacity
              style={styles.adminSwitchBtn}
              onPress={() => setViewMode('admin')}
              activeOpacity={0.85}
            >
              <Shield size={16} color="#ffffff" />
              <Text style={styles.adminSwitchBtnText}>Open Admin Workspace</Text>
              <ArrowRight size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* User Profile Card */}
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
          <Text style={styles.userRole}>
            {user?.role.toUpperCase()} • Prayagraj
          </Text>

          <View style={styles.divider} />

          {editingProfile ? (
            <View style={styles.editSection}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={styles.input}
                placeholder="Full Name"
              />

              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                style={styles.input}
                placeholder="+91..."
              />

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.cancelFormBtn}
                  onPress={() => setEditingProfile(false)}
                >
                  <Text style={styles.cancelFormText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveFormBtn}
                  onPress={handleUpdateProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.saveFormText}>Save Profile</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.infoRow}>
                <Phone size={16} color={colors.textMuted} />
                <Text style={styles.infoText}>{user?.phone || 'No phone added'}</Text>
                {user?.phone_verified && (
                  <View style={styles.verifiedBadge}>
                    <CheckCircle size={12} color={colors.successText} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>

              {user?.email && (
                <View style={styles.infoRow}>
                  <Mail size={16} color={colors.textMuted} />
                  <Text style={styles.infoText}>{user.email}</Text>
                  {user.email_verified && (
                    <View style={styles.verifiedBadge}>
                      <CheckCircle size={12} color={colors.successText} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => setEditingProfile(true)}
              >
                <Edit3 size={14} color={colors.primary} />
                <Text style={styles.editProfileText}>Edit Contact Info</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Saved Addresses Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Saved Doorstep Addresses</Text>
            {!showAddAddr && (
              <TouchableOpacity onPress={() => setShowAddAddr(true)} style={styles.addBtn}>
                <Plus size={14} color={colors.primary} />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {showAddAddr && (
            <View style={styles.addForm}>
              <Text style={styles.localityHeader}>Quick Locality (Prayagraj):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {PRAYAGRAJ_LOCALITIES.map((loc) => (
                  <TouchableOpacity
                    key={loc.name}
                    style={[
                      styles.locChip,
                      landmark === loc.name && styles.locChipActive,
                    ]}
                    onPress={() => {
                      setLandmark(loc.name);
                      setPincode(loc.pin);
                      if (!addrLine) setAddrLine(`${loc.name}, Prayagraj`);
                    }}
                  >
                    <Text
                      style={[
                        styles.locChipText,
                        landmark === loc.name && styles.locChipTextActive,
                      ]}
                    >
                      📍 {loc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                placeholder="Label (e.g. Home, Office, Parents)"
                placeholderTextColor={colors.textLight}
                value={addrLabel}
                onChangeText={setAddrLabel}
                style={styles.input}
              />
              <TextInput
                placeholder="Street / House No *"
                placeholderTextColor={colors.textLight}
                value={addrLine}
                onChangeText={setAddrLine}
                style={styles.input}
              />
              <TextInput
                placeholder="Landmark (Optional)"
                placeholderTextColor={colors.textLight}
                value={landmark}
                onChangeText={setLandmark}
                style={styles.input}
              />
              <View style={styles.row}>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  style={[styles.input, { flex: 1 }]}
                />
                <TextInput
                  value={pincode}
                  onChangeText={setPincode}
                  style={[styles.input, { width: 90 }]}
                />
              </View>
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.cancelFormBtn}
                  onPress={() => setShowAddAddr(false)}
                >
                  <Text style={styles.cancelFormText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveFormBtn}
                  onPress={handleAddAddress}
                >
                  <Text style={styles.saveFormText}>Save Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {addresses.length === 0 && !showAddAddr ? (
            <Text style={styles.emptyText}>No addresses saved yet.</Text>
          ) : (
            <View style={styles.addressList}>
              {addresses.map((a) => (
                <View key={a.id} style={styles.addressItem}>
                  <MapPin size={16} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressLine}>{a.label ? `[${a.label}] ` : ''}{a.address_line}</Text>
                    <Text style={styles.addressSub}>{a.city} - {a.postal_code}</Text>
                  </View>
                  {a.is_default && (
                    <View style={styles.defaultPill}>
                      <Text style={styles.defaultPillText}>Default</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteAddress(a.id)}
                    style={styles.deleteAddrBtn}
                  >
                    <Trash2 size={14} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Partner with LocalHelp Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Briefcase size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>Partner With LocalHelp</Text>
            </View>
          </View>
          <Text style={styles.partnerCardDesc}>
            Are you a skilled technician or home service professional in Prayagraj? We offer fixed tariffs, zero customer bargaining, and guaranteed weekly payouts.
          </Text>
          <TouchableOpacity
            style={styles.partnerContactBtn}
            onPress={() => Linking.openURL('tel:+919999900001')}
            activeOpacity={0.8}
          >
            <Phone size={14} color={colors.primary} />
            <Text style={styles.partnerContactBtnText}>Contact Operations Team to Join</Text>
          </TouchableOpacity>
        </View>

        {/* Support Banner */}
        <SupportBanner compact />

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={16} color={colors.danger} />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  content: {
    padding: 16,
  },
  adminCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  adminPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  adminRoleText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  adminCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
  },
  adminCardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 14,
  },
  adminSwitchBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  adminSwitchBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 14,
  },
  editSection: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.successText,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  addressList: {
    gap: 8,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressLine: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  addressSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  defaultPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteAddrBtn: {
    padding: 4,
  },
  addForm: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  localityHeader: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 6,
  },
  locChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.borderSubtle,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  locChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  locChipTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelFormBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.borderSubtle,
    borderRadius: 8,
  },
  cancelFormText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveFormBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  saveFormText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  partnerCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  partnerContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 10,
    borderRadius: 10,
  },
  partnerContactBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
