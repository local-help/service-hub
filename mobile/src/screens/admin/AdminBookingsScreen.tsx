import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  MapPin,
  CreditCard,
  Play,
  Check,
  RotateCcw,
  X,
} from 'lucide-react-native';
import { Booking } from '../../types';
import { apiRequest } from '../../api/client';
import { colors } from '../../theme/colors';

interface Props {
  onSelectBooking: (bookingId: number) => void;
}

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const AdminBookingsScreen: React.FC<Props> = ({ onSelectBooking }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Status modal state
  const [selectedBookingForStatus, setSelectedBookingForStatus] = useState<Booking | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');

  const handleUpdateStatus = async (bookingId: number, newStatus: string, notes?: string) => {
    Alert.alert(
      'Update Booking Status',
      `Change booking #${bookingId} status to ${newStatus.replace('_', ' ').toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiRequest(`/admin/bookings/${bookingId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                  status: newStatus,
                  admin_notes: notes ? notes.trim() : undefined,
                }),
              });
              setSelectedBookingForStatus(null);
              setAdminNotes('');
              Alert.alert('Status Updated', `Booking status changed to ${newStatus.replace('_', ' ').toUpperCase()}.`);
              fetchBookings();
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to update booking status');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const fetchBookings = async () => {
    try {
      const data = await apiRequest<Booking[] | { bookings: Booking[] }>('/admin/bookings');
      const list = Array.isArray(data) ? data : (data as any).bookings || [];
      setBookings(list);
    } catch (err) {
      console.error('Failed to load admin bookings', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === 'all') return true;
    return b.status === activeFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: colors.successLight, text: colors.successText, border: colors.successBorder, label: 'Confirmed' };
      case 'in_progress':
        return { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe', label: 'In Progress' };
      case 'completed':
        return { bg: colors.borderSubtle, text: colors.textSecondary, border: colors.border, label: 'Completed' };
      case 'cancelled':
        return { bg: colors.dangerLight, text: colors.dangerText, border: colors.dangerBorder, label: 'Cancelled' };
      default:
        return { bg: colors.borderSubtle, text: colors.textMuted, border: colors.border, label: status.replace(/_/g, ' ') };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Platform Bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Bookings</Text>
        <Text style={styles.subtitle}>Scheduled doorstep jobs, technician fulfillment & settlements</Text>

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
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={36} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No matching bookings</Text>
            <Text style={styles.emptySubtitle}>No appointments found for the selected status.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredBookings.map((b) => {
              const badge = getStatusBadge(b.status);
              const custName = (b as any).customer_name || (b as any).user?.name || 'Customer';
              const custPhone = (b as any).customer_phone || (b as any).user?.phone || '';
              const provName = b.provider?.business_name || b.provider?.name || (b as any).provider_name;

              return (
                <TouchableOpacity
                  key={b.id}
                  style={styles.card}
                  onPress={() => onSelectBooking(b.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.refNumber}>{b.reference_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.serviceName}>{b.service_name || b.service?.name || 'Home Service'}</Text>

                  {/* Customer */}
                  <View style={styles.metaRow}>
                    <User size={13} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      <Text style={styles.metaBold}>{custName}</Text> {custPhone ? `• ${custPhone}` : ''}
                    </Text>
                  </View>

                  {/* Provider */}
                  <View style={styles.metaRow}>
                    <Briefcase size={13} color={colors.primary} />
                    <Text style={styles.metaText}>
                      Specialist: <Text style={styles.metaBold}>{provName || 'Unassigned'}</Text>
                    </Text>
                  </View>

                  {/* Schedule */}
                  <View style={styles.metaRow}>
                    <Clock size={13} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      {b.scheduled_at
                        ? `${new Date(b.scheduled_at).toLocaleDateString()} at ${new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Date coordinating'}
                    </Text>
                  </View>

                  {/* Payment */}
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentText}>
                      Tariff: <Text style={styles.paymentBold}>₹{b.total_amount || b.payment_amount || 0}</Text>
                    </Text>
                    <View style={[styles.settledPill, b.fully_paid ? styles.settledGreen : styles.settledAmber]}>
                      <Text style={[styles.settledText, b.fully_paid ? { color: colors.successText } : { color: colors.warningText }]}>
                        {b.fully_paid ? '✓ Settled' : 'Pending Payment'}
                      </Text>
                    </View>
                  </View>

                  {/* Status Actions Row */}
                  <View style={styles.cardActionsRow}>
                    {['confirmed', 'rescheduled'].includes(b.status) && (
                      <TouchableOpacity
                        style={styles.actionBtnStart}
                        onPress={() => handleUpdateStatus(b.id, 'in_progress')}
                        disabled={actionLoading}
                        activeOpacity={0.8}
                      >
                        <Play size={11} color="#ffffff" fill="#ffffff" />
                        <Text style={styles.actionBtnText}>Start Work</Text>
                      </TouchableOpacity>
                    )}

                    {['in_progress', 'confirmed'].includes(b.status) && (
                      <TouchableOpacity
                        style={styles.actionBtnComplete}
                        onPress={() => handleUpdateStatus(b.id, 'completed')}
                        disabled={actionLoading}
                        activeOpacity={0.8}
                      >
                        <Check size={12} color="#ffffff" />
                        <Text style={styles.actionBtnText}>Complete</Text>
                      </TouchableOpacity>
                    )}

                    {b.status !== 'completed' && b.status !== 'cancelled' && (
                      <TouchableOpacity
                        style={styles.actionBtnMore}
                        onPress={() => {
                          setSelectedBookingForStatus(b);
                          setTargetStatus(b.status);
                        }}
                        disabled={actionLoading}
                        activeOpacity={0.8}
                      >
                        <RotateCcw size={11} color={colors.textSecondary} />
                        <Text style={styles.actionBtnMoreText}>Status ▾</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Admin Status Change Modal */}
      <Modal
        visible={selectedBookingForStatus !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedBookingForStatus(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Booking State</Text>
                <Text style={styles.modalSub}>
                  Booking #{selectedBookingForStatus?.id} ({selectedBookingForStatus?.reference_number})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedBookingForStatus(null)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 240, marginBottom: 12 }} showsVerticalScrollIndicator={false}>
              {[
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'in_progress', label: 'In Progress (Technician Working)' },
                { id: 'completed', label: 'Completed' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map((s) => {
                const isSelected = targetStatus === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.statusOptionItem, isSelected && styles.statusOptionItemSelected]}
                    onPress={() => setTargetStatus(s.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.statusRadio, isSelected && styles.statusRadioActive]}>
                      {isSelected && <View style={styles.statusRadioInner} />}
                    </View>
                    <Text style={[styles.statusOptionText, isSelected && { color: colors.primary }]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TextInput
              style={styles.notesInput}
              placeholder="Admin coordination notes (optional)"
              placeholderTextColor={colors.textLight}
              value={adminNotes}
              onChangeText={setAdminNotes}
            />

            <TouchableOpacity
              style={[
                styles.confirmStatusBtn,
                (!targetStatus || targetStatus === selectedBookingForStatus?.status) && { opacity: 0.5 },
              ]}
              onPress={() => {
                if (selectedBookingForStatus && targetStatus) {
                  handleUpdateStatus(selectedBookingForStatus.id, targetStatus, adminNotes);
                }
              }}
              disabled={
                actionLoading || !targetStatus || targetStatus === selectedBookingForStatus?.status
              }
            >
              {actionLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.confirmStatusBtnText}>Save Status Update</Text>
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
    gap: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  refNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  paymentText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  paymentBold: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  settledPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  settledGreen: {
    backgroundColor: colors.successLight,
    borderColor: colors.successBorder,
  },
  settledAmber: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warningBorder,
  },
  settledText: {
    fontSize: 10,
    fontWeight: '700',
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
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  actionBtnStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnMoreText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
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
    maxHeight: '80%',
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
  statusOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: 8,
  },
  statusOptionItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  statusRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRadioActive: {
    borderColor: colors.primary,
  },
  statusRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  confirmStatusBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmStatusBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

