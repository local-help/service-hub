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
  Platform,
  Modal,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Check,
  Play,
  RotateCcw,
  Shield,
  Layers,
} from 'lucide-react-native';
import { ServiceRequest, Provider } from '../../types';
import { apiRequest } from '../../api/client';
import { colors } from '../../theme/colors';

interface Props {
  requestId: number;
  onBack: () => void;
  onRefreshList: () => void;
}

export const AdminRequestDetailScreen: React.FC<Props> = ({ requestId, onBack, onRefreshList }) => {
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Assign provider modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [assignNotes, setAssignNotes] = useState('');

  // Status transition modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTargetStatus, setSelectedTargetStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');

  const handleUpdateStatus = async (newStatus: string, notes?: string) => {
    Alert.alert(
      'Confirm Status Update',
      `Change request status to "${newStatus.replace('_', ' ').toUpperCase()}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update Status',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiRequest(`/admin/service_requests/${requestId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                  status: newStatus,
                  admin_notes: notes ? notes.trim() : undefined,
                }),
              });
              setShowStatusModal(false);
              setStatusNotes('');
              Alert.alert('Status Updated!', `Request status changed to ${newStatus.replace('_', ' ').toUpperCase()}.`);
              await fetchDetail();
              onRefreshList();
            } catch (err: any) {
              Alert.alert('Status Update Failed', err.error || 'Failed to update status');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateBookingStatus = async (newStatus: string) => {
    if (!request?.booking?.id) return;
    Alert.alert(
      'Update Booking Status',
      `Change linked booking #${request.booking.id} to "${newStatus.replace('_', ' ').toUpperCase()}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiRequest(`/admin/bookings/${request.booking!.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
              });
              Alert.alert('Booking Updated', `Booking status changed to ${newStatus.replace('_', ' ').toUpperCase()}.`);
              await fetchDetail();
              onRefreshList();
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to update booking');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const fetchDetail = async () => {
    try {
      const [reqData, provData] = await Promise.all([
        apiRequest<ServiceRequest | { service_request: ServiceRequest }>(`/admin/service_requests/${requestId}`),
        apiRequest<Provider[] | { providers: Provider[] }>('/admin/providers?status=active').catch(() => []),
      ]);
      const req = (reqData as any).service_request || reqData;
      const provs = Array.isArray(provData) ? provData : (provData as any).providers || [];
      setRequest(req);
      setProviders(provs);
      if (req.provider?.id) {
        setSelectedProviderId(req.provider.id);
      }
    } catch (err) {
      console.error('Failed to load request detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [requestId]);

  const handleAssignProvider = async () => {
    if (!selectedProviderId) {
      Alert.alert('Required', 'Please select a specialist provider from the list.');
      return;
    }
    setActionLoading(true);
    try {
      await apiRequest(`/admin/service_requests/${requestId}/assign_provider`, {
        method: 'POST',
        body: JSON.stringify({
          provider_id: selectedProviderId,
          notes: assignNotes.trim() || undefined,
        }),
      });
      setShowAssignModal(false);
      setAssignNotes('');
      Alert.alert('Assigned!', 'Technician has been assigned to this service request.');
      await fetchDetail();
      onRefreshList();
    } catch (err: any) {
      Alert.alert('Assignment Failed', err.error || 'Failed to assign provider');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallCustomer = () => {
    const phone = request?.customer_phone || (request as any).user?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return { bg: colors.warningLight, text: colors.warningText, border: colors.warningBorder, label: 'Needs Match' };
      case 'contacting_provider':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', label: 'Specialist Assigned' };
      case 'booking_confirmed':
      case 'customer_approved':
        return { bg: colors.successLight, text: colors.successText, border: colors.successBorder, label: 'Confirmed' };
      case 'in_progress':
        return { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe', label: 'In Progress' };
      case 'completed':
        return { bg: colors.borderSubtle, text: colors.textSecondary, border: colors.border, label: 'Completed' };
      default:
        return { bg: colors.borderSubtle, text: colors.textMuted, border: colors.border, label: status.replace(/_/g, ' ') };
    }
  };

  if (loading || !request) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Request Details...</Text>
      </View>
    );
  }

  const badge = getStatusBadge(request.status);
  const custName = request.customer_name || (request as any).user?.name || 'Customer';
  const custPhone = request.customer_phone || (request as any).user?.phone || '';
  const currentProvider = request.provider;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle}>{request.reference_number}</Text>
          <Text style={styles.topSub}>Triage & Specialist Dispatch</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Service & Customer Summary */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>SERVICE REQUEST INFO</Text>
          <Text style={styles.serviceName}>{request.service_name || request.service?.name}</Text>
          {request.service_variant && (
            <Text style={styles.packageName}>Package: {request.service_variant.name}</Text>
          )}

          {request.description ? (
            <Text style={styles.descText}>"{request.description}"</Text>
          ) : null}

          <View style={styles.divider} />

          {/* Customer Contacts */}
          <View style={styles.customerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{custName}</Text>
              {custPhone ? <Text style={styles.customerPhone}>📱 {custPhone}</Text> : null}
            </View>
            {custPhone ? (
              <TouchableOpacity style={styles.callBtn} onPress={handleCallCustomer}>
                <Phone size={14} color="#ffffff" />
                <Text style={styles.callBtnText}>Call Customer</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Address */}
          {request.address && (
            <View style={styles.metaRow}>
              <MapPin size={14} color={colors.primary} />
              <Text style={styles.metaText}>
                {request.address.address_line}, {request.address.city} - {request.address.postal_code}
              </Text>
            </View>
          )}

          {/* Schedule */}
          {request.preferred_at && (
            <View style={styles.metaRow}>
              <Clock size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>
                Scheduled: {new Date(request.preferred_at).toLocaleDateString()} at{' '}
                {new Date(request.preferred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        </View>

        {/* Status Lifecycle & Dispatch Control */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Layers size={16} color={colors.primary} />
              <Text style={styles.cardHeaderTitle}>FULFILLMENT STATUS & DISPATCH</Text>
            </View>
            <TouchableOpacity
              style={styles.statusActionBtn}
              onPress={() => {
                setSelectedTargetStatus(request.status);
                setShowStatusModal(true);
              }}
              activeOpacity={0.8}
            >
              <RotateCcw size={12} color={colors.primary} />
              <Text style={styles.statusActionText}>Change Status ▾</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusRowContainer}>
            <View style={[styles.statusBadgeLarge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
              <Text style={[styles.statusBadgeLargeText, { color: badge.text }]}>
                CURRENT: {badge.label.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Quick Lifecycle Actions */}
          <View style={styles.quickActionsGrid}>
            {['pending_review', 'quotation_rejected'].includes(request.status) && (
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: '#0284c7' }]}
                onPress={() => setShowAssignModal(true)}
                disabled={actionLoading}
              >
                <Briefcase size={14} color="#ffffff" />
                <Text style={styles.quickBtnText}>Assign Specialist Provider</Text>
              </TouchableOpacity>
            )}

            {['contacting_provider', 'quotation_approved'].includes(request.status) && (
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: colors.success }]}
                onPress={() => handleUpdateStatus('booking_confirmed')}
                disabled={actionLoading}
              >
                <Check size={14} color="#ffffff" />
                <Text style={styles.quickBtnText}>Confirm Booking</Text>
              </TouchableOpacity>
            )}

            {['contacting_provider', 'booking_confirmed'].includes(request.status) && (
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: '#6366f1' }]}
                onPress={() => handleUpdateStatus('in_progress')}
                disabled={actionLoading}
              >
                <Play size={14} color="#ffffff" fill="#ffffff" />
                <Text style={styles.quickBtnText}>Start Work (In Progress)</Text>
              </TouchableOpacity>
            )}

            {['in_progress', 'booking_confirmed'].includes(request.status) && (
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: '#10b981' }]}
                onPress={() => handleUpdateStatus('completed')}
                disabled={actionLoading}
              >
                <CheckCircle2 size={14} color="#ffffff" />
                <Text style={styles.quickBtnText}>Mark Job Completed</Text>
              </TouchableOpacity>
            )}

            {request.status !== 'completed' && request.status !== 'cancelled' && (
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: colors.dangerLight, borderColor: colors.dangerBorder, borderWidth: 1 }]}
                onPress={() => handleUpdateStatus('cancelled', 'Cancelled by admin from mobile')}
                disabled={actionLoading}
              >
                <X size={14} color={colors.danger} />
                <Text style={[styles.quickBtnText, { color: colors.danger }]}>Cancel Request</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Linked Booking Card if exists */}
        {request.booking && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <Calendar size={16} color={colors.primary} />
                <Text style={styles.cardHeaderTitle}>LINKED PLATFORM BOOKING</Text>
              </View>
              <View style={styles.bookingStatusPill}>
                <Text style={styles.bookingStatusText}>
                  {request.booking.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.bookingRefText}>Booking Ref: {request.booking.reference_number}</Text>

            {/* Quick booking action */}
            <View style={styles.quickActionsGrid}>
              {request.booking.status === 'confirmed' && (
                <TouchableOpacity
                  style={[styles.quickBtn, { backgroundColor: '#6366f1' }]}
                  onPress={() => handleUpdateBookingStatus('in_progress')}
                  disabled={actionLoading}
                >
                  <Play size={14} color="#ffffff" fill="#ffffff" />
                  <Text style={styles.quickBtnText}>Start Booking Work</Text>
                </TouchableOpacity>
              )}

              {request.booking.status === 'in_progress' && (
                <TouchableOpacity
                  style={[styles.quickBtn, { backgroundColor: '#10b981' }]}
                  onPress={() => handleUpdateBookingStatus('completed')}
                  disabled={actionLoading}
                >
                  <Check size={14} color="#ffffff" />
                  <Text style={styles.quickBtnText}>Complete Booking</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Specialist Assignment Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Briefcase size={16} color={colors.primary} />
              <Text style={styles.cardHeaderTitle}>ASSIGNED SPECIALIST</Text>
            </View>
            <TouchableOpacity
              style={styles.assignActionBtn}
              onPress={() => setShowAssignModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.assignActionText}>
                {currentProvider ? 'Change Provider' : '+ Assign Provider'}
              </Text>
            </TouchableOpacity>
          </View>

          {currentProvider ? (
            <View style={styles.providerInfoBox}>
              <Text style={styles.providerName}>{currentProvider.business_name || currentProvider.name}</Text>
              {currentProvider.phone ? (
                <Text style={styles.providerSub}>Phone: {currentProvider.phone}</Text>
              ) : null}
              {currentProvider.business_address ? (
                <Text style={styles.providerSub}>Base: {currentProvider.business_address}</Text>
              ) : null}
              <View style={styles.verifiedRow}>
                <ShieldCheck size={12} color={colors.successText} />
                <Text style={styles.verifiedText}>Verified Local Help Professional</Text>
              </View>
            </View>
          ) : (
            <View style={styles.unassignedBox}>
              <AlertCircle size={24} color={colors.warningText} />
              <View style={{ flex: 1 }}>
                <Text style={styles.unassignedTitle}>No Provider Assigned Yet</Text>
                <Text style={styles.unassignedSub}>
                  Select a verified technician from your active roster to fulfill this booking.
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Provider Assignment Modal */}
      <Modal
        visible={showAssignModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Assign Specialist</Text>
                <Text style={styles.modalSub}>Select from verified active providers in Prayagraj</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAssignModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.provScroll} showsVerticalScrollIndicator={false}>
              {providers.length === 0 ? (
                <Text style={styles.emptyProvText}>No active providers registered.</Text>
              ) : (
                providers.map((p) => {
                  const isSelected = selectedProviderId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.provItem, isSelected && styles.provItemSelected]}
                      onPress={() => setSelectedProviderId(p.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.provRadio, isSelected && styles.provRadioActive]}>
                        {isSelected && <View style={styles.provRadioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.provName, isSelected && { color: colors.primary }]}>
                          {p.business_name || p.name}
                        </Text>
                        <Text style={styles.provPhone}>📞 {p.phone || 'No phone'}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TextInput
              placeholder="Routing notes for technician (optional)..."
              placeholderTextColor={colors.textLight}
              value={assignNotes}
              onChangeText={setAssignNotes}
              style={styles.notesInput}
            />

            <TouchableOpacity
              style={[styles.confirmAssignBtn, actionLoading && { opacity: 0.7 }]}
              onPress={handleAssignProvider}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.confirmAssignBtnText}>Confirm Assignment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Status Transition Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Request State</Text>
                <Text style={styles.modalSub}>Transition request status in the Prayagraj dispatch queue</Text>
              </View>
              <TouchableOpacity onPress={() => setShowStatusModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 280, marginBottom: 12 }} showsVerticalScrollIndicator={false}>
              {[
                { id: 'pending_review', label: 'Needs Match (Pending Review)' },
                { id: 'contacting_provider', label: 'Specialist Assigned' },
                { id: 'booking_confirmed', label: 'Booking Confirmed' },
                { id: 'in_progress', label: 'Work In Progress' },
                { id: 'completed', label: 'Job Completed' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map((s) => {
                const isSelected = selectedTargetStatus === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.provItem, isSelected && styles.provItemSelected]}
                    onPress={() => setSelectedTargetStatus(s.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.provRadio, isSelected && styles.provRadioActive]}>
                      {isSelected && <View style={styles.provRadioInner} />}
                    </View>
                    <Text style={[styles.provName, isSelected && { color: colors.primary }]}>
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
              value={statusNotes}
              onChangeText={setStatusNotes}
            />

            <TouchableOpacity
              style={[styles.confirmAssignBtn, (!selectedTargetStatus || selectedTargetStatus === request.status) && { opacity: 0.5 }]}
              onPress={() => handleUpdateStatus(selectedTargetStatus, statusNotes)}
              disabled={actionLoading || !selectedTargetStatus || selectedTargetStatus === request.status}
            >
              {actionLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.confirmAssignBtnText}>Save Status Update</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 6,
  },
  topTitleWrap: {
    flex: 1,
    marginLeft: 8,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  topSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 4,
  },
  packageName: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  descText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 18,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  customerPhone: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  statusActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  statusActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  statusRowContainer: {
    marginVertical: 10,
  },
  statusBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeLargeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickActionsGrid: {
    gap: 8,
    marginTop: 8,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  quickBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  bookingStatusPill: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bookingStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.successText,
  },
  bookingRefText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  assignActionBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  assignActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  providerInfoBox: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    padding: 12,
    borderRadius: 12,
  },
  providerName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  providerSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.successText,
  },
  unassignedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    padding: 12,
    borderRadius: 12,
  },
  unassignedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warningText,
  },
  unassignedSub: {
    fontSize: 11,
    color: colors.warningText,
    marginTop: 2,
    lineHeight: 16,
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
  provScroll: {
    maxHeight: 220,
    marginBottom: 12,
  },
  emptyProvText: {
    fontSize: 12,
    color: colors.textMuted,
    padding: 12,
    textAlign: 'center',
  },
  provItem: {
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
  provItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  provRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  provRadioActive: {
    borderColor: colors.primary,
  },
  provRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  provName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  provPhone: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
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
  confirmAssignBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmAssignBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

