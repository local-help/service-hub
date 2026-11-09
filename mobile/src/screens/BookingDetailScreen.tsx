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
  Platform,
  Linking,
  Modal
} from 'react-native';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Star, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  CreditCard, 
  UserCheck, 
  Phone,
  X,
  Play,
  Check,
  RotateCcw,
  Shield,
} from 'lucide-react-native';
import { Booking, Provider } from '../types';
import { apiRequest } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { SupportBanner } from '../components/SupportBanner';
import { colors } from '../theme/colors';

interface Props {
  bookingId: number;
  onBack: () => void;
  onRefreshList: () => void;
}

const CANCEL_REASONS = [
  'Change in schedule / Need to reschedule',
  'Found an alternative service / Booked elsewhere',
  'Service no longer needed',
  'Pricing or quote mismatch',
  'Other reason',
];

export const BookingDetailScreen: React.FC<Props> = ({ bookingId, onBack, onRefreshList }) => {
  const { isAdmin } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  // Admin status dispatch
  const [showStatusPickerModal, setShowStatusPickerModal] = useState(false);
  const [adminTargetStatus, setAdminTargetStatus] = useState('');
  const [adminStatusNotes, setAdminStatusNotes] = useState('');

  // Reschedule Form
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Cancellation Modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonCategory, setCancelReasonCategory] = useState(CANCEL_REASONS[0]);
  const [cancelDetails, setCancelDetails] = useState('');

  // Rating & Feedback Form
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const fetchDetail = async () => {
    try {
      const data = await apiRequest<{ booking: Booking } | Booking>(`/bookings/${bookingId}`);
      const b = (data as any).booking || data;
      setBooking(b);
      if (b.rating) {
        setRating(b.rating);
        setFeedback(b.feedback || '');
        setFeedbackSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [bookingId]);

  const handleReschedule = async () => {
    if (!rescheduleDate.trim()) {
      Alert.alert('Required', 'Please enter your newly preferred date (YYYY-MM-DD).');
      return;
    }
    setActionLoading(true);
    try {
      await apiRequest(`/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({
          scheduled_at: `${rescheduleDate}T10:00:00`,
          preferred_date: rescheduleDate,
          reason: rescheduleReason || 'Customer requested reschedule',
        }),
      });
      Alert.alert('Rescheduled', 'Your appointment reschedule request has been submitted.');
      setShowReschedule(false);
      await fetchDetail();
      onRefreshList();
    } catch (err: any) {
      Alert.alert('Reschedule Failed', err.error || 'Failed to request reschedule');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminUpdateStatus = async (newStatus: string, notes?: string) => {
    Alert.alert(
      'Confirm Status Update',
      `Change booking status to "${newStatus.replace('_', ' ').toUpperCase()}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update Status',
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
              setShowStatusPickerModal(false);
              setAdminStatusNotes('');
              Alert.alert('Status Updated', `Booking status changed to ${newStatus.replace('_', ' ').toUpperCase()}.`);
              await fetchDetail();
              onRefreshList();
            } catch (err: any) {
              Alert.alert('Status Error', err.error || 'Failed to update status');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleConfirmCancel = async () => {
    setActionLoading(true);
    const finalReason = cancelDetails.trim()
      ? `${cancelReasonCategory} - ${cancelDetails.trim()}`
      : cancelReasonCategory;
    try {
      const endpoint = isAdmin ? `/admin/bookings/${bookingId}/cancel` : `/bookings/${bookingId}/cancel`;
      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reason: finalReason }),
      });
      setShowCancelModal(false);
      Alert.alert('Booking Cancelled', 'The booking has been cancelled.');
      await fetchDetail();
      onRefreshList();
    } catch (err: any) {
      Alert.alert('Cancellation Error', err.error || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayOnline = async () => {
    setPaying(true);
    try {
      const initRes = await apiRequest<{
        gateway_order_id: string;
        amount_cents: number;
        currency: string;
      }>(`/bookings/${bookingId}/payments/initiate`, {
        method: 'POST',
      });

      // Verification / settlement
      await apiRequest(`/bookings/${bookingId}/payments/verify`, {
        method: 'POST',
        body: JSON.stringify({
          gateway_order_id: initRes.gateway_order_id,
          gateway_reference: `pay_mock_${Date.now()}`,
          signature: 'sig_mock_verified',
        }),
      });

      Alert.alert('Payment Successful!', 'Your booking payment has been verified and settled.');
      await fetchDetail();
      onRefreshList();
    } catch (err: any) {
      Alert.alert('Payment Notice', err.error || 'Payment gateway connection completed or offline payment recorded.');
      await fetchDetail();
    } finally {
      setPaying(false);
    }
  };

  const handleSubmitFeedback = async () => {
    setActionLoading(true);
    try {
      await apiRequest(`/bookings/${bookingId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating, feedback }),
      });
      setFeedbackSubmitted(true);
      Alert.alert('Thank You!', 'Your rating and review have been recorded.');
      await fetchDetail();
      onRefreshList();
    } catch (err: any) {
      Alert.alert('Feedback Error', err.error || 'Failed to submit feedback');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !booking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isCompleted = booking.status === 'completed';
  const canRescheduleOrCancel = ['pending_review', 'contacting_provider', 'confirmed', 'rescheduled'].includes(booking.status);
  const provider: Provider | null = booking.provider || (booking.current_assignment ? {
    id: booking.current_assignment.provider_id,
    name: booking.current_assignment.provider_name || 'Assigned Technician',
    business_name: booking.current_assignment.provider_name,
    status: booking.current_assignment.status,
  } : null);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{booking.reference_number}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Admin Status Dispatch Panel */}
        {isAdmin && (
          <View style={styles.adminDispatchCard}>
            <View style={styles.adminDispatchHeader}>
              <View style={styles.adminBadgeRow}>
                <Shield size={14} color="#38bdf8" />
                <Text style={styles.adminBadgeText}>ADMIN STATUS DISPATCH</Text>
              </View>
              <TouchableOpacity
                style={styles.adminChangeStatusBtn}
                onPress={() => {
                  setAdminTargetStatus(booking.status);
                  setShowStatusPickerModal(true);
                }}
                activeOpacity={0.8}
              >
                <RotateCcw size={12} color="#38bdf8" />
                <Text style={styles.adminChangeStatusBtnText}>Change Status ▾</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.adminDispatchDesc}>
              Update booking state across the central Prayagraj dispatch queue:
            </Text>

            <View style={styles.adminActionRow}>
              {['confirmed', 'rescheduled'].includes(booking.status) && (
                <TouchableOpacity
                  style={[styles.adminActionBtn, { backgroundColor: '#0284c7' }]}
                  onPress={() => handleAdminUpdateStatus('in_progress')}
                  disabled={actionLoading}
                >
                  <Play size={13} color="#ffffff" fill="#ffffff" />
                  <Text style={styles.adminActionBtnText}>Start Work</Text>
                </TouchableOpacity>
              )}

              {['in_progress', 'confirmed'].includes(booking.status) && (
                <TouchableOpacity
                  style={[styles.adminActionBtn, { backgroundColor: '#059669' }]}
                  onPress={() => handleAdminUpdateStatus('completed')}
                  disabled={actionLoading}
                >
                  <Check size={14} color="#ffffff" />
                  <Text style={styles.adminActionBtnText}>Mark Completed</Text>
                </TouchableOpacity>
              )}

              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <TouchableOpacity
                  style={[styles.adminActionBtn, { backgroundColor: '#dc2626' }]}
                  onPress={() => setShowCancelModal(true)}
                  disabled={actionLoading}
                >
                  <X size={13} color="#ffffff" />
                  <Text style={styles.adminActionBtnText}>Cancel Booking</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Main Status Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Booking Status</Text>
            <View style={[styles.statusPill, isCompleted ? styles.pillCompleted : styles.pillActive]}>
              <Text style={[styles.statusText, isCompleted ? styles.textCompleted : styles.textActive]}>
                {booking.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.serviceName}>{booking.service_name || booking.service?.name}</Text>
          {booking.service_variant && (
            <Text style={styles.variantName}>Package: {booking.service_variant.name}</Text>
          )}

          <View style={styles.infoRow}>
            <Calendar size={16} color={colors.textMuted} />
            <Text style={styles.infoText}>
              {booking.scheduled_at 
                ? `Scheduled: ${new Date(booking.scheduled_at).toLocaleDateString()} at ${new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                : 'Schedule coordinating with provider'}
            </Text>
          </View>

          {booking.address && (
            <View style={styles.infoRow}>
              <MapPin size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>
                {booking.address.address_line}, {booking.address.city}
              </Text>
            </View>
          )}

          {/* Payment Box */}
          <View style={styles.paymentBox}>
            <View style={styles.cardRow}>
              <Text style={styles.paymentTitle}>Payment Status</Text>
              {booking.fully_paid ? (
                <View style={styles.settledBadge}>
                  <CheckCircle size={12} color={colors.successText} />
                  <Text style={styles.settledText}>Settled</Text>
                </View>
              ) : (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              )}
            </View>

            <Text style={styles.paymentAmount}>
              Paid: ₹{booking.total_paid} {booking.payment_amount || booking.total_amount ? `of ₹${booking.payment_amount || booking.total_amount}` : ''}
            </Text>
            <Text style={styles.paymentSubtitle}>
              {booking.fully_paid
                ? '✓ All charges are fully settled.'
                : 'Payment balance can be paid online below or offline upon doorstep job completion.'}
            </Text>

            {!booking.fully_paid && booking.status !== 'cancelled' && (
              <TouchableOpacity
                style={styles.payBtn}
                onPress={handlePayOnline}
                disabled={paying}
                activeOpacity={0.8}
              >
                {paying ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <CreditCard size={16} color="#ffffff" />
                    <Text style={styles.payBtnText}>Pay Online Now (UPI / Card)</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Assigned Provider Card */}
        {provider && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <UserCheck size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>Assigned Professional</Text>
            </View>
            <Text style={styles.providerName}>
              {provider.business_name || provider.name || 'Verified Technician'}
            </Text>
            {provider.description && (
              <Text style={styles.providerDesc}>{provider.description}</Text>
            )}
            {provider.business_address && (
              <Text style={styles.providerAddress}>📍 {provider.business_address}</Text>
            )}

            {provider.phone && (
              <TouchableOpacity
                style={styles.callProviderBtn}
                onPress={() => Linking.openURL(`tel:${provider.phone}`)}
              >
                <Phone size={14} color={colors.primary} />
                <Text style={styles.callProviderText}>Call Technician: {provider.phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Reschedule Box */}
        {showReschedule ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Request Date/Time Reschedule</Text>
            <TextInput
              placeholder="Preferred Date (YYYY-MM-DD) *"
              placeholderTextColor={colors.textLight}
              value={rescheduleDate}
              onChangeText={setRescheduleDate}
              style={styles.input}
            />
            <TextInput
              placeholder="Reason for reschedule..."
              placeholderTextColor={colors.textLight}
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
              style={styles.input}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowReschedule(false)}
              >
                <Text style={styles.cancelBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleReschedule}
                disabled={actionLoading}
              >
                <Text style={styles.confirmBtnText}>Submit Reschedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : canRescheduleOrCancel ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Manage Appointment</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.rescheduleBtn}
                onPress={() => setShowReschedule(true)}
              >
                <Text style={styles.rescheduleBtnText}>Request Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBookingBtn}
                onPress={() => setShowCancelModal(true)}
              >
                <Text style={styles.cancelBookingBtnText}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Customer Rating & Feedback (If completed) */}
        {isCompleted && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Service Rating & Feedback</Text>
            {feedbackSubmitted ? (
              <View style={styles.ratedBox}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={22}
                      color="#eab308"
                      fill={s <= rating ? '#eab308' : 'none'}
                    />
                  ))}
                </View>
                {feedback ? <Text style={styles.feedbackGiven}>"{feedback}"</Text> : null}
                <Text style={styles.thankYouText}>Thank you for your review!</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.rateLabel}>How was your service experience?</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                      <Star
                        size={28}
                        color="#eab308"
                        fill={s <= rating ? '#eab308' : 'none'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  multiline
                  numberOfLines={3}
                  placeholder="Share details about punctuality, work quality, and technician..."
                  placeholderTextColor={colors.textLight}
                  value={feedback}
                  onChangeText={setFeedback}
                  style={[styles.input, { height: 75, marginTop: 10 }]}
                />
                <TouchableOpacity
                  style={styles.submitReviewBtn}
                  onPress={handleSubmitFeedback}
                  disabled={actionLoading}
                >
                  <Text style={styles.submitReviewBtnText}>Submit Feedback</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Support Banner */}
        <SupportBanner 
          referenceNumber={booking.reference_number} 
          serviceName={booking.service_name || booking.service?.name} 
        />
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Structured Cancellation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Cancel Appointment</Text>
                <Text style={styles.modalSubtitle}>Please choose a reason to cancel</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.reasonList}>
              {CANCEL_REASONS.map((reason) => {
                const isSelected = cancelReasonCategory === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonItem, isSelected && styles.reasonItemSelected]}
                    onPress={() => setCancelReasonCategory(reason)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.reasonRadio, isSelected && styles.reasonRadioActive]}>
                      {isSelected && <View style={styles.reasonRadioInner} />}
                    </View>
                    <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              placeholder="Additional details (optional)..."
              placeholderTextColor={colors.textLight}
              value={cancelDetails}
              onChangeText={setCancelDetails}
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              multiline
            />

            <View style={styles.modalActionCol}>
              <TouchableOpacity
                style={styles.rescheduleInsteadBtn}
                onPress={() => {
                  setShowCancelModal(false);
                  setShowReschedule(true);
                }}
              >
                <Text style={styles.rescheduleInsteadText}>Reschedule Instead</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmCancelBtn, actionLoading && { opacity: 0.7 }]}
                onPress={handleConfirmCancel}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.confirmCancelText}>Confirm Cancellation</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Admin Status Picker Modal */}
      <Modal
        visible={showStatusPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusPickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Booking State</Text>
                <Text style={styles.modalSubtitle}>Dispatch state across platform in Prayagraj</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowStatusPickerModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.reasonList}>
              {[
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'in_progress', label: 'In Progress (Technician Working)' },
                { id: 'completed', label: 'Completed' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map((s) => {
                const isSelected = adminTargetStatus === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.reasonItem, isSelected && styles.reasonItemSelected]}
                    onPress={() => setAdminTargetStatus(s.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.reasonRadio, isSelected && styles.reasonRadioActive]}>
                      {isSelected && <View style={styles.reasonRadioInner} />}
                    </View>
                    <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              placeholder="Admin coordination notes (optional)..."
              placeholderTextColor={colors.textLight}
              value={adminStatusNotes}
              onChangeText={setAdminStatusNotes}
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.confirmCancelBtn,
                { backgroundColor: colors.primary, marginTop: 10 },
                (!adminTargetStatus || adminTargetStatus === booking.status) && { opacity: 0.5 },
              ]}
              onPress={() => handleAdminUpdateStatus(adminTargetStatus, adminStatusNotes)}
              disabled={actionLoading || !adminTargetStatus || adminTargetStatus === booking.status}
            >
              {actionLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.confirmCancelText}>Save Status Update</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 6,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  adminDispatchCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  adminDispatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  adminChangeStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adminChangeStatusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  adminDispatchDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 12,
  },
  adminActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  adminActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adminActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  textActive: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
  },
  pillCompleted: {
    backgroundColor: colors.successLight,
    borderColor: colors.successBorder,
  },
  textCompleted: {
    color: colors.successText,
    fontSize: 10,
    fontWeight: '800',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  variantName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  paymentBox: {
    backgroundColor: colors.borderSubtle,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  settledText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.successText,
  },
  pendingBadge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warningText,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.successText,
    marginTop: 2,
  },
  paymentSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  providerDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  providerAddress: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  callProviderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  callProviderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rescheduleBtn: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  rescheduleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  cancelBookingBtn: {
    flex: 1,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBookingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.borderSubtle,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  rateLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  submitReviewBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitReviewBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  ratedBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  feedbackGiven: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  thankYouText: {
    fontSize: 12,
    color: colors.successText,
    fontWeight: '600',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  reasonList: {
    gap: 8,
    marginBottom: 14,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  reasonItemSelected: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  reasonRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonRadioActive: {
    borderColor: colors.danger,
  },
  reasonRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  reasonTextActive: {
    color: colors.danger,
    fontWeight: '700',
  },
  modalActionCol: {
    gap: 8,
    marginTop: 10,
  },
  rescheduleInsteadBtn: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  rescheduleInsteadText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  confirmCancelBtn: {
    backgroundColor: colors.danger,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
