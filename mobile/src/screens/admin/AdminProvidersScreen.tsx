import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import {
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  Power,
  Plus,
  X,
  User,
  Mail,
  Lock,
} from 'lucide-react-native';
import { Provider } from '../../types';
import { apiRequest } from '../../api/client';
import { colors } from '../../theme/colors';

const FILTER_TABS = [
  { id: 'all', label: 'All Providers' },
  { id: 'pending', label: 'Needs Verification' },
  { id: 'verified', label: 'Verified' },
  { id: 'active', label: 'Active Roster' },
];

export const AdminProvidersScreen: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Onboarding Modal State
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('+91');
  const [email, setEmail] = useState('');
  const [locality, setLocality] = useState('Civil Lines');
  const [password, setPassword] = useState('Provider@123456');
  const [onboardLoading, setOnboardLoading] = useState(false);

  const handleOnboardProvider = async () => {
    if (!businessName.trim()) {
      Alert.alert('Required', 'Please enter a business or specialist name.');
      return;
    }
    if (!phone.trim() || phone.trim() === '+91') {
      Alert.alert('Required', 'Please enter a valid phone number.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter an email address for login.');
      return;
    }

    setOnboardLoading(true);
    try {
      await apiRequest('/admin/providers', {
        method: 'POST',
        body: JSON.stringify({
          name: businessName.trim(),
          business_name: businessName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          contact_person: contactPerson.trim() || businessName.trim(),
          contact_phone: phone.trim(),
          city: 'Prayagraj',
          service_area: locality,
          verification_status: 'verified',
          operational_status: 'active',
          user: {
            name: contactPerson.trim() || businessName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password: password.trim() || 'Provider@123456',
          },
        }),
      });

      setShowOnboardModal(false);
      setBusinessName('');
      setContactPerson('');
      setPhone('+91');
      setEmail('');
      setPassword('Provider@123456');
      Alert.alert(
        'Specialist Onboarded!',
        `Provider "${businessName.trim()}" has been registered and verified.\n\nLogin credentials:\nEmail: ${email.trim()}\nPassword: ${password.trim() || 'Provider@123456'}`
      );
      fetchProviders();
    } catch (err: any) {
      Alert.alert('Onboarding Failed', err.error || 'Failed to register provider');
    } finally {
      setOnboardLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const data = await apiRequest<Provider[] | { providers: Provider[] }>('/admin/providers');
      const list = Array.isArray(data) ? data : (data as any).providers || [];
      setProviders(list);
    } catch (err) {
      console.error('Failed to load admin providers', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProviders();
  };

  const handleVerifyProvider = async (provider: Provider) => {
    Alert.alert(
      'Verify Specialist',
      `Approve verification for ${provider.business_name || provider.name}? This activates their eligibility to accept customer bookings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Verify',
          onPress: async () => {
            setActionLoadingId(provider.id);
            try {
              await apiRequest(`/admin/providers/${provider.id}/verify`, { method: 'POST' });
              Alert.alert('Verified', 'Specialist has been verified successfully.');
              fetchProviders();
            } catch (err: any) {
              Alert.alert('Verification Failed', err.error || 'Unable to verify provider');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (provider: Provider) => {
    const isCurrentlyActive = provider.operational_status === 'active' || (provider as any).active;
    const action = isCurrentlyActive ? 'deactivate' : 'activate';
    setActionLoadingId(provider.id);
    try {
      await apiRequest(`/admin/providers/${provider.id}/${action}`, { method: 'POST' });
      fetchProviders();
    } catch (err: any) {
      Alert.alert('Action Failed', err.error || `Failed to ${action} provider`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredProviders = providers.filter((p) => {
    if (activeFilter === 'pending') return p.verification_status === 'pending';
    if (activeFilter === 'verified') return p.verification_status === 'verified';
    if (activeFilter === 'active') return p.operational_status === 'active' || (p as any).active;
    return true;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Specialist Directory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Provider Roster</Text>
            <Text style={styles.subtitle}>Onboarding verification & fleet in Prayagraj</Text>
          </View>
          <TouchableOpacity
            style={styles.onboardBtn}
            onPress={() => setShowOnboardModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={14} color="#ffffff" />
            <Text style={styles.onboardBtnText}>Onboard</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(tab.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredProviders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Briefcase size={36} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No matching providers</Text>
            <Text style={styles.emptySubtitle}>No specialists found for the selected filter.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredProviders.map((p) => {
              const isVerified = p.verification_status === 'verified';
              const isActive = p.operational_status === 'active' || (p as any).active;
              const isBusy = actionLoadingId === p.id;

              return (
                <View key={p.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.providerName}>{p.business_name || p.name}</Text>
                      {p.name && p.business_name ? (
                        <Text style={styles.contactName}>Contact: {p.name}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.statusBadge, isVerified ? styles.verifiedBadge : styles.pendingBadge]}>
                      {isVerified ? (
                        <ShieldCheck size={12} color={colors.successText} />
                      ) : (
                        <AlertCircle size={12} color={colors.warningText} />
                      )}
                      <Text style={[styles.statusText, isVerified ? styles.verifiedText : styles.pendingText]}>
                        {isVerified ? 'Verified' : 'Pending Verification'}
                      </Text>
                    </View>
                  </View>

                  {p.description ? (
                    <Text style={styles.descText} numberOfLines={2}>
                      {p.description}
                    </Text>
                  ) : null}

                  {p.phone ? (
                    <TouchableOpacity
                      style={styles.phoneRow}
                      onPress={() => Linking.openURL(`tel:${p.phone}`)}
                      activeOpacity={0.7}
                    >
                      <Phone size={13} color={colors.primary} />
                      <Text style={styles.phoneText}>Call: {p.phone}</Text>
                    </TouchableOpacity>
                  ) : null}

                  {p.business_address ? (
                    <View style={styles.metaRow}>
                      <MapPin size={13} color={colors.textMuted} />
                      <Text style={styles.metaText}>{p.business_address}</Text>
                    </View>
                  ) : null}

                  {/* Actions Row */}
                  <View style={styles.actionRow}>
                    <View style={styles.activeStatusPill}>
                      <View style={[styles.activeDot, isActive ? styles.dotGreen : styles.dotGray]} />
                      <Text style={styles.activeStatusText}>
                        {isActive ? 'Operational (Active)' : 'Inactive'}
                      </Text>
                    </View>

                    <View style={styles.btnGroup}>
                      {!isVerified && (
                        <TouchableOpacity
                          style={styles.verifyBtn}
                          onPress={() => handleVerifyProvider(p)}
                          disabled={isBusy}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.verifyBtnText}>Approve</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.toggleBtn, isActive ? styles.toggleDeactivate : styles.toggleActivate]}
                        onPress={() => handleToggleActive(p)}
                        disabled={isBusy}
                        activeOpacity={0.8}
                      >
                        {isBusy ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.toggleBtnText}>
                            {isActive ? 'Pause' : 'Activate'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Onboard Provider Modal */}
      <Modal
        visible={showOnboardModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOnboardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Onboard Specialist Provider</Text>
                <Text style={styles.modalSub}>
                  Register a verified local technician organization in Prayagraj
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowOnboardModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>BUSINESS / SPECIALIST NAME *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Apex Home Solutions"
                placeholderTextColor={colors.textLight}
                value={businessName}
                onChangeText={setBusinessName}
              />

              <Text style={styles.inputLabel}>CONTACT PERSON NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Rajesh Kumar"
                placeholderTextColor={colors.textLight}
                value={contactPerson}
                onChangeText={setContactPerson}
              />

              <Text style={styles.inputLabel}>PHONE NUMBER (FOR DISPATCH) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="+91..."
                placeholderTextColor={colors.textLight}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>OPERATING LOCALITY (PRAYAGRAJ)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {['Civil Lines', 'Katra', 'Tagore Town', 'Georgetown', 'Mumfordganj', 'Naini', 'Dhoomanganj'].map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.locChip, locality === loc && styles.locChipActive]}
                    onPress={() => setLocality(loc)}
                  >
                    <Text style={[styles.locChipText, locality === loc && styles.locChipTextActive]}>
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.accountSection}>
                <Text style={styles.accountSectionTitle}>PROVIDER LOGIN ACCOUNT</Text>
                <Text style={styles.inputLabel}>LOGIN EMAIL *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="provider@localhelp.in"
                  placeholderTextColor={colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={styles.inputLabel}>PASSWORD *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Provider@123456"
                  placeholderTextColor={colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.confirmOnboardBtn, onboardLoading && { opacity: 0.6 }]}
              onPress={handleOnboardProvider}
              disabled={onboardLoading}
            >
              {onboardLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.confirmOnboardText}>Register & Verify Specialist</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  onboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  onboardBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  filterScroll: {
    marginHorizontal: -16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 6,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.borderSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  contactName: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  verifiedBadge: {
    backgroundColor: colors.successLight,
    borderColor: colors.successBorder,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.successText,
  },
  pendingBadge: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warningBorder,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warningText,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  descText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  phoneText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: colors.successText,
  },
  dotGray: {
    backgroundColor: colors.textLight,
  },
  activeStatusText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  verifyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleActivate: {
    backgroundColor: colors.successLight,
    borderColor: colors.successBorder,
  },
  toggleDeactivate: {
    backgroundColor: colors.borderSubtle,
    borderColor: colors.border,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    marginTop: 10,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  locChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
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
    color: colors.textSecondary,
    fontWeight: '600',
  },
  locChipTextActive: {
    color: '#ffffff',
  },
  accountSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
    marginBottom: 14,
  },
  accountSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  confirmOnboardBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmOnboardText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

